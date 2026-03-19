"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const notification_service_1 = require("../services/notification-service");
const request_utils_1 = require("../utils/request-utils");
const db_utils_1 = require("../utils/db-utils");
const logger_1 = require("../services/logger");
const exchange_utils_1 = require("./exchange-utils");
const router = (0, express_1.Router)();
const COMMENT_POST_MIN_INTERVAL_MS = 10_000;
const COMMENT_DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
// Proposal comments
router.get('/proposals/:id/comments', async (req, res) => {
    try {
        const proposalId = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!proposalId)
            return;
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
            defaultLimit: 50,
            maxLimit: 200,
        });
        const [proposal] = await database_1.db.select({
            id: schema_1.exchangeProposals.id,
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
        })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, req.user.id))))
            .limit(1);
        if (!proposal) {
            res.status(404).json({ error: 'マッチングが見つかりません' });
            return;
        }
        const [rows, [countRow]] = await Promise.all([
            database_1.db.select({
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
                .orderBy((0, drizzle_orm_1.asc)(schema_1.proposalComments.createdAt), (0, drizzle_orm_1.asc)(schema_1.proposalComments.id))
                .limit(limit)
                .offset(offset),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.proposalComments)
                .where((0, drizzle_orm_1.eq)(schema_1.proposalComments.proposalId, proposalId)),
        ]);
        res.json({
            data: rows.map((row) => ({
                ...row,
                body: row.isDeleted ? '（削除済み）' : row.body,
            })),
            pagination: {
                page,
                limit,
                total: countRow.count,
                totalPages: Math.ceil(countRow.count / limit),
            },
        });
    }
    catch (err) {
        logger_1.logger.error('List proposal comments error', { error: err.message });
        res.status(500).json({ error: 'コメント一覧の取得に失敗しました' });
    }
});
router.post('/proposals/:id/comments', async (req, res) => {
    try {
        const proposalId = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!proposalId)
            return;
        const [proposal] = await database_1.db.select({
            id: schema_1.exchangeProposals.id,
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
        })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, req.user.id))))
            .limit(1);
        if (!proposal) {
            res.status(404).json({ error: 'マッチングが見つかりません' });
            return;
        }
        if (req.user?.isAdmin) {
            res.status(403).json({ error: '管理者はコメントを投稿できません' });
            return;
        }
        const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
        if (!body) {
            res.status(400).json({ error: 'コメント本文を入力してください' });
            return;
        }
        if (body.length > 1000) {
            res.status(400).json({ error: 'コメントは1000文字以内で入力してください' });
            return;
        }
        const saved = await database_1.db.transaction(async (tx) => {
            await tx.execute((0, drizzle_orm_1.sql) `SELECT pg_advisory_xact_lock(${proposalId}, ${req.user.id})`);
            const [latestOwnComment] = await tx.select({
                body: schema_1.proposalComments.body,
                createdAt: schema_1.proposalComments.createdAt,
            })
                .from(schema_1.proposalComments)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proposalComments.proposalId, proposalId), (0, drizzle_orm_1.eq)(schema_1.proposalComments.authorPharmacyId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.proposalComments.isDeleted, false)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.proposalComments.createdAt), (0, drizzle_orm_1.desc)(schema_1.proposalComments.id))
                .limit(1);
            if (latestOwnComment?.createdAt) {
                const latestPostedAtMs = Date.parse(latestOwnComment.createdAt);
                if (Number.isFinite(latestPostedAtMs)) {
                    const elapsedMs = Date.now() - latestPostedAtMs;
                    if (elapsedMs < COMMENT_POST_MIN_INTERVAL_MS) {
                        throw new Error('RATE_LIMIT_SHORT_INTERVAL');
                    }
                    if (latestOwnComment.body.trim() === body && elapsedMs < COMMENT_DUPLICATE_WINDOW_MS) {
                        throw new Error('RATE_LIMIT_DUPLICATE_BODY');
                    }
                }
            }
            const now = new Date().toISOString();
            const [inserted] = await tx.insert(schema_1.proposalComments).values({
                proposalId,
                authorPharmacyId: req.user.id,
                body,
                isDeleted: false,
                createdAt: now,
                updatedAt: now,
            }).returning({
                id: schema_1.proposalComments.id,
                proposalId: schema_1.proposalComments.proposalId,
                authorPharmacyId: schema_1.proposalComments.authorPharmacyId,
                body: schema_1.proposalComments.body,
                isDeleted: schema_1.proposalComments.isDeleted,
                createdAt: schema_1.proposalComments.createdAt,
                updatedAt: schema_1.proposalComments.updatedAt,
            });
            if (!inserted)
                throw new Error('COMMENT_INSERT_FAILED');
            return inserted;
        });
        const recipientId = proposal.pharmacyAId === req.user.id
            ? proposal.pharmacyBId
            : proposal.pharmacyAId;
        const notificationResult = await (0, notification_service_1.createNotification)({
            pharmacyId: recipientId,
            type: 'new_comment',
            title: 'コメントが追加されました',
            message: body.length > 50 ? body.substring(0, 50) + '...' : body,
            referenceType: 'proposal',
            referenceId: proposalId,
        });
        if (!notificationResult) {
            logger_1.logger.warn('Proposal comment notification could not be persisted', {
                proposalId,
                recipientId,
            });
        }
        res.status(201).json({ message: 'コメントを投稿しました', comment: saved });
    }
    catch (err) {
        if (err instanceof Error && err.message === 'RATE_LIMIT_SHORT_INTERVAL') {
            res.setHeader('Retry-After', String(Math.ceil(COMMENT_POST_MIN_INTERVAL_MS / 1000)));
            res.status(429).json({ error: '短時間での連続投稿はできません。少し待ってから投稿してください。' });
            return;
        }
        if (err instanceof Error && err.message === 'RATE_LIMIT_DUPLICATE_BODY') {
            res.status(429).json({ error: '同じ内容の連続投稿はできません。' });
            return;
        }
        logger_1.logger.error('Create proposal comment error', { error: err.message });
        res.status(500).json({ error: 'コメント投稿に失敗しました' });
    }
});
router.patch('/proposals/:id/comments/:commentId', async (req, res) => {
    try {
        const proposalId = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        const commentId = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.commentId);
        if (!proposalId || !commentId)
            return;
        if (req.user?.isAdmin) {
            res.status(403).json({ error: '管理者はコメントを編集できません' });
            return;
        }
        const [current] = await database_1.db.select({
            id: schema_1.proposalComments.id,
            proposalId: schema_1.proposalComments.proposalId,
            isDeleted: schema_1.proposalComments.isDeleted,
        })
            .from(schema_1.proposalComments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proposalComments.id, commentId), (0, drizzle_orm_1.eq)(schema_1.proposalComments.proposalId, proposalId), (0, drizzle_orm_1.eq)(schema_1.proposalComments.authorPharmacyId, req.user.id)))
            .limit(1);
        if (!current) {
            res.status(404).json({ error: 'コメントが見つかりません' });
            return;
        }
        if (current.isDeleted) {
            res.status(400).json({ error: '削除済みコメントは編集できません' });
            return;
        }
        const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
        if (!body) {
            res.status(400).json({ error: 'コメント本文を入力してください' });
            return;
        }
        if (body.length > 1000) {
            res.status(400).json({ error: 'コメントは1000文字以内で入力してください' });
            return;
        }
        await database_1.db.update(schema_1.proposalComments)
            .set({ body, updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.proposalComments.id, commentId));
        res.json({ message: 'コメントを更新しました' });
    }
    catch (err) {
        logger_1.logger.error('Update proposal comment error', { error: err.message });
        res.status(500).json({ error: 'コメント更新に失敗しました' });
    }
});
router.delete('/proposals/:id/comments/:commentId', async (req, res) => {
    try {
        const proposalId = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        const commentId = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.commentId);
        if (!proposalId || !commentId)
            return;
        if (req.user?.isAdmin) {
            res.status(403).json({ error: '管理者はコメントを削除できません' });
            return;
        }
        const [current] = await database_1.db.select({
            id: schema_1.proposalComments.id,
            proposalId: schema_1.proposalComments.proposalId,
            isDeleted: schema_1.proposalComments.isDeleted,
        })
            .from(schema_1.proposalComments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proposalComments.id, commentId), (0, drizzle_orm_1.eq)(schema_1.proposalComments.proposalId, proposalId), (0, drizzle_orm_1.eq)(schema_1.proposalComments.authorPharmacyId, req.user.id)))
            .limit(1);
        if (!current) {
            res.status(404).json({ error: 'コメントが見つかりません' });
            return;
        }
        if (current.isDeleted) {
            res.status(400).json({ error: '既に削除済みです' });
            return;
        }
        await database_1.db.update(schema_1.proposalComments)
            .set({
            isDeleted: true,
            body: '',
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.proposalComments.id, commentId));
        res.json({ message: 'コメントを削除しました' });
    }
    catch (err) {
        logger_1.logger.error('Delete proposal comment error', { error: err.message });
        res.status(500).json({ error: 'コメント削除に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=exchange-comments.js.map