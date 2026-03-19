"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../services/logger");
const openclaw_log_context_service_1 = require("../services/openclaw-log-context-service");
const openclaw_service_1 = require("../services/openclaw-service");
const request_utils_1 = require("../utils/request-utils");
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.get('/me', async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'ログインが必要です' });
            return;
        }
        const parsedLimit = (0, request_utils_1.parsePositiveInt)(String(req.query.limit ?? ''));
        const limit = parsedLimit ? Math.min(parsedLimit, 100) : 50;
        const rows = await database_1.db.select({
            id: schema_1.userRequests.id,
            requestText: schema_1.userRequests.requestText,
            openclawStatus: schema_1.userRequests.openclawStatus,
            openclawThreadId: schema_1.userRequests.openclawThreadId,
            openclawSummary: schema_1.userRequests.openclawSummary,
            createdAt: schema_1.userRequests.createdAt,
            updatedAt: schema_1.userRequests.updatedAt,
        })
            .from(schema_1.userRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.userRequests.pharmacyId, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.userRequests.createdAt), (0, drizzle_orm_1.desc)(schema_1.userRequests.id))
            .limit(limit);
        res.json({
            data: rows,
            pagination: {
                limit,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('User request list error', { error: err.message });
        res.status(500).json({ error: '要望一覧の取得に失敗しました' });
    }
});
router.post('/', async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'ログインが必要です' });
            return;
        }
        const requestText = typeof req.body.message === 'string' ? req.body.message.trim() : '';
        if (!requestText || requestText.length > 2000) {
            res.status(400).json({ error: '要望は1〜2000文字で入力してください' });
            return;
        }
        const [created] = await database_1.db.insert(schema_1.userRequests)
            .values({
            pharmacyId: req.user.id,
            requestText,
            openclawStatus: 'pending_handoff',
        })
            .returning({
            id: schema_1.userRequests.id,
            openclawStatus: schema_1.userRequests.openclawStatus,
            createdAt: schema_1.userRequests.createdAt,
        });
        let handoffContext;
        try {
            const operationLogs = await (0, openclaw_log_context_service_1.buildOpenClawLogContext)(req.user.id);
            handoffContext = { operationLogs };
        }
        catch (contextErr) {
            logger_1.logger.warn('OpenClaw context collection failed on request submit', {
                requestId: created.id,
                pharmacyId: req.user.id,
                error: contextErr.message,
            });
        }
        const handoff = await (0, openclaw_service_1.handoffToOpenClaw)({
            requestId: created.id,
            pharmacyId: req.user.id,
            requestText,
            context: handoffContext,
        });
        let openclawStatus = created.openclawStatus;
        if (handoff.accepted) {
            await database_1.db.update(schema_1.userRequests)
                .set({
                openclawStatus: handoff.status,
                openclawThreadId: handoff.threadId,
                openclawSummary: handoff.summary,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, created.id));
            openclawStatus = handoff.status;
        }
        res.status(201).json({
            message: '要望を受け付けました',
            nextStep: handoff.note,
            handoff: {
                accepted: handoff.accepted,
                connectorConfigured: handoff.connectorConfigured,
                implementationBranch: handoff.implementationBranch,
                status: handoff.status,
            },
            request: {
                ...created,
                openclawStatus,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('User request submit error', { error: err.message });
        res.status(500).json({ error: '要望の送信に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=requests.js.map