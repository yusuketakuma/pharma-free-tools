"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearStatisticsSummaryCacheForTests = clearStatisticsSummaryCacheForTests;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_1 = require("../middleware/auth");
const expiry_risk_service_1 = require("../services/expiry-risk-service");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
const DEFAULT_STATS_SUMMARY_CACHE_TTL_MS = 30_000;
const MAX_STATS_SUMMARY_CACHE_TTL_MS = 5 * 60_000;
const STATS_SUMMARY_CACHE_MAX_ENTRIES = 1_000;
const statisticsSummaryCache = new Map();
function resolveStatsSummaryCacheTtlMs() {
    const raw = Number(process.env.STATISTICS_SUMMARY_CACHE_TTL_MS ?? DEFAULT_STATS_SUMMARY_CACHE_TTL_MS);
    if (!Number.isFinite(raw))
        return DEFAULT_STATS_SUMMARY_CACHE_TTL_MS;
    return Math.max(0, Math.min(MAX_STATS_SUMMARY_CACHE_TTL_MS, Math.floor(raw)));
}
function pruneStatisticsSummaryCache(nowMs) {
    for (const [pharmacyId, entry] of statisticsSummaryCache.entries()) {
        if (entry.expiresAtMs <= nowMs) {
            statisticsSummaryCache.delete(pharmacyId);
        }
    }
    while (statisticsSummaryCache.size > STATS_SUMMARY_CACHE_MAX_ENTRIES) {
        const oldestKey = statisticsSummaryCache.keys().next().value;
        if (typeof oldestKey !== 'number')
            break;
        statisticsSummaryCache.delete(oldestKey);
    }
}
function getCachedStatisticsSummary(pharmacyId, nowMs) {
    const ttlMs = resolveStatsSummaryCacheTtlMs();
    if (ttlMs <= 0)
        return null;
    const cached = statisticsSummaryCache.get(pharmacyId);
    if (!cached)
        return null;
    if (cached.expiresAtMs <= nowMs) {
        statisticsSummaryCache.delete(pharmacyId);
        return null;
    }
    return cached.payload;
}
function setCachedStatisticsSummary(pharmacyId, payload, nowMs) {
    const ttlMs = resolveStatsSummaryCacheTtlMs();
    if (ttlMs <= 0)
        return;
    pruneStatisticsSummaryCache(nowMs);
    statisticsSummaryCache.set(pharmacyId, {
        expiresAtMs: nowMs + ttlMs,
        payload,
    });
}
function clearStatisticsSummaryCacheForTests() {
    statisticsSummaryCache.clear();
}
router.use(auth_1.requireLogin);
router.get('/summary', async (req, res) => {
    const pharmacyId = req.user.id;
    const nowMs = Date.now();
    const cached = getCachedStatisticsSummary(pharmacyId, nowMs);
    if (cached) {
        res.json(cached);
        return;
    }
    try {
        const [uploadStats, deadStockStats, riskDetail, proposalStats, exchangeStats, matchSnapshot, trustScore, feedbackReceived, favoriteCount, activeAlertCount,] = await Promise.all([
            // アップロード回数 + 最終日（種別ごと）— 1クエリに統合
            database_1.db
                .select({
                uploadType: schema_1.uploads.uploadType,
                count: (0, drizzle_orm_1.count)(),
                lastDate: (0, drizzle_orm_1.max)(schema_1.uploads.createdAt),
            })
                .from(schema_1.uploads)
                .where((0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, pharmacyId))
                .groupBy(schema_1.uploads.uploadType),
            // デッドストック品目数 + 総薬価 — 1クエリに統合
            database_1.db
                .select({
                count: (0, drizzle_orm_1.count)(),
                totalValue: (0, drizzle_orm_1.sum)(schema_1.deadStockItems.yakkaTotal),
            })
                .from(schema_1.deadStockItems)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true))),
            // リスク詳細（バケット含む）
            (0, expiry_risk_service_1.getPharmacyRiskDetail)(pharmacyId).catch(() => null),
            // 提案統計 — 条件付き集計で1クエリに統合
            database_1.db
                .select({
                sent: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.exchangeProposals.pharmacyAId} = ${pharmacyId} THEN 1 ELSE 0 END)`,
                received: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.exchangeProposals.pharmacyBId} = ${pharmacyId} THEN 1 ELSE 0 END)`,
                completed: (0, drizzle_orm_1.sql) `SUM(CASE WHEN (${schema_1.exchangeProposals.pharmacyAId} = ${pharmacyId} OR ${schema_1.exchangeProposals.pharmacyBId} = ${pharmacyId}) AND ${schema_1.exchangeProposals.status} = 'completed' THEN 1 ELSE 0 END)`,
                pendingAction: (0, drizzle_orm_1.sql) `SUM(CASE WHEN (
            (${schema_1.exchangeProposals.status} = 'proposed' AND ${schema_1.exchangeProposals.pharmacyBId} = ${pharmacyId})
            OR (${schema_1.exchangeProposals.status} = 'accepted_a' AND ${schema_1.exchangeProposals.pharmacyBId} = ${pharmacyId})
            OR (${schema_1.exchangeProposals.status} = 'accepted_b' AND ${schema_1.exchangeProposals.pharmacyAId} = ${pharmacyId})
          ) THEN 1 ELSE 0 END)`,
            })
                .from(schema_1.exchangeProposals)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId))),
            // 交換完了件数・累計薬価・ユニーク取引先数 — 1クエリに統合
            database_1.db
                .select({
                totalCount: (0, drizzle_orm_1.count)(),
                totalValue: (0, drizzle_orm_1.sum)(schema_1.exchangeHistory.totalValue),
                partnerCount: (0, drizzle_orm_1.countDistinct)((0, drizzle_orm_1.sql) `CASE WHEN ${schema_1.exchangeHistory.pharmacyAId} = ${pharmacyId} THEN ${schema_1.exchangeHistory.pharmacyBId} ELSE ${schema_1.exchangeHistory.pharmacyAId} END`),
            })
                .from(schema_1.exchangeHistory)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyBId, pharmacyId))),
            // マッチング候補数
            database_1.db
                .select({ candidateCount: schema_1.matchCandidateSnapshots.candidateCount })
                .from(schema_1.matchCandidateSnapshots)
                .where((0, drizzle_orm_1.eq)(schema_1.matchCandidateSnapshots.pharmacyId, pharmacyId)),
            // 信頼スコア
            database_1.db
                .select({
                trustScore: schema_1.pharmacyTrustScores.trustScore,
                ratingCount: schema_1.pharmacyTrustScores.ratingCount,
                positiveRate: schema_1.pharmacyTrustScores.positiveRate,
            })
                .from(schema_1.pharmacyTrustScores)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacyTrustScores.pharmacyId, pharmacyId)),
            // 受け取った評価の平均
            database_1.db
                .select({
                avgRating: (0, drizzle_orm_1.sql) `ROUND(AVG(${schema_1.exchangeFeedback.rating}), 1)`,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.exchangeFeedback)
                .where((0, drizzle_orm_1.eq)(schema_1.exchangeFeedback.toPharmacyId, pharmacyId)),
            // お気に入り薬局数
            database_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.pharmacyRelationships)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'favorite'))),
            // 未解決の予測アラート数
            database_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.predictiveAlerts)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.predictiveAlerts.pharmacyId, pharmacyId), (0, drizzle_orm_1.isNull)(schema_1.predictiveAlerts.resolvedAt))),
        ]);
        const dsUpload = uploadStats.find((u) => u.uploadType === 'dead_stock');
        const umUpload = uploadStats.find((u) => u.uploadType === 'used_medication');
        const ts = trustScore[0];
        const fb = feedbackReceived[0];
        const ps = proposalStats[0];
        const es = exchangeStats[0];
        const payload = {
            uploads: {
                deadStockCount: dsUpload?.count ?? 0,
                usedMedicationCount: umUpload?.count ?? 0,
                lastDeadStockUpload: dsUpload?.lastDate ?? null,
                lastUsedMedicationUpload: umUpload?.lastDate ?? null,
            },
            inventory: {
                deadStockItems: deadStockStats[0]?.count ?? 0,
                deadStockTotalValue: Number(deadStockStats[0]?.totalValue ?? 0),
                riskScore: riskDetail?.riskScore ?? 0,
                bucketCounts: riskDetail?.bucketCounts ?? null,
            },
            proposals: {
                sent: Number(ps?.sent ?? 0),
                received: Number(ps?.received ?? 0),
                completed: Number(ps?.completed ?? 0),
                pendingAction: Number(ps?.pendingAction ?? 0),
            },
            exchanges: {
                totalCount: es?.totalCount ?? 0,
                totalValue: Number(es?.totalValue ?? 0),
            },
            matching: {
                candidateCount: matchSnapshot[0]?.candidateCount ?? 0,
            },
            trust: {
                score: Number(ts?.trustScore ?? 60),
                ratingCount: ts?.ratingCount ?? 0,
                positiveRate: Number(ts?.positiveRate ?? 0),
                avgRatingReceived: fb?.avgRating ?? 0,
                feedbackCount: fb?.count ?? 0,
            },
            network: {
                favoriteCount: favoriteCount[0]?.count ?? 0,
                tradingPartnerCount: es?.partnerCount ?? 0,
            },
            alerts: {
                activeCount: activeAlertCount[0]?.count ?? 0,
            },
        };
        setCachedStatisticsSummary(pharmacyId, payload, nowMs);
        res.json(payload);
    }
    catch (err) {
        logger_1.logger.error('Statistics summary error:', { error: err.message });
        res.status(500).json({ error: '統計情報の取得に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=statistics.js.map