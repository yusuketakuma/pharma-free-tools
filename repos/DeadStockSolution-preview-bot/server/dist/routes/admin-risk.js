"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expiry_risk_service_1 = require("../services/expiry-risk-service");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
router.get('/risk/overview', async (_req, res) => {
    try {
        const overview = await (0, expiry_risk_service_1.getAdminRiskOverview)();
        res.json(overview);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin risk overview error', 'リスク概要の取得に失敗しました', res);
    }
});
router.get('/risk/pharmacies', async (req, res) => {
    try {
        const { page, limit } = (0, admin_utils_1.parseListPagination)(req);
        const result = await (0, expiry_risk_service_1.getAdminPharmacyRiskPage)(page, limit);
        (0, admin_utils_1.sendPaginated)(res, result.data, page, limit, result.total);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin risk pharmacies error', '薬局別リスクの取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-risk.js.map