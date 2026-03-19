"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const request_utils_1 = require("../utils/request-utils");
const db_utils_1 = require("../utils/db-utils");
const log_service_1 = require("../services/log-service");
const kana_utils_1 = require("../utils/kana-utils");
const drug_master_service_1 = require("../services/drug-master-service");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
// ── 統計情報 ──────────────────────────────────────
router.get('/stats', async (_req, res) => {
    try {
        const stats = await (0, drug_master_service_1.getDrugMasterStats)();
        res.json(stats);
    }
    catch (err) {
        logger_1.logger.error('Drug master stats error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '統計情報の取得に失敗しました' });
    }
});
// ── 一覧取得（ページネーション・検索・フィルター対応）──
router.get('/', async (req, res) => {
    try {
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, { defaultLimit: 30, maxLimit: 100 });
        const search = (0, request_utils_1.normalizeSearchTerm)(req.query.search);
        const statusFilter = req.query.status; // listed / transition / delisted / all
        const categoryFilter = (0, request_utils_1.normalizeSearchTerm)(req.query.category);
        const conditions = [];
        // ステータスフィルター
        if (statusFilter === 'listed') {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.drugMaster.isListed, true));
        }
        else if (statusFilter === 'delisted') {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.drugMaster.isListed, false));
        }
        else if (statusFilter === 'transition') {
            conditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drugMaster.isListed, true), (0, drizzle_orm_1.isNotNull)(schema_1.drugMaster.transitionDeadline)));
        }
        // カテゴリフィルター
        if (categoryFilter) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.drugMaster.category, categoryFilter));
        }
        // 検索
        if (search) {
            const normalized = (0, kana_utils_1.normalizeKana)(search);
            const hiragana = (0, kana_utils_1.katakanaToHiragana)(normalized);
            const katakana = (0, kana_utils_1.hiraganaToKatakana)(normalized);
            const likeTerms = new Set([normalized, hiragana, katakana]);
            const nameConditions = [...likeTerms].map((term) => (0, drizzle_orm_1.like)(schema_1.drugMaster.drugName, `%${(0, request_utils_1.escapeLikeWildcards)(term)}%`));
            const genericConditions = [...likeTerms].map((term) => (0, drizzle_orm_1.like)(schema_1.drugMaster.genericName, `%${(0, request_utils_1.escapeLikeWildcards)(term)}%`));
            const allSearchConditions = [...nameConditions, ...genericConditions];
            // YJコード検索
            if (/^[A-Z0-9]+$/i.test(search.trim())) {
                allSearchConditions.push((0, drizzle_orm_1.like)(schema_1.drugMaster.yjCode, `%${(0, request_utils_1.escapeLikeWildcards)(search.trim())}%`));
            }
            conditions.push((0, drizzle_orm_1.or)(...allSearchConditions));
        }
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const [totalResult] = await database_1.db.select({ value: db_utils_1.rowCount })
            .from(schema_1.drugMaster)
            .where(whereClause);
        const items = await database_1.db.select({
            id: schema_1.drugMaster.id,
            yjCode: schema_1.drugMaster.yjCode,
            drugName: schema_1.drugMaster.drugName,
            genericName: schema_1.drugMaster.genericName,
            specification: schema_1.drugMaster.specification,
            unit: schema_1.drugMaster.unit,
            yakkaPrice: schema_1.drugMaster.yakkaPrice,
            manufacturer: schema_1.drugMaster.manufacturer,
            category: schema_1.drugMaster.category,
            isListed: schema_1.drugMaster.isListed,
            transitionDeadline: schema_1.drugMaster.transitionDeadline,
            updatedAt: schema_1.drugMaster.updatedAt,
        })
            .from(schema_1.drugMaster)
            .where(whereClause)
            .orderBy(schema_1.drugMaster.drugName)
            .limit(limit)
            .offset(offset);
        res.json({
            data: items,
            pagination: {
                page,
                limit,
                total: totalResult.value,
                totalPages: Math.ceil(totalResult.value / limit),
            },
        });
    }
    catch (err) {
        logger_1.logger.error('Drug master list error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '医薬品マスターの取得に失敗しました' });
    }
});
// ── 詳細取得 ─────────────────────────────────────
router.get('/detail/:yjCode', async (req, res) => {
    try {
        const yjCode = String(req.params.yjCode ?? '');
        if (!yjCode || yjCode.length > 20) {
            res.status(400).json({ error: '無効なYJコードです' });
            return;
        }
        const detail = await (0, drug_master_service_1.getDrugDetail)(yjCode);
        if (!detail) {
            res.status(404).json({ error: '医薬品が見つかりません' });
            return;
        }
        res.json(detail);
    }
    catch (err) {
        logger_1.logger.error('Drug master detail error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '医薬品詳細の取得に失敗しました' });
    }
});
// ── 個別編集 ─────────────────────────────────────
router.put('/detail/:yjCode', async (req, res) => {
    try {
        const yjCode = String(req.params.yjCode ?? '');
        if (!yjCode || yjCode.length > 20) {
            res.status(400).json({ error: '無効なYJコードです' });
            return;
        }
        const body = req.body;
        const updates = {};
        if (typeof body.drugName === 'string' && body.drugName.trim()) {
            updates.drugName = body.drugName.trim().slice(0, 500);
        }
        if (body.genericName !== undefined) {
            updates.genericName = typeof body.genericName === 'string' ? body.genericName.trim().slice(0, 500) || null : null;
        }
        if (body.specification !== undefined) {
            updates.specification = typeof body.specification === 'string' ? body.specification.trim().slice(0, 200) || null : null;
        }
        if (body.unit !== undefined) {
            updates.unit = typeof body.unit === 'string' ? body.unit.trim().slice(0, 50) || null : null;
        }
        if (typeof body.yakkaPrice === 'number' && body.yakkaPrice >= 0) {
            updates.yakkaPrice = body.yakkaPrice;
        }
        if (body.manufacturer !== undefined) {
            updates.manufacturer = typeof body.manufacturer === 'string' ? body.manufacturer.trim().slice(0, 200) || null : null;
        }
        if (typeof body.isListed === 'boolean') {
            updates.isListed = body.isListed;
        }
        if (body.transitionDeadline !== undefined) {
            updates.transitionDeadline = typeof body.transitionDeadline === 'string' ? body.transitionDeadline.trim() || null : null;
        }
        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: '更新するフィールドが指定されていません' });
            return;
        }
        const updated = await (0, drug_master_service_1.updateDrugMasterItem)(yjCode, updates);
        if (!updated) {
            res.status(404).json({ error: '医薬品が見つかりません' });
            return;
        }
        await (0, log_service_1.writeLog)('drug_master_edit', {
            pharmacyId: req.user.id,
            detail: `医薬品マスター編集: ${yjCode} ${updated.drugName}`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json(updated);
    }
    catch (err) {
        logger_1.logger.error('Drug master update error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '医薬品の更新に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=drug-master-crud.js.map