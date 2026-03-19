"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const admin_write_limiter_1 = require("./admin-write-limiter");
const matching_rule_service_1 = require("../services/matching-rule-service");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
const updateMatchingRuleSchema = zod_1.z.object({
    expectedVersion: zod_1.z.number().int().positive().optional(),
    nameMatchThreshold: zod_1.z.number().min(0).max(1).optional(),
    valueScoreMax: zod_1.z.number().min(0).max(200).optional(),
    valueScoreDivisor: zod_1.z.number().positive().max(1_000_000).optional(),
    balanceScoreMax: zod_1.z.number().min(0).max(200).optional(),
    balanceScoreDiffFactor: zod_1.z.number().min(0).max(1_000).optional(),
    distanceScoreMax: zod_1.z.number().min(0).max(200).optional(),
    distanceScoreDivisor: zod_1.z.number().positive().max(1_000_000).optional(),
    distanceScoreFallback: zod_1.z.number().min(0).max(200).optional(),
    nearExpiryScoreMax: zod_1.z.number().min(0).max(200).optional(),
    nearExpiryItemFactor: zod_1.z.number().min(0).max(100).optional(),
    nearExpiryDays: zod_1.z.number().int().min(1).max(365).optional(),
    diversityScoreMax: zod_1.z.number().min(0).max(200).optional(),
    diversityItemFactor: zod_1.z.number().min(0).max(100).optional(),
    favoriteBonus: zod_1.z.number().min(0).max(200).optional(),
}).strict();
function hasRuleUpdateField(body) {
    return [
        body.nameMatchThreshold,
        body.valueScoreMax,
        body.valueScoreDivisor,
        body.balanceScoreMax,
        body.balanceScoreDiffFactor,
        body.distanceScoreMax,
        body.distanceScoreDivisor,
        body.distanceScoreFallback,
        body.nearExpiryScoreMax,
        body.nearExpiryItemFactor,
        body.nearExpiryDays,
        body.diversityScoreMax,
        body.diversityItemFactor,
        body.favoriteBonus,
    ].some((value) => value !== undefined);
}
router.get('/matching-rules/profile', async (_req, res) => {
    try {
        const profile = await (0, matching_rule_service_1.getActiveMatchingRuleProfile)();
        res.json({ data: profile });
    }
    catch (err) {
        logger_1.logger.error('Admin matching rule profile fetch error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'マッチングルールプロファイルの取得に失敗しました' });
    }
});
router.put('/matching-rules/profile', admin_write_limiter_1.adminWriteLimiter, async (req, res) => {
    const parsed = updateMatchingRuleSchema.safeParse(req.body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        res.status(400).json({ error: issue?.message ?? 'リクエスト形式が不正です' });
        return;
    }
    if (!hasRuleUpdateField(parsed.data)) {
        res.status(400).json({ error: '更新対象のスコア設定を1つ以上指定してください' });
        return;
    }
    try {
        const updated = await (0, matching_rule_service_1.updateActiveMatchingRuleProfile)(parsed.data);
        res.json({
            message: 'マッチングルールプロファイルを更新しました',
            data: updated,
        });
    }
    catch (err) {
        if (err instanceof matching_rule_service_1.MatchingRuleValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof matching_rule_service_1.MatchingRuleVersionConflictError) {
            res.status(409).json({ error: err.message });
            return;
        }
        logger_1.logger.error('Admin matching rule profile update error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'マッチングルールプロファイルの更新に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=admin-matching-rules.js.map