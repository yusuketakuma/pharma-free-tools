"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const trust_score_service_1 = require("../services/trust-score-service");
const logger_1 = require("../services/logger");
const exchange_utils_1 = require("./exchange-utils");
const router = (0, express_1.Router)();
// Submit exchange feedback (participants only, completed proposals only)
router.post('/proposals/:id/feedback', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        const rating = Number(req.body?.rating);
        const commentRaw = typeof req.body?.comment === 'string' ? req.body.comment : '';
        const comment = commentRaw.trim();
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            res.status(400).json({ error: '評価は1〜5で入力してください' });
            return;
        }
        if (comment.length > 300) {
            res.status(400).json({ error: 'コメントは300文字以内で入力してください' });
            return;
        }
        const [proposal] = await database_1.db.select({
            id: schema_1.exchangeProposals.id,
            status: schema_1.exchangeProposals.status,
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
        })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, req.user.id))))
            .limit(1);
        if (!proposal) {
            res.status(404).json({ error: 'マッチングが見つかりません' });
            return;
        }
        if (proposal.status !== 'completed') {
            res.status(400).json({ error: '完了済みマッチングのみ評価できます' });
            return;
        }
        const actorId = req.user.id;
        const isA = proposal.pharmacyAId === actorId;
        const targetPharmacyId = isA ? proposal.pharmacyBId : proposal.pharmacyAId;
        const now = new Date().toISOString();
        await database_1.db.insert(schema_1.exchangeFeedback).values({
            proposalId: proposal.id,
            fromPharmacyId: actorId,
            toPharmacyId: targetPharmacyId,
            rating,
            comment: comment.length > 0 ? comment : null,
            createdAt: now,
            updatedAt: now,
        }).onConflictDoUpdate({
            target: [schema_1.exchangeFeedback.proposalId, schema_1.exchangeFeedback.fromPharmacyId],
            set: {
                rating,
                comment: comment.length > 0 ? comment : null,
                updatedAt: now,
            },
        });
        await (0, trust_score_service_1.recalculateTrustScoreForPharmacy)(targetPharmacyId);
        res.status(201).json({ message: '取引評価を登録しました' });
    }
    catch (err) {
        logger_1.logger.error('Proposal feedback error', { error: err.message });
        res.status(500).json({ error: '取引評価の登録に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=exchange-feedback.js.map