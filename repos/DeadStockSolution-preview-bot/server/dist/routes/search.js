"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_1 = require("../middleware/auth");
const kana_utils_1 = require("../utils/kana-utils");
const request_utils_1 = require("../utils/request-utils");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
const MAX_SUGGESTIONS = 10;
function sanitizeQuery(value) {
    if (typeof value !== 'string')
        return undefined;
    const sanitized = value
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim();
    if (!sanitized)
        return undefined;
    return sanitized.slice(0, 100);
}
// Drug name suggestions for incremental search
router.get('/drugs', async (req, res) => {
    try {
        const rawQuery = sanitizeQuery(req.query.q);
        if (!rawQuery) {
            res.json([]);
            return;
        }
        const query = (0, kana_utils_1.normalizeKana)(rawQuery);
        const hiragana = (0, kana_utils_1.katakanaToHiragana)(query);
        const katakana = (0, kana_utils_1.hiraganaToKatakana)(query);
        // Build OR conditions for original, hiragana, and katakana variants
        const likeTerms = new Set([query, hiragana, katakana]);
        const conditions = [...likeTerms].map((term) => (0, drizzle_orm_1.like)(schema_1.deadStockItems.drugName, `%${(0, request_utils_1.escapeLikeWildcards)(term)}%`));
        const results = await database_1.db.selectDistinct({
            drugName: schema_1.deadStockItems.drugName,
        })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true), conditions.length === 1 ? conditions[0] : (0, drizzle_orm_1.or)(...conditions)))
            .limit(MAX_SUGGESTIONS);
        res.json(results.map((r) => r.drugName));
    }
    catch (err) {
        logger_1.logger.error('Drug search suggest error', { error: err.message });
        res.status(500).json({ error: '検索に失敗しました' });
    }
});
// Drug master suggestions (includes yakka price)
router.get('/drug-master', async (req, res) => {
    try {
        const rawQuery = sanitizeQuery(req.query.q);
        if (!rawQuery) {
            res.json([]);
            return;
        }
        const query = (0, kana_utils_1.normalizeKana)(rawQuery);
        const hiragana = (0, kana_utils_1.katakanaToHiragana)(query);
        const katakana = (0, kana_utils_1.hiraganaToKatakana)(query);
        const likeTerms = new Set([query, hiragana, katakana]);
        const nameConditions = [...likeTerms].map((term) => (0, drizzle_orm_1.like)(schema_1.drugMaster.drugName, `%${(0, request_utils_1.escapeLikeWildcards)(term)}%`));
        // YJコード検索にも対応
        const isCodeSearch = /^[A-Z0-9]+$/i.test(rawQuery.trim());
        const allConditions = [...nameConditions];
        if (isCodeSearch) {
            allConditions.push((0, drizzle_orm_1.like)(schema_1.drugMaster.yjCode, `%${(0, request_utils_1.escapeLikeWildcards)(rawQuery.trim())}%`));
        }
        const results = await database_1.db.select({
            yjCode: schema_1.drugMaster.yjCode,
            drugName: schema_1.drugMaster.drugName,
            yakkaPrice: schema_1.drugMaster.yakkaPrice,
            unit: schema_1.drugMaster.unit,
            specification: schema_1.drugMaster.specification,
        })
            .from(schema_1.drugMaster)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drugMaster.isListed, true), (0, drizzle_orm_1.or)(...allConditions)))
            .limit(MAX_SUGGESTIONS);
        res.json(results);
    }
    catch (err) {
        logger_1.logger.error('Drug master search error', { error: err.message });
        res.status(500).json({ error: '検索に失敗しました' });
    }
});
// Pharmacy name suggestions for incremental search
router.get('/pharmacies', async (req, res) => {
    try {
        const rawQuery = sanitizeQuery(req.query.q);
        if (!rawQuery) {
            res.json([]);
            return;
        }
        const query = (0, kana_utils_1.normalizeKana)(rawQuery);
        const hiragana = (0, kana_utils_1.katakanaToHiragana)(query);
        const katakana = (0, kana_utils_1.hiraganaToKatakana)(query);
        const likeTerms = new Set([query, hiragana, katakana]);
        const conditions = [...likeTerms].map((term) => (0, drizzle_orm_1.like)(schema_1.pharmacies.name, `%${(0, request_utils_1.escapeLikeWildcards)(term)}%`));
        const results = await database_1.db.selectDistinct({
            name: schema_1.pharmacies.name,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true), conditions.length === 1 ? conditions[0] : (0, drizzle_orm_1.or)(...conditions)))
            .limit(MAX_SUGGESTIONS);
        res.json(results.map((r) => r.name));
    }
    catch (err) {
        logger_1.logger.error('Pharmacy search suggest error', { error: err.message });
        res.status(500).json({ error: '検索に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map