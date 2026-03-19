"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const request_utils_1 = require("../utils/request-utils");
const db_utils_1 = require("../utils/db-utils");
const logger_1 = require("../services/logger");
const cursor_pagination_1 = require("../utils/cursor-pagination");
const router = (0, express_1.Router)();
function parseHistoryCursor(raw) {
    if (raw === undefined)
        return undefined;
    if (typeof raw !== 'string' || raw.trim().length === 0)
        return null;
    const cursor = (0, cursor_pagination_1.decodeCursor)(raw);
    if (!cursor)
        return null;
    if (!Number.isInteger(cursor.id) || cursor.id <= 0)
        return null;
    if (cursor.completedAt !== null && typeof cursor.completedAt !== 'string')
        return null;
    return cursor;
}
// Exchange history
router.get('/history', async (req, res) => {
    try {
        const { page, limit, offset } = (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
            defaultLimit: 20,
            maxLimit: 100,
            maxPage: 200,
        });
        const cursorLimit = (0, request_utils_1.parsePositiveInt)(req.query.limit);
        const cursor = parseHistoryCursor(req.query.cursor);
        if (cursor === null) {
            res.status(400).json({ error: 'cursorが不正です' });
            return;
        }
        const resolvedLimit = Math.min(cursorLimit ?? limit, 100);
        const pharmacyId = req.user.id;
        const ownershipFilter = (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyBId, pharmacyId));
        const cursorFilter = cursor
            ? (cursor.completedAt === null
                ? (0, drizzle_orm_1.lt)(schema_1.exchangeHistory.id, cursor.id)
                : (0, drizzle_orm_1.or)((0, drizzle_orm_1.lt)(schema_1.exchangeHistory.completedAt, cursor.completedAt), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeHistory.completedAt, cursor.completedAt), (0, drizzle_orm_1.lt)(schema_1.exchangeHistory.id, cursor.id))))
            : undefined;
        const whereClause = cursorFilter ? (0, drizzle_orm_1.and)(ownershipFilter, cursorFilter) : ownershipFilter;
        const historyQuery = database_1.db.select()
            .from(schema_1.exchangeHistory)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeHistory.completedAt), (0, drizzle_orm_1.desc)(schema_1.exchangeHistory.id))
            .limit(cursor ? resolvedLimit + 1 : resolvedLimit)
            .offset(cursor ? 0 : offset);
        const [rows, countRows] = await Promise.all([
            historyQuery,
            cursor
                ? Promise.resolve([{ count: 0 }])
                : database_1.db.select({ count: db_utils_1.rowCount })
                    .from(schema_1.exchangeHistory)
                    .where(ownershipFilter),
        ]);
        const [countRow] = countRows;
        const hasMore = cursor ? rows.length > resolvedLimit : page * resolvedLimit < countRow.count;
        const pageRows = cursor ? rows.slice(0, resolvedLimit) : rows;
        const pharmacyIds = [...new Set(pageRows.flatMap((row) => [row.pharmacyAId, row.pharmacyBId]))];
        const pharmacyRows = pharmacyIds.length > 0
            ? await database_1.db.select({ id: schema_1.pharmacies.id, name: schema_1.pharmacies.name })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, pharmacyIds))
            : [];
        const pharmacyMap = new Map(pharmacyRows.map((row) => [row.id, row.name]));
        const enriched = pageRows.map((row) => ({
            ...row,
            pharmacyAName: pharmacyMap.get(row.pharmacyAId) ?? '',
            pharmacyBName: pharmacyMap.get(row.pharmacyBId) ?? '',
        }));
        const totalCount = cursor ? undefined : countRow.count;
        const lastRow = pageRows[pageRows.length - 1];
        const nextCursor = hasMore && lastRow
            ? (0, cursor_pagination_1.encodeCursor)({ completedAt: lastRow.completedAt ?? null, id: lastRow.id })
            : null;
        const mode = cursor ? 'cursor' : 'page';
        res.json({
            data: enriched,
            pagination: {
                page,
                limit: resolvedLimit,
                total: totalCount,
                totalPages: totalCount !== undefined ? Math.ceil(totalCount / resolvedLimit) : undefined,
                mode,
                hasMore,
                nextCursor,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('Exchange history error:', { error: err.message });
        res.status(500).json({ error: '交換履歴の取得に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=exchange-history.js.map