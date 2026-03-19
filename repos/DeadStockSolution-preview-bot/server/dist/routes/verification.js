"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const error_handler_1 = require("../middleware/error-handler");
const router = (0, express_1.Router)();
router.get('/verification-status', async (req, res) => {
    try {
        const email = req.query.email;
        if (typeof email !== 'string' || !email.trim()) {
            res.status(400).json({ error: 'メールアドレスを指定してください' });
            return;
        }
        const [pharmacy] = await database_1.db.select({
            verificationStatus: schema_1.pharmacies.verificationStatus,
            rejectionReason: schema_1.pharmacies.rejectionReason,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.email, email.trim().toLowerCase()))
            .limit(1);
        if (!pharmacy) {
            res.status(404).json({ error: 'アカウントが見つかりません' });
            return;
        }
        res.json({
            verificationStatus: pharmacy.verificationStatus,
            rejectionReason: pharmacy.rejectionReason,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(error, 'Verification status error', '審査ステータスの取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=verification.js.map