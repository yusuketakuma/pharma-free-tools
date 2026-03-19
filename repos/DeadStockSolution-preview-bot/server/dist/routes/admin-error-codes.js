"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const error_code_service_1 = require("../services/error-code-service");
const schema_1 = require("../db/schema");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.use(auth_1.requireAdmin);
const validCategories = new Set(schema_1.errorCodeCategoryValues);
const validSeverities = new Set(schema_1.errorCodeSeverityValues);
// GET /api/admin/error-codes
router.get('/', async (req, res) => {
    try {
        const options = {};
        if (req.query.category && validCategories.has(String(req.query.category))) {
            options.category = String(req.query.category);
        }
        if (req.query.severity && validSeverities.has(String(req.query.severity))) {
            options.severity = String(req.query.severity);
        }
        if (req.query.search)
            options.search = String(req.query.search);
        if (req.query.activeOnly !== 'false')
            options.activeOnly = true;
        const result = await (0, error_code_service_1.listErrorCodes)(options);
        res.json(result);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin error-codes list error', 'エラーコード一覧の取得に失敗しました', res);
    }
});
// POST /api/admin/error-codes
router.post('/', async (req, res) => {
    try {
        const { code, category, severity, titleJa, descriptionJa, resolutionJa } = req.body;
        if (!code || !category || !severity || !titleJa) {
            res.status(400).json({ error: '必須項目が不足しています' });
            return;
        }
        const created = await (0, error_code_service_1.createErrorCode)({ code, category, severity, titleJa, descriptionJa, resolutionJa });
        if (!created) {
            res.status(500).json({ error: 'エラーコードの作成に失敗しました' });
            return;
        }
        res.status(201).json(created);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin error-codes create error', 'エラーコードの作成に失敗しました', res);
    }
});
// PUT /api/admin/error-codes/:id
router.put('/:id', async (req, res) => {
    try {
        const id = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        const updated = await (0, error_code_service_1.updateErrorCode)(id, req.body);
        if (!updated) {
            res.status(404).json({ error: 'エラーコードが見つかりません' });
            return;
        }
        res.json(updated);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin error-codes update error', 'エラーコードの更新に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-error-codes.js.map