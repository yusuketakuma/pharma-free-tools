"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const request_utils_1 = require("../utils/request-utils");
const path_utils_1 = require("../utils/path-utils");
const db_utils_1 = require("../utils/db-utils");
const log_service_1 = require("../services/log-service");
const logger_1 = require("../services/logger");
const openclaw_log_context_service_1 = require("../services/openclaw-log-context-service");
const openclaw_service_1 = require("../services/openclaw-service");
const proposal_timeline_service_1 = require("../services/proposal-timeline-service");
const admin_write_limiter_1 = require("./admin-write-limiter");
const admin_utils_1 = require("./admin-utils");
async function collectAdminHandoffContext(pharmacyId, requestId) {
    try {
        const operationLogs = await (0, openclaw_log_context_service_1.buildOpenClawLogContext)(pharmacyId);
        return { operationLogs };
    }
    catch (contextErr) {
        logger_1.logger.warn('OpenClaw context collection failed on admin handoff', {
            requestId,
            pharmacyId,
            error: (0, admin_utils_1.getErrorMessage)(contextErr),
        });
        return undefined;
    }
}
function buildAdminHandoffResponse(handoff) {
    return {
        accepted: handoff.accepted,
        connectorConfigured: handoff.connectorConfigured,
        implementationBranch: handoff.implementationBranch,
        status: handoff.status,
        note: handoff.note,
    };
}
function sendAdminHandoffResponse(res, handoff) {
    const handoffPayload = buildAdminHandoffResponse(handoff);
    if (handoff.accepted) {
        res.json({
            message: 'OpenClawへ再連携しました',
            handoff: handoffPayload,
        });
        return;
    }
    res.status(202).json({
        message: 'OpenClaw連携は保留中です',
        handoff: handoffPayload,
    });
}
const router = (0, express_1.Router)();
router.get('/exchanges', async (req, res) => {
    try {
        const { page, limit, offset } = (0, admin_utils_1.parseListPagination)(req);
        const rows = await database_1.db.select()
            .from(schema_1.exchangeProposals)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeProposals.proposedAt))
            .limit(limit)
            .offset(offset);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.exchangeProposals);
        (0, admin_utils_1.sendPaginated)(res, rows, page, limit, total.count);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin exchanges error', '交換一覧の取得に失敗しました', res);
    }
});
router.get('/exchanges/:proposalId/comments', async (req, res) => {
    try {
        const proposalId = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.proposalId);
        if (!proposalId)
            return;
        const proposalRows = await database_1.db.select({ id: schema_1.exchangeProposals.id })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId))
            .limit(1);
        if (proposalRows.length === 0) {
            res.status(404).json({ error: 'マッチングが見つかりません' });
            return;
        }
        const rows = await database_1.db.select({
            id: schema_1.proposalComments.id,
            proposalId: schema_1.proposalComments.proposalId,
            authorPharmacyId: schema_1.proposalComments.authorPharmacyId,
            authorName: schema_1.pharmacies.name,
            body: schema_1.proposalComments.body,
            isDeleted: schema_1.proposalComments.isDeleted,
            createdAt: schema_1.proposalComments.createdAt,
            updatedAt: schema_1.proposalComments.updatedAt,
        })
            .from(schema_1.proposalComments)
            .innerJoin(schema_1.pharmacies, (0, drizzle_orm_1.eq)(schema_1.proposalComments.authorPharmacyId, schema_1.pharmacies.id))
            .where((0, drizzle_orm_1.eq)(schema_1.proposalComments.proposalId, proposalId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.proposalComments.createdAt), (0, drizzle_orm_1.desc)(schema_1.proposalComments.id));
        res.json({
            data: rows.map((row) => ({
                ...row,
                body: row.isDeleted ? '（削除済み）' : row.body,
            })),
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin exchange comments error', '交渉メモの取得に失敗しました', res);
    }
});
router.get('/exchanges/:proposalId/timeline', async (req, res) => {
    try {
        const proposalId = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.proposalId);
        if (!proposalId)
            return;
        const [proposal] = await database_1.db.select({
            id: schema_1.exchangeProposals.id,
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            proposedAt: schema_1.exchangeProposals.proposedAt,
        })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId))
            .limit(1);
        if (!proposal) {
            res.status(404).json({ error: 'マッチングが見つかりません' });
            return;
        }
        const [proposalCreator] = await database_1.db.select({ name: schema_1.pharmacies.name })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, proposal.pharmacyAId))
            .limit(1);
        const actionRows = await (0, proposal_timeline_service_1.fetchProposalTimelineActionRows)(proposalId);
        res.json({
            data: (0, proposal_timeline_service_1.buildProposalTimeline)({
                proposedAt: proposal.proposedAt,
                proposalCreatorPharmacyId: proposal.pharmacyAId,
                proposalCreatorName: proposalCreator?.name ?? '提案元薬局',
                actionRows,
            }),
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin exchange timeline error', '進行履歴の取得に失敗しました', res);
    }
});
router.post('/messages', admin_write_limiter_1.adminWriteLimiter, async (req, res) => {
    try {
        const targetType = req.body.targetType;
        const targetPharmacyIdRaw = req.body.targetPharmacyId;
        const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
        const actionPath = typeof req.body.actionPath === 'string' ? req.body.actionPath.trim() : '';
        if (!targetType || !['all', 'pharmacy'].includes(targetType)) {
            res.status(400).json({ error: '送信対象が不正です' });
            return;
        }
        if (!title || title.length > 100) {
            res.status(400).json({ error: 'タイトルは1〜100文字で入力してください' });
            return;
        }
        if (!body || body.length > 2000) {
            res.status(400).json({ error: '本文は1〜2000文字で入力してください' });
            return;
        }
        let targetPharmacyId = null;
        if (targetType === 'pharmacy') {
            targetPharmacyId = (0, request_utils_1.parsePositiveInt)(String(targetPharmacyIdRaw ?? ''));
            if (!targetPharmacyId) {
                res.status(400).json({ error: '送信先薬局IDが不正です' });
                return;
            }
            const targetRows = await database_1.db.select({ id: schema_1.pharmacies.id })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, targetPharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true)))
                .limit(1);
            if (targetRows.length === 0) {
                res.status(404).json({ error: '送信先薬局が見つかりません' });
                return;
            }
        }
        if (actionPath && !(0, path_utils_1.isSafeInternalPath)(actionPath)) {
            res.status(400).json({ error: '遷移先パスが不正です' });
            return;
        }
        await database_1.db.insert(schema_1.adminMessages).values({
            senderAdminId: req.user.id,
            targetType,
            targetPharmacyId,
            title,
            body,
            actionPath: actionPath || null,
        });
        (0, log_service_1.writeLog)('admin_send_message', {
            pharmacyId: req.user.id,
            detail: `メッセージ送信: ${title} (対象: ${targetType === 'all' ? '全体' : `薬局ID:${targetPharmacyId}`})`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.status(201).json({ message: '加盟薬局へメッセージを送信しました' });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin message send error', 'メッセージ送信に失敗しました', res);
    }
});
router.post('/requests/:id/handoff', admin_write_limiter_1.adminWriteLimiter, async (req, res) => {
    try {
        const requestId = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.id);
        if (!requestId)
            return;
        const [requestRow] = await database_1.db.select({
            id: schema_1.userRequests.id,
            pharmacyId: schema_1.userRequests.pharmacyId,
            requestText: schema_1.userRequests.requestText,
            openclawStatus: schema_1.userRequests.openclawStatus,
        })
            .from(schema_1.userRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, requestId))
            .limit(1);
        if (!requestRow) {
            res.status(404).json({ error: '要望が見つかりません' });
            return;
        }
        if (requestRow.openclawStatus === 'completed') {
            res.status(400).json({ error: '完了済み要望は再連携できません' });
            return;
        }
        if (requestRow.openclawStatus !== 'pending_handoff') {
            res.status(400).json({ error: '連携待ちの要望のみ再連携できます' });
            return;
        }
        const handoff = await (0, openclaw_service_1.handoffToOpenClaw)({
            requestId: requestRow.id,
            pharmacyId: requestRow.pharmacyId,
            requestText: requestRow.requestText,
            context: await collectAdminHandoffContext(requestRow.pharmacyId, requestRow.id),
        });
        if (handoff.accepted) {
            await database_1.db.update(schema_1.userRequests)
                .set({
                openclawStatus: handoff.status,
                openclawThreadId: handoff.threadId,
                openclawSummary: handoff.summary,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, requestRow.id));
        }
        sendAdminHandoffResponse(res, handoff);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin user request handoff error', '再連携に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-pharmacies-actions.js.map