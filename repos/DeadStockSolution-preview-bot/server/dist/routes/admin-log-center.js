"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const log_center_service_1 = require("../services/log-center-service");
const admin_utils_1 = require("./admin-utils");
const request_utils_1 = require("../utils/request-utils");
const VALID_LOG_SOURCES = new Set(log_center_service_1.LOG_SOURCES);
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.use(auth_1.requireAdmin);
function parseLogSources(raw) {
    if (typeof raw !== 'string')
        return undefined;
    const parsed = raw.split(',').map((value) => value.trim()).filter(Boolean);
    const filtered = parsed.filter((value) => VALID_LOG_SOURCES.has(value));
    if (filtered.length === 0)
        return undefined;
    // 重複は除去
    return [...new Set(filtered)];
}
// GET /api/admin/log-center
router.get('/', async (req, res) => {
    try {
        const { page, limit } = (0, admin_utils_1.parseListPagination)(req, 50);
        const query = { page, limit };
        if (req.query.source) {
            const sources = parseLogSources(req.query.source);
            if (sources) {
                query.sources = sources;
            }
        }
        if (req.query.level) {
            query.level = String(req.query.level);
        }
        const search = (0, request_utils_1.normalizeSearchTerm)(req.query.search);
        if (search) {
            query.search = search;
        }
        if (req.query.pharmacyId) {
            const pid = (0, request_utils_1.parsePositiveInt)(req.query.pharmacyId);
            if (pid)
                query.pharmacyId = pid;
        }
        if (req.query.from) {
            query.from = String(req.query.from);
        }
        if (req.query.to) {
            query.to = String(req.query.to);
        }
        const result = await (0, log_center_service_1.queryLogs)(query);
        (0, admin_utils_1.sendPaginated)(res, result.entries, result.page, result.limit, result.total);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin log-center list error', 'ログ一覧の取得に失敗しました', res);
    }
});
// GET /api/admin/log-center/summary
router.get('/summary', async (_req, res) => {
    try {
        const result = await (0, log_center_service_1.getLogSummary)();
        res.json(result);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin log-center summary error', 'ログサマリーの取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-log-center.js.map