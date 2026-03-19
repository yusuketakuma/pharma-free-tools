"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../services/logger");
const upload_parser_1 = __importDefault(require("./upload-parser"));
const upload_validation_1 = require("./upload-validation");
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.use('/', upload_parser_1.default);
// ── Upload status - check if current month uploads exist ──
router.get('/status', async (req, res) => {
    try {
        const pharmacyId = req.user.id;
        const now = new Date();
        const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        const lastUploadRows = await database_1.db.select({
            uploadType: schema_1.uploads.uploadType,
            createdAt: (0, drizzle_orm_1.sql) `max(${schema_1.uploads.createdAt})`,
        })
            .from(schema_1.uploads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, pharmacyId), (0, drizzle_orm_1.inArray)(schema_1.uploads.uploadType, ['dead_stock', 'used_medication'])))
            .groupBy(schema_1.uploads.uploadType);
        let lastDeadStockDate = null;
        let lastUsedMedDate = null;
        for (const row of lastUploadRows) {
            if (row.uploadType === 'dead_stock')
                lastDeadStockDate = row.createdAt;
            if (row.uploadType === 'used_medication')
                lastUsedMedDate = row.createdAt;
        }
        res.json({
            deadStockUploaded: lastDeadStockDate !== null,
            usedMedicationUploaded: lastUsedMedDate !== null && lastUsedMedDate >= firstOfMonth,
            lastDeadStockUpload: lastDeadStockDate,
            lastUsedMedicationUpload: lastUsedMedDate,
        });
    }
    catch (err) {
        logger_1.logger.error('Upload status error', () => ({
            ...(0, upload_validation_1.getBaseContext)(req),
            error: (0, upload_validation_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        res.status(500).json({ error: 'ステータスの取得に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map