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
const matching_service_1 = require("../services/matching-service");
const exchange_service_1 = require("../services/exchange-service");
const request_utils_1 = require("../utils/request-utils");
const db_utils_1 = require("../utils/db-utils");
const logger_1 = require("../services/logger");
const proposal_priority_service_1 = require("../services/proposal-priority-service");
const log_service_1 = require("../services/log-service");
const proposal_timeline_service_1 = require("../services/proposal-timeline-service");
const exchange_utils_1 = require("./exchange-utils");
const router = (0, express_1.Router)();
const CREATE_PROPOSAL_CLIENT_ERROR = '候補データが無効です。候補を再取得して再試行してください';
function isProposalInputError(message) {
    return [
        '不正',
        '見つかりません',
        '在庫',
        '薬局',
        'マッチング',
        '提案',
        '交換金額',
        '数量',
    ].some((token) => message.includes(token));
}
const findLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});
function parseBulkAction(raw) {
    if (raw === 'accept' || raw === 'reject')
        return raw;
    return null;
}
function parseBulkIds(raw) {
    if (!Array.isArray(raw))
        return null;
    const normalized = raw
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
    if (normalized.length === 0)
        return null;
    return [...new Set(normalized)];
}
function sanitizeBulkActionErrorMessage(err) {
    const message = err instanceof Error ? err.message : '';
    const hiddenDetailTokens = [
        '見つかりません',
        'アクセス権限',
        '承認できる状態',
        '拒否できる状態',
        '状態が変更された',
        '完了できません',
    ];
    if (hiddenDetailTokens.some((token) => message.includes(token))) {
        return '対象を処理できませんでした';
    }
    return '操作に失敗しました';
}
function sanitizeProposalActionError(err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('見つかりません') || message.includes('アクセス権限')) {
        return { status: 404, message: 'マッチングが見つかりません' };
    }
    if (message.includes('状態が変更された')) {
        return { status: 409, message: '状態が変更されたため、再読み込みして再試行してください' };
    }
    return { status: 400, message: '操作に失敗しました' };
}
// Find matching candidates
router.post('/find', findLimiter, async (req, res) => {
    try {
        const candidates = await (0, matching_service_1.findMatches)(req.user.id);
        res.json({ candidates });
    }
    catch (err) {
        logger_1.logger.error('Find matches error:', { error: err.message });
        const message = process.env.NODE_ENV === 'production'
            ? 'マッチングに失敗しました'
            : (err instanceof Error ? err.message : 'マッチングに失敗しました');
        res.status(500).json({ error: message });
    }
});
// Create proposal from selected candidate
router.post('/proposals', async (req, res) => {
    try {
        const candidate = req.body?.candidate;
        if (!candidate || typeof candidate !== 'object') {
            res.status(400).json({ error: '候補データが必要です' });
            return;
        }
        const proposalId = await (0, exchange_service_1.createProposal)(req.user.id, candidate);
        res.status(201).json({ proposalId, message: '仮マッチングを開始しました' });
    }
    catch (err) {
        logger_1.logger.error('Create proposal error:', { error: err.message });
        if (err instanceof Error && isProposalInputError(err.message)) {
            logger_1.logger.warn('Create proposal rejected due to invalid candidate payload', {
                pharmacyId: req.user.id,
                reason: err.message,
            });
            res.status(400).json({ error: CREATE_PROPOSAL_CLIENT_ERROR });
            return;
        }
        res.status(500).json({ error: '仮マッチングの作成に失敗しました' });
    }
});
// Bulk accept/reject proposals
router.post('/proposals/bulk-action', async (req, res) => {
    try {
        const action = parseBulkAction(req.body?.action);
        const ids = parseBulkIds(req.body?.ids);
        if (!action || !ids) {
            res.status(400).json({ error: 'action と ids を正しく指定してください' });
            return;
        }
        if (ids.length > 50) {
            res.status(400).json({ error: '一括操作は最大50件までです' });
            return;
        }
        const actorId = req.user.id;
        const results = [];
        for (const id of ids) {
            try {
                if (action === 'accept') {
                    const nextStatus = await (0, exchange_service_1.acceptProposal)(id, actorId);
                    results.push({
                        id,
                        ok: true,
                        status: nextStatus,
                        message: nextStatus === 'confirmed'
                            ? '仮マッチングが確定しました'
                            : '承認しました（相手薬局の承認待ち）',
                    });
                }
                else {
                    await (0, exchange_service_1.rejectProposal)(id, actorId);
                    results.push({
                        id,
                        ok: true,
                        status: 'rejected',
                        message: '拒否しました',
                    });
                }
            }
            catch (err) {
                logger_1.logger.warn('Bulk proposal action item failed', {
                    proposalId: id,
                    action,
                    actorId,
                    error: err instanceof Error ? err.message : String(err),
                });
                results.push({ id, ok: false, error: sanitizeBulkActionErrorMessage(err) });
            }
        }
        const successCount = results.filter((row) => row.ok).length;
        res.json({
            action,
            results,
            summary: {
                total: ids.length,
                success: successCount,
                failed: ids.length - successCount,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('Bulk proposal action error', { error: err.message });
        res.status(500).json({ error: '一括操作に失敗しました' });
    }
});
// Accept proposal (single action endpoint kept for backward compatibility with detail page)
router.post('/proposals/:id/accept', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        const newStatus = await (0, exchange_service_1.acceptProposal)(id, req.user.id);
        const message = newStatus === 'confirmed'
            ? '仮マッチングが確定しました'
            : '仮マッチングを承認しました（相手薬局の承認待ち）';
        void (0, log_service_1.writeLog)('proposal_accept', {
            pharmacyId: req.user.id,
            detail: `proposalId=${id}|status=${newStatus}`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message, status: newStatus });
    }
    catch (err) {
        const failure = sanitizeProposalActionError(err);
        res.status(failure.status).json({ error: failure.message });
    }
});
// Reject proposal (single action endpoint kept for backward compatibility with detail page)
router.post('/proposals/:id/reject', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        await (0, exchange_service_1.rejectProposal)(id, req.user.id);
        void (0, log_service_1.writeLog)('proposal_reject', {
            pharmacyId: req.user.id,
            detail: `proposalId=${id}|status=rejected`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message: '仮マッチングを拒否しました' });
    }
    catch (err) {
        const failure = sanitizeProposalActionError(err);
        res.status(failure.status).json({ error: failure.message });
    }
});
// Complete exchange (single action endpoint kept for backward compatibility with detail page)
router.post('/proposals/:id/complete', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        await (0, exchange_service_1.completeProposal)(id, req.user.id);
        void (0, log_service_1.writeLog)('proposal_complete', {
            pharmacyId: req.user.id,
            detail: `proposalId=${id}|status=completed`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message: '交換を完了しました' });
    }
    catch (err) {
        const failure = sanitizeProposalActionError(err);
        res.status(failure.status).json({ error: failure.message });
    }
});
// List my proposals
router.get('/proposals', async (req, res) => {
    try {
        const sort = typeof req.query.sort === 'string' ? req.query.sort : 'recent';
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
            defaultLimit: 20,
            maxLimit: 100,
        });
        const pharmacyId = req.user.id;
        const proposalSelect = {
            id: schema_1.exchangeProposals.id,
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
            status: schema_1.exchangeProposals.status,
            totalValueA: schema_1.exchangeProposals.totalValueA,
            totalValueB: schema_1.exchangeProposals.totalValueB,
            valueDifference: schema_1.exchangeProposals.valueDifference,
            proposedAt: schema_1.exchangeProposals.proposedAt,
        };
        const ownershipFilter = (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId));
        const inboundWaitingExpr = (0, drizzle_orm_1.sql) `(
      (${schema_1.exchangeProposals.status} = 'proposed' AND ${schema_1.exchangeProposals.pharmacyBId} = ${pharmacyId})
      OR (${schema_1.exchangeProposals.status} = 'accepted_a' AND ${schema_1.exchangeProposals.pharmacyBId} = ${pharmacyId})
      OR (${schema_1.exchangeProposals.status} = 'accepted_b' AND ${schema_1.exchangeProposals.pharmacyAId} = ${pharmacyId})
    )`;
        const deadlineAtExpr = (0, drizzle_orm_1.sql) `(${schema_1.exchangeProposals.proposedAt} + interval '72 hours')`;
        const priorityScoreExpr = (0, drizzle_orm_1.sql) `(
      CASE
        WHEN ${schema_1.exchangeProposals.status} = 'confirmed' THEN 70
        WHEN ${inboundWaitingExpr} THEN 85
        WHEN ${schema_1.exchangeProposals.status} = 'proposed' AND ${schema_1.exchangeProposals.pharmacyAId} = ${pharmacyId} THEN 45
        WHEN ${schema_1.exchangeProposals.status} IN ('accepted_a', 'accepted_b') THEN 55
        WHEN ${schema_1.exchangeProposals.status} = 'completed' THEN 10
        WHEN ${schema_1.exchangeProposals.status} IN ('rejected', 'cancelled') THEN 5
        ELSE 0
      END
      +
      CASE
        WHEN ${inboundWaitingExpr} AND ${schema_1.exchangeProposals.proposedAt} IS NOT NULL THEN
          CASE
            WHEN ${deadlineAtExpr} <= now() THEN 20
            WHEN ${deadlineAtExpr} <= (now() + interval '24 hours') THEN 12
            WHEN ${deadlineAtExpr} <= (now() + interval '48 hours') THEN 6
            ELSE 0
          END
        ELSE 0
      END
    )`;
        const deadlineGroupExpr = (0, drizzle_orm_1.sql) `CASE WHEN ${inboundWaitingExpr} THEN 0 ELSE 1 END`;
        const inboundDeadlineSortExpr = (0, drizzle_orm_1.sql) `CASE WHEN ${inboundWaitingExpr} THEN ${deadlineAtExpr} ELSE NULL END`;
        const [rows, [countRow]] = await Promise.all([
            database_1.db.select(proposalSelect)
                .from(schema_1.exchangeProposals)
                .where(ownershipFilter)
                .orderBy(...(sort === 'priority'
                ? [
                    (0, drizzle_orm_1.desc)(priorityScoreExpr),
                    (0, drizzle_orm_1.asc)(deadlineGroupExpr),
                    (0, drizzle_orm_1.asc)(inboundDeadlineSortExpr),
                ]
                : []), (0, drizzle_orm_1.desc)(schema_1.exchangeProposals.proposedAt), (0, drizzle_orm_1.desc)(schema_1.exchangeProposals.id))
                .limit(limit)
                .offset(offset),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.exchangeProposals)
                .where(ownershipFilter),
        ]);
        const totalCount = countRow.count;
        const pharmacyIds = [...new Set(rows.flatMap((row) => [row.pharmacyAId, row.pharmacyBId]))];
        const pharmacyRows = pharmacyIds.length > 0
            ? await database_1.db.select({ id: schema_1.pharmacies.id, name: schema_1.pharmacies.name })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, pharmacyIds))
            : [];
        const pharmacyMap = new Map(pharmacyRows.map((row) => [row.id, row.name]));
        const prioritized = rows.map((row) => {
            const priority = (0, proposal_priority_service_1.getProposalPriority)({
                id: row.id,
                pharmacyAId: row.pharmacyAId,
                pharmacyBId: row.pharmacyBId,
                status: row.status,
                proposedAt: row.proposedAt,
            }, pharmacyId);
            return {
                ...row,
                pharmacyAName: pharmacyMap.get(row.pharmacyAId) ?? '',
                pharmacyBName: pharmacyMap.get(row.pharmacyBId) ?? '',
                priorityScore: priority.priorityScore,
                priorityReasons: priority.priorityReasons,
                deadlineAt: priority.deadlineAt,
            };
        });
        const enriched = prioritized;
        res.json({
            data: enriched,
            pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('List proposals error:', { error: err.message });
        res.status(500).json({ error: 'マッチング一覧の取得に失敗しました' });
    }
});
// Proposal detail
router.get('/proposals/:id', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        const pharmacyId = req.user.id;
        const [proposal] = await database_1.db.select()
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId))))
            .limit(1);
        if (!proposal) {
            res.status(404).json({ error: 'マッチングが見つかりません' });
            return;
        }
        // Get items
        const items = await database_1.db.select({
            id: schema_1.exchangeProposalItems.id,
            deadStockItemId: schema_1.exchangeProposalItems.deadStockItemId,
            fromPharmacyId: schema_1.exchangeProposalItems.fromPharmacyId,
            toPharmacyId: schema_1.exchangeProposalItems.toPharmacyId,
            quantity: schema_1.exchangeProposalItems.quantity,
            yakkaValue: schema_1.exchangeProposalItems.yakkaValue,
            drugName: schema_1.deadStockItems.drugName,
            unit: schema_1.deadStockItems.unit,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
        })
            .from(schema_1.exchangeProposalItems)
            .innerJoin(schema_1.deadStockItems, (0, drizzle_orm_1.eq)(schema_1.exchangeProposalItems.deadStockItemId, schema_1.deadStockItems.id))
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposalItems.proposalId, id));
        // Get pharmacy info
        const [[pharmA], [pharmB]] = await Promise.all([
            database_1.db.select({
                name: schema_1.pharmacies.name, phone: schema_1.pharmacies.phone, fax: schema_1.pharmacies.fax,
                address: schema_1.pharmacies.address, prefecture: schema_1.pharmacies.prefecture,
            }).from(schema_1.pharmacies).where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, proposal.pharmacyAId)).limit(1),
            database_1.db.select({
                name: schema_1.pharmacies.name, phone: schema_1.pharmacies.phone, fax: schema_1.pharmacies.fax,
                address: schema_1.pharmacies.address, prefecture: schema_1.pharmacies.prefecture,
            }).from(schema_1.pharmacies).where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, proposal.pharmacyBId)).limit(1),
        ]);
        const actionRows = await (0, proposal_timeline_service_1.fetchProposalTimelineActionRows)(id);
        const timeline = (0, proposal_timeline_service_1.buildProposalTimeline)({
            proposedAt: proposal.proposedAt,
            proposalCreatorPharmacyId: proposal.pharmacyAId,
            proposalCreatorName: pharmA?.name ?? '提案元薬局',
            actionRows,
            includeStatusTransitions: true,
        });
        res.json({
            proposal,
            items,
            pharmacyA: { id: proposal.pharmacyAId, ...pharmA },
            pharmacyB: { id: proposal.pharmacyBId, ...pharmB },
            timeline,
        });
    }
    catch (err) {
        logger_1.logger.error('Proposal detail error:', { error: err.message });
        res.status(500).json({ error: 'マッチング詳細の取得に失敗しました' });
    }
});
// Print data
router.get('/proposals/:id/print', async (req, res) => {
    try {
        // Reuse detail logic
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        const pharmacyId = req.user.id;
        const [proposal] = await database_1.db.select()
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId))))
            .limit(1);
        if (!proposal) {
            res.status(404).json({ error: '提案が見つかりません' });
            return;
        }
        const items = await database_1.db.select({
            id: schema_1.exchangeProposalItems.id,
            fromPharmacyId: schema_1.exchangeProposalItems.fromPharmacyId,
            toPharmacyId: schema_1.exchangeProposalItems.toPharmacyId,
            quantity: schema_1.exchangeProposalItems.quantity,
            yakkaValue: schema_1.exchangeProposalItems.yakkaValue,
            drugName: schema_1.deadStockItems.drugName,
            unit: schema_1.deadStockItems.unit,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
        })
            .from(schema_1.exchangeProposalItems)
            .innerJoin(schema_1.deadStockItems, (0, drizzle_orm_1.eq)(schema_1.exchangeProposalItems.deadStockItemId, schema_1.deadStockItems.id))
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposalItems.proposalId, id));
        const printFields = {
            name: schema_1.pharmacies.name, phone: schema_1.pharmacies.phone, fax: schema_1.pharmacies.fax,
            address: schema_1.pharmacies.address, prefecture: schema_1.pharmacies.prefecture, licenseNumber: schema_1.pharmacies.licenseNumber,
        };
        const [[pharmA], [pharmB]] = await Promise.all([
            database_1.db.select(printFields).from(schema_1.pharmacies).where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, proposal.pharmacyAId)).limit(1),
            database_1.db.select(printFields).from(schema_1.pharmacies).where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, proposal.pharmacyBId)).limit(1),
        ]);
        res.json({
            proposal,
            items,
            pharmacyA: pharmA ?? null,
            pharmacyB: pharmB ?? null,
        });
    }
    catch (err) {
        logger_1.logger.error('Print data error:', { error: err.message });
        res.status(500).json({ error: '印刷データの取得に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=exchange-proposals.js.map