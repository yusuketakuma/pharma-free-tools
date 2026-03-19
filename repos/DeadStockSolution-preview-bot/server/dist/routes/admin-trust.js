"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const trust_score_service_1 = require("../services/trust-score-service");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
const adminWriteLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '管理系APIへのリクエストが多すぎます。しばらくして再試行してください' },
});
router.get('/pharmacies/trust', async (req, res) => {
    try {
        const { page, limit } = (0, admin_utils_1.parseListPagination)(req);
        const result = await (0, trust_score_service_1.listTrustScores)(page, limit);
        (0, admin_utils_1.sendPaginated)(res, result.data, page, limit, result.total);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin trust score list error', '信頼スコア一覧の取得に失敗しました', res);
    }
});
router.post('/pharmacies/trust/recalculate', adminWriteLimiter, async (_req, res) => {
    try {
        const result = (0, trust_score_service_1.triggerTrustScoreRecalculation)();
        res.status(202).json({
            message: result.started ? '信頼スコア再計算を開始しました' : '信頼スコア再計算は既に実行中です',
            started: result.started,
            startedAt: result.startedAt,
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin trust score recalc error', '信頼スコアの再計算に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-trust.js.map