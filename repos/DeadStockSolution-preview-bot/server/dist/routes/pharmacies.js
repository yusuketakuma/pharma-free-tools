"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const business_hours_utils_1 = require("../utils/business-hours-utils");
const array_utils_1 = require("../utils/array-utils");
const auth_1 = require("../middleware/auth");
const geo_utils_1 = require("../utils/geo-utils");
const request_utils_1 = require("../utils/request-utils");
const db_utils_1 = require("../utils/db-utils");
const kana_utils_1 = require("../utils/kana-utils");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.get('/', async (req, res) => {
    try {
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
            defaultLimit: 20,
            maxLimit: 100,
        });
        const search = (0, request_utils_1.normalizeSearchTerm)(req.query.search);
        const prefecture = (0, request_utils_1.normalizeSearchTerm)(req.query.prefecture, 20);
        const sortBy = req.query.sortBy === 'distance' ? 'distance' : undefined;
        const [currentPharmacy] = await database_1.db.select({
            latitude: schema_1.pharmacies.latitude,
            longitude: schema_1.pharmacies.longitude,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
            .limit(1);
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true)];
        if (search) {
            const normalized = (0, kana_utils_1.normalizeKana)(search);
            const hiragana = (0, kana_utils_1.katakanaToHiragana)(normalized);
            const katakana = (0, kana_utils_1.hiraganaToKatakana)(normalized);
            const likeTerms = [...new Set([normalized, hiragana, katakana])];
            const nameConditions = likeTerms.map((term) => (0, drizzle_orm_1.like)(schema_1.pharmacies.name, `%${(0, request_utils_1.escapeLikeWildcards)(term)}%`));
            conditions.push(nameConditions.length === 1 ? nameConditions[0] : (0, drizzle_orm_1.or)(...nameConditions));
        }
        if (prefecture) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.pharmacies.prefecture, prefecture));
        }
        const whereExpr = conditions.length === 1 ? conditions[0] : (0, drizzle_orm_1.and)(...conditions);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.pharmacies).where(whereExpr);
        const hasCurrentCoords = currentPharmacy?.latitude !== null &&
            currentPharmacy?.longitude !== null &&
            currentPharmacy?.latitude !== undefined &&
            currentPharmacy?.longitude !== undefined;
        const originLatitude = hasCurrentCoords ? currentPharmacy.latitude : null;
        const originLongitude = hasCurrentCoords ? currentPharmacy.longitude : null;
        const distanceExpr = hasCurrentCoords
            ? (0, drizzle_orm_1.sql) `CASE
          WHEN ${schema_1.pharmacies.latitude} IS NULL OR ${schema_1.pharmacies.longitude} IS NULL THEN NULL
          ELSE (
            6371 * 2 * ASIN(
              SQRT(
                POWER(SIN(RADIANS((${schema_1.pharmacies.latitude} - ${originLatitude}) / 2)), 2) +
                COS(RADIANS(${originLatitude})) * COS(RADIANS(${schema_1.pharmacies.latitude})) *
                POWER(SIN(RADIANS((${schema_1.pharmacies.longitude} - ${originLongitude}) / 2)), 2)
              )
            )
          )
        END`
            : (0, drizzle_orm_1.sql) `NULL`;
        const selectFields = {
            id: schema_1.pharmacies.id,
            name: schema_1.pharmacies.name,
            prefecture: schema_1.pharmacies.prefecture,
            address: schema_1.pharmacies.address,
            phone: schema_1.pharmacies.phone,
            fax: schema_1.pharmacies.fax,
            latitude: schema_1.pharmacies.latitude,
            longitude: schema_1.pharmacies.longitude,
            distance: sortBy === 'distance' ? distanceExpr : (0, drizzle_orm_1.sql) `NULL`,
        };
        const baseRows = sortBy === 'distance'
            ? hasCurrentCoords
                ? await database_1.db.select(selectFields)
                    .from(schema_1.pharmacies)
                    .where(whereExpr)
                    .orderBy((0, drizzle_orm_1.sql) `COALESCE(${distanceExpr}, 999999)`, (0, drizzle_orm_1.asc)(schema_1.pharmacies.name))
                    .limit(limit)
                    .offset(offset)
                : await database_1.db.select(selectFields)
                    .from(schema_1.pharmacies)
                    .where(whereExpr)
                    .orderBy((0, drizzle_orm_1.asc)(schema_1.pharmacies.name))
                    .limit(limit)
                    .offset(offset)
            : await database_1.db.select(selectFields)
                .from(schema_1.pharmacies)
                .where(whereExpr)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.pharmacies.createdAt))
                .limit(limit)
                .offset(offset);
        const withDistance = baseRows.map((row) => {
            let distance = row.distance === null ? null : Number(row.distance);
            if (!Number.isFinite(distance)) {
                distance = null;
            }
            if (distance === null &&
                originLatitude !== null &&
                originLongitude !== null &&
                row.latitude !== null &&
                row.longitude !== null) {
                distance = Math.round((0, geo_utils_1.haversineDistance)(originLatitude, originLongitude, row.latitude, row.longitude) * 10) / 10;
            }
            else if (distance !== null) {
                distance = Math.round(distance * 10) / 10;
            }
            return { ...row, distance };
        });
        // Fetch business hours for all pharmacies in the page result
        const pharmacyIds = withDistance.map((r) => r.id);
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
        const enrichedWithHours = withDistance.map((row) => {
            const hours = hoursByPharmacy.get(row.id) ?? [];
            const specialHours = specialHoursByPharmacy.get(row.id) ?? [];
            const status = (0, business_hours_utils_1.getBusinessHoursStatus)(hours, specialHours, now);
            const isConfigured = hours.length > 0 || specialHours.length > 0;
            return {
                ...row,
                businessHours: hours.map(({ pharmacyId: _, ...rest }) => rest),
                businessStatus: { ...status, isConfigured },
            };
        });
        res.json({
            data: enrichedWithHours,
            pagination: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('Pharmacies list error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '薬局一覧の取得に失敗しました' });
    }
});
// ── お気に入り / ブロック ──────────────────────────────
// NOTE: These routes MUST be defined before /:id to avoid route collision
router.get('/relationships', async (req, res) => {
    try {
        const rows = await database_1.db.select({
            id: schema_1.pharmacyRelationships.id,
            targetPharmacyId: schema_1.pharmacyRelationships.targetPharmacyId,
            relationshipType: schema_1.pharmacyRelationships.relationshipType,
            createdAt: schema_1.pharmacyRelationships.createdAt,
            targetPharmacyName: schema_1.pharmacies.name,
        })
            .from(schema_1.pharmacyRelationships)
            .innerJoin(schema_1.pharmacies, (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, schema_1.pharmacies.id))
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, req.user.id));
        res.json({
            favorites: rows.filter((r) => r.relationshipType === 'favorite'),
            blocked: rows.filter((r) => r.relationshipType === 'blocked'),
        });
    }
    catch (err) {
        logger_1.logger.error('Relationships list error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'リレーション情報の取得に失敗しました' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const id = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!id) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        const [pharmacy] = await database_1.db.select({
            id: schema_1.pharmacies.id,
            name: schema_1.pharmacies.name,
            prefecture: schema_1.pharmacies.prefecture,
            address: schema_1.pharmacies.address,
            phone: schema_1.pharmacies.phone,
            fax: schema_1.pharmacies.fax,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, id), (0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true)))
            .limit(1);
        if (!pharmacy) {
            res.status(404).json({ error: '薬局が見つかりません' });
            return;
        }
        res.json(pharmacy);
    }
    catch (err) {
        logger_1.logger.error('Pharmacy detail error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '薬局情報の取得に失敗しました' });
    }
});
router.post('/:id/favorite', async (req, res) => {
    try {
        const targetId = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!targetId) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        if (targetId === req.user.id) {
            res.status(400).json({ error: '自分自身をお気に入りに追加できません' });
            return;
        }
        // Verify target pharmacy exists
        const [target] = await database_1.db.select({ id: schema_1.pharmacies.id })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, targetId), (0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true)))
            .limit(1);
        if (!target) {
            res.status(404).json({ error: '対象の薬局が見つかりません' });
            return;
        }
        await database_1.db.insert(schema_1.pharmacyRelationships).values({
            pharmacyId: req.user.id,
            targetPharmacyId: targetId,
            relationshipType: 'favorite',
        }).onConflictDoUpdate({
            target: [schema_1.pharmacyRelationships.pharmacyId, schema_1.pharmacyRelationships.targetPharmacyId],
            set: {
                relationshipType: 'favorite',
                createdAt: new Date().toISOString(),
            },
        });
        res.json({ message: 'お気に入りに設定しました' });
    }
    catch (err) {
        logger_1.logger.error('Add favorite error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'お気に入りの追加に失敗しました' });
    }
});
router.delete('/:id/favorite', async (req, res) => {
    try {
        const targetId = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!targetId) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        await database_1.db.delete(schema_1.pharmacyRelationships)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, targetId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'favorite')));
        res.json({ message: 'お気に入りを解除しました' });
    }
    catch (err) {
        logger_1.logger.error('Remove favorite error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'お気に入りの解除に失敗しました' });
    }
});
router.post('/:id/block', async (req, res) => {
    try {
        const targetId = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!targetId) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        if (targetId === req.user.id) {
            res.status(400).json({ error: '自分自身をブロックできません' });
            return;
        }
        // Verify target pharmacy exists
        const [target] = await database_1.db.select({ id: schema_1.pharmacies.id })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, targetId), (0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true)))
            .limit(1);
        if (!target) {
            res.status(404).json({ error: '対象の薬局が見つかりません' });
            return;
        }
        await database_1.db.insert(schema_1.pharmacyRelationships).values({
            pharmacyId: req.user.id,
            targetPharmacyId: targetId,
            relationshipType: 'blocked',
        }).onConflictDoUpdate({
            target: [schema_1.pharmacyRelationships.pharmacyId, schema_1.pharmacyRelationships.targetPharmacyId],
            set: {
                relationshipType: 'blocked',
                createdAt: new Date().toISOString(),
            },
        });
        res.json({ message: 'ブロックしました' });
    }
    catch (err) {
        logger_1.logger.error('Add block error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'ブロックの追加に失敗しました' });
    }
});
router.delete('/:id/block', async (req, res) => {
    try {
        const targetId = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!targetId) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        await database_1.db.delete(schema_1.pharmacyRelationships)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, targetId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'blocked')));
        res.json({ message: 'ブロックを解除しました' });
    }
    catch (err) {
        logger_1.logger.error('Remove block error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'ブロックの解除に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=pharmacies.js.map