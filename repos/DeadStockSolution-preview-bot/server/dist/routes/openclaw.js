"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../services/logger");
const pharmacy_verification_callback_service_1 = require("../services/pharmacy-verification-callback-service");
const pharmacy_verification_service_1 = require("../services/pharmacy-verification-service");
const openclaw_service_1 = require("../services/openclaw-service");
const request_utils_1 = require("../utils/request-utils");
const router = (0, express_1.Router)();
const callbackLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'リクエストが多すぎます。時間をおいて再試行してください' },
});
function parseRequestId(rawValue) {
    if ((0, request_utils_1.isPositiveSafeInteger)(rawValue)) {
        return rawValue;
    }
    return (0, request_utils_1.parsePositiveInt)(String(rawValue ?? ''));
}
function normalizeText(value, maxLength) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    return trimmed.slice(0, maxLength);
}
function parseJsonObject(rawValue) {
    if (typeof rawValue !== 'string') {
        return null;
    }
    const trimmed = rawValue.trim();
    if (!trimmed) {
        return null;
    }
    try {
        const parsed = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
router.post('/callback', callbackLimiter, async (req, res) => {
    try {
        if (!(0, openclaw_service_1.isOpenClawWebhookConfigured)()) {
            res.status(503).json({ error: 'OpenClaw webhook が未設定です' });
            return;
        }
        const signature = req.header('x-openclaw-signature');
        const timestamp = req.header('x-openclaw-timestamp');
        const isAuthorized = (0, openclaw_service_1.verifyOpenClawWebhookSignature)({
            receivedSignature: signature,
            receivedTimestamp: timestamp,
            rawBody: req.rawBody,
        });
        if (!isAuthorized) {
            res.status(401).json({ error: 'OpenClaw webhook 認証に失敗しました' });
            return;
        }
        if ((0, openclaw_service_1.isOpenClawWebhookReplay)({
            receivedSignature: signature,
            receivedTimestamp: timestamp,
        })) {
            res.status(401).json({ error: 'OpenClaw webhook 認証に失敗しました' });
            return;
        }
        const requestId = parseRequestId(req.body.requestId);
        const statusRaw = req.body.status;
        if (!requestId || !(0, openclaw_service_1.isOpenClawStatus)(statusRaw)) {
            res.status(400).json({ error: 'requestId または status が不正です' });
            return;
        }
        const status = statusRaw;
        const reportedBranch = normalizeText(req.body.implementationBranch, 120);
        if ((status === 'implementing' || status === 'completed') && !(0, openclaw_service_1.isImplementationBranchAllowed)(reportedBranch)) {
            res.status(409).json({
                error: '許可されていない実装ブランチです',
            });
            return;
        }
        const threadId = normalizeText(req.body.threadId, 120);
        const summary = normalizeText(req.body.summary, 4000);
        const [current] = await database_1.db.select({
            id: schema_1.userRequests.id,
            pharmacyId: schema_1.userRequests.pharmacyId,
            openclawStatus: schema_1.userRequests.openclawStatus,
            openclawThreadId: schema_1.userRequests.openclawThreadId,
            openclawSummary: schema_1.userRequests.openclawSummary,
            requestText: schema_1.userRequests.requestText,
        })
            .from(schema_1.userRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, requestId))
            .limit(1);
        if (!current) {
            res.status(404).json({ error: '対象の要望が見つかりません' });
            return;
        }
        if (!(0, openclaw_service_1.canTransitionOpenClawStatus)(current.openclawStatus, status)) {
            res.status(409).json({
                error: `状態遷移が不正です。現在: ${current.openclawStatus}, 受信: ${status}`,
            });
            return;
        }
        const replayAccepted = (0, openclaw_service_1.consumeOpenClawWebhookReplay)({
            receivedSignature: signature,
            receivedTimestamp: timestamp,
        });
        if (!replayAccepted) {
            res.status(401).json({ error: 'OpenClaw webhook 認証に失敗しました' });
            return;
        }
        try {
            await database_1.db.transaction(async (tx) => {
                const updatePayload = {
                    openclawStatus: status,
                    openclawThreadId: threadId ?? current.openclawThreadId,
                    openclawSummary: summary ?? current.openclawSummary,
                    updatedAt: new Date().toISOString(),
                };
                if (status !== 'completed') {
                    await tx.update(schema_1.userRequests)
                        .set(updatePayload)
                        .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, requestId));
                    return;
                }
                const transitionedRows = await tx.update(schema_1.userRequests)
                    .set(updatePayload)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userRequests.id, requestId), (0, drizzle_orm_1.ne)(schema_1.userRequests.openclawStatus, 'completed')))
                    .returning({ id: schema_1.userRequests.id });
                if (transitionedRows.length === 0) {
                    await tx.update(schema_1.userRequests)
                        .set(updatePayload)
                        .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, requestId));
                    return;
                }
                const summaryText = summary ?? current.openclawSummary;
                await tx.insert(schema_1.notifications).values({
                    pharmacyId: current.pharmacyId,
                    type: 'request_update',
                    title: 'ご要望の対応が完了しました',
                    message: summaryText
                        ? `要望 #${requestId}: ${summaryText}`
                        : `要望 #${requestId} の対応が完了しました。管理画面で詳細をご確認ください。`,
                    referenceType: 'request',
                    referenceId: requestId,
                });
            });
        }
        catch (err) {
            (0, openclaw_service_1.releaseOpenClawWebhookReplay)({
                receivedSignature: signature,
                receivedTimestamp: timestamp,
            });
            throw err;
        }
        // Process pharmacy verification callback if applicable
        if (status === 'completed') {
            try {
                const requestContent = parseJsonObject(current.requestText);
                if (requestContent && (0, pharmacy_verification_service_1.isVerificationRequestType)(requestContent.type)) {
                    const verificationData = parseJsonObject(summary);
                    if (!verificationData || typeof verificationData.approved !== 'boolean') {
                        logger_1.logger.warn('Skipped pharmacy verification callback due to invalid summary payload', {
                            requestId,
                            pharmacyId: current.pharmacyId,
                            summaryProvided: Boolean(summary),
                        });
                    }
                    else {
                        const callbackResult = await (0, pharmacy_verification_callback_service_1.processVerificationCallback)({
                            pharmacyId: current.pharmacyId,
                            requestId,
                            approved: verificationData.approved,
                            reason: typeof verificationData.reason === 'string' ? verificationData.reason : '',
                        });
                        if (callbackResult.applied) {
                            (0, auth_1.invalidateAuthUserCache)(current.pharmacyId);
                        }
                    }
                }
            }
            catch (verificationErr) {
                logger_1.logger.error('Pharmacy verification callback processing failed', {
                    requestId,
                    pharmacyId: current.pharmacyId,
                    error: verificationErr instanceof Error ? verificationErr.message : String(verificationErr),
                });
                // Don't fail the whole callback - the OpenClaw status was already updated
            }
        }
        res.json({
            message: 'OpenClawコールバックを反映しました',
            requestId,
            openclawStatus: status,
            implementationBranch: reportedBranch ?? (0, openclaw_service_1.getOpenClawImplementationBranch)(),
        });
    }
    catch (err) {
        logger_1.logger.error('OpenClaw callback error', { error: err.message });
        res.status(500).json({ error: 'OpenClawコールバック処理に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=openclaw.js.map