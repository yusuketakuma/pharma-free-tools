"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const business_hours_utils_1 = require("../utils/business-hours-utils");
const array_utils_1 = require("../utils/array-utils");
const auth_1 = require("../middleware/auth");
const request_utils_1 = require("../utils/request-utils");
const db_utils_1 = require("../utils/db-utils");
const kana_utils_1 = require("../utils/kana-utils");
const logger_1 = require("../services/logger");
const log_service_1 = require("../services/log-service");
const expiry_risk_service_1 = require("../services/expiry-risk-service");
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
// My dead stock expiry risk summary
router.get('/dead-stock/risk', async (req, res) => {
    try {
        const detail = await (0, expiry_risk_service_1.getPharmacyRiskDetail)(req.user.id);
        res.json(detail);
    }
    catch (err) {
        logger_1.logger.error('Dead stock risk summary error:', { error: err.message });
        const message = err instanceof Error && err.message.includes('見つかりません')
            ? err.message
            : '期限切れリスク集計の取得に失敗しました';
        res.status(message.includes('見つかりません') ? 404 : 500).json({ error: message });
    }
});
// My dead stock list
router.get('/dead-stock', async (req, res) => {
    try {
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
            defaultLimit: 50,
            maxLimit: 200,
        });
        const items = await database_1.db.select()
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.deadStockItems.createdAt))
            .limit(limit)
            .offset(offset);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, req.user.id));
        res.json({
            data: items,
            pagination: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('Dead stock list error:', { error: err.message });
        res.status(500).json({ error: 'デッドストックリストの取得に失敗しました' });
    }
});
// Delete dead stock item
router.delete('/dead-stock/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        const deleted = await database_1.db.delete(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.id, id), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, req.user.id)))
            .returning({ id: schema_1.deadStockItems.id });
        if (deleted.length === 0) {
            res.status(404).json({ error: '対象データが見つかりません' });
            return;
        }
        void (0, log_service_1.writeLog)('dead_stock_delete', {
            pharmacyId: req.user.id,
            detail: `在庫ID:${id} を削除`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message: '削除しました' });
    }
    catch (err) {
        logger_1.logger.error('Delete dead stock error:', { error: err.message });
        res.status(500).json({ error: '削除に失敗しました' });
    }
});
// My used medication list
router.get('/used-medication', async (req, res) => {
    try {
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
            defaultLimit: 50,
            maxLimit: 200,
        });
        const items = await database_1.db.select()
            .from(schema_1.usedMedicationItems)
            .where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.usedMedicationItems.createdAt))
            .limit(limit)
            .offset(offset);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.usedMedicationItems)
            .where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, req.user.id));
        res.json({
            data: items,
            pagination: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('Used medication list error:', { error: err.message });
        res.status(500).json({ error: '医薬品使用量リストの取得に失敗しました' });
    }
});
// Browse all pharmacies' inventory
router.get('/browse', async (req, res) => {
    try {
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
            defaultLimit: 50,
            maxLimit: 200,
        });
        const search = (0, request_utils_1.normalizeSearchTerm)(req.query.search);
        let searchCondition;
        if (search) {
            const normalized = (0, kana_utils_1.normalizeKana)(search);
            const hiragana = (0, kana_utils_1.katakanaToHiragana)(normalized);
            const katakana = (0, kana_utils_1.hiraganaToKatakana)(normalized);
            const likeTerms = [...new Set([normalized, hiragana, katakana])];
            const likeConditions = likeTerms.map((term) => (0, drizzle_orm_1.like)(schema_1.deadStockItems.drugName, `%${(0, request_utils_1.escapeLikeWildcards)(term)}%`));
            searchCondition = likeConditions.length === 1 ? likeConditions[0] : (0, drizzle_orm_1.or)(...likeConditions);
        }
        const blockCondition = (0, drizzle_orm_1.notExists)(database_1.db.select({ id: schema_1.pharmacyRelationships.id })
            .from(schema_1.pharmacyRelationships)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'blocked'), (0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, schema_1.deadStockItems.pharmacyId)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, schema_1.deadStockItems.pharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, req.user.id))))));
        const whereExpr = (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true), (0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true), searchCondition, blockCondition);
        const items = await database_1.db.select({
            id: schema_1.deadStockItems.id,
            pharmacyId: schema_1.deadStockItems.pharmacyId,
            drugName: schema_1.deadStockItems.drugName,
            quantity: schema_1.deadStockItems.quantity,
            unit: schema_1.deadStockItems.unit,
            packageLabel: schema_1.deadStockItems.packageLabel,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
            yakkaTotal: schema_1.deadStockItems.yakkaTotal,
            expirationDate: schema_1.deadStockItems.expirationDate,
            pharmacyName: schema_1.pharmacies.name,
            prefecture: schema_1.pharmacies.prefecture,
        })
            .from(schema_1.deadStockItems)
            .innerJoin(schema_1.pharmacies, (0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, schema_1.pharmacies.id))
            .where(whereExpr)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.deadStockItems.createdAt))
            .limit(limit)
            .offset(offset);
        // Fetch business hours for pharmacies in results
        const pharmacyIds = [...new Set(items.map((i) => i.pharmacyId))];
        const [allHours, allSpecialHours] = pharmacyIds.length > 0
            ? await Promise.all([
                database_1.db.select({
                    pharmacyId: schema_1.pharmacyBusinessHours.pharmacyId,
                    dayOfWeek: schema_1.pharmacyBusinessHours.dayOfWeek,
                    openTime: schema_1.pharmacyBusinessHours.openTime,
                    closeTime: schema_1.pharmacyBusinessHours.closeTime,
                    isClosed: schema_1.pharmacyBusinessHours.isClosed,
                    is24Hours: schema_1.pharmacyBusinessHours.is24Hours,
                })
                    .from(schema_1.pharmacyBusinessHours)
                    .where((0, drizzle_orm_1.inArray)(schema_1.pharmacyBusinessHours.pharmacyId, pharmacyIds)),
                database_1.db.select({
                    pharmacyId: schema_1.pharmacySpecialHours.pharmacyId,
                    id: schema_1.pharmacySpecialHours.id,
                    specialType: schema_1.pharmacySpecialHours.specialType,
                    startDate: schema_1.pharmacySpecialHours.startDate,
                    endDate: schema_1.pharmacySpecialHours.endDate,
                    openTime: schema_1.pharmacySpecialHours.openTime,
                    closeTime: schema_1.pharmacySpecialHours.closeTime,
                    isClosed: schema_1.pharmacySpecialHours.isClosed,
                    is24Hours: schema_1.pharmacySpecialHours.is24Hours,
                    note: schema_1.pharmacySpecialHours.note,
                    updatedAt: schema_1.pharmacySpecialHours.updatedAt,
                })
                    .from(schema_1.pharmacySpecialHours)
                    .where((0, drizzle_orm_1.inArray)(schema_1.pharmacySpecialHours.pharmacyId, pharmacyIds)),
            ])
            : [[], []];
        const hoursByPharmacy = (0, array_utils_1.groupBy)(allHours, (h) => h.pharmacyId);
        const specialHoursByPharmacy = (0, array_utils_1.groupBy)(allSpecialHours, (h) => h.pharmacyId);
        const now = new Date();
        const enrichedItems = items.map(({ pharmacyId, ...item }) => {
            const hours = hoursByPharmacy.get(pharmacyId) ?? [];
            const specialHours = specialHoursByPharmacy.get(pharmacyId) ?? [];
            const status = (0, business_hours_utils_1.getBusinessHoursStatus)(hours, specialHours, now);
            const isConfigured = hours.length > 0 || specialHours.length > 0;
            return { ...item, businessStatus: { ...status, isConfigured } };
        });
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.deadStockItems)
            .innerJoin(schema_1.pharmacies, (0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, schema_1.pharmacies.id))
            .where(whereExpr);
        res.json({
            data: enrichedItems,
            pagination: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('Browse inventory error:', { error: err.message });
        res.status(500).json({ error: '在庫参照に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.js.map