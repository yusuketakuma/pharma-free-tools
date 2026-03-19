"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const request_utils_1 = require("../utils/request-utils");
const db_utils_1 = require("../utils/db-utils");
const admin_utils_1 = require("./admin-utils");
const VALID_LOG_ACTIONS = [
    'login', 'login_failed', 'admin_login', 'register', 'logout',
    'upload', 'proposal_create', 'proposal_accept', 'proposal_reject', 'proposal_complete',
    'account_update', 'account_deactivate', 'admin_toggle_active', 'admin_send_message',
    'dead_stock_delete', 'password_reset_request', 'password_reset_complete',
    'password_reset_failed', 'drug_master_sync', 'drug_master_package_upload', 'drug_master_edit',
];
const SYSTEM_EVENT_DETAIL_PREVIEW_MAX_LENGTH = 256;
const VALID_SYSTEM_EVENT_SOURCES = schema_1.systemEventSourceValues;
const VALID_SYSTEM_EVENT_LEVELS = schema_1.systemEventLevelValues;
function parseAdminLogFilters(req) {
    const rawAction = typeof req.query.action === 'string' ? req.query.action.trim() : '';
    const actionFilter = VALID_LOG_ACTIONS.includes(rawAction)
        ? rawAction
        : undefined;
    const rawResult = typeof req.query.result === 'string' ? req.query.result.trim() : '';
    return {
        actionFilter,
        failureOnly: rawResult === 'failure',
        keyword: (0, request_utils_1.normalizeSearchTerm)(req.query.keyword, 120),
    };
}
function buildActivityLogWhereClause(filters, options = {}) {
    const conditions = [];
    if (filters.actionFilter) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.activityLogs.action, filters.actionFilter));
    }
    if (filters.keyword) {
        conditions.push((0, drizzle_orm_1.like)(schema_1.activityLogs.detail, `%${(0, request_utils_1.escapeLikeWildcards)(filters.keyword)}%`));
    }
    if (options.forceFailureOnly || filters.failureOnly) {
        conditions.push((0, drizzle_orm_1.like)(schema_1.activityLogs.detail, '失敗|%'));
    }
    return conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
}
function parseAdminSystemEventFilters(req) {
    const rawSource = typeof req.query.source === 'string' ? req.query.source.trim() : '';
    const sourceFilter = VALID_SYSTEM_EVENT_SOURCES.includes(rawSource)
        ? rawSource
        : undefined;
    const rawLevel = typeof req.query.level === 'string' ? req.query.level.trim() : '';
    const levelFilter = VALID_SYSTEM_EVENT_LEVELS.includes(rawLevel)
        ? rawLevel
        : undefined;
    return {
        sourceFilter,
        levelFilter,
        keyword: (0, request_utils_1.normalizeSearchTerm)(req.query.keyword, 120),
    };
}
function buildSystemEventWhereClause(filters) {
    const conditions = [];
    if (filters.sourceFilter) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.systemEvents.source, filters.sourceFilter));
    }
    if (filters.levelFilter) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.systemEvents.level, filters.levelFilter));
    }
    if (filters.keyword) {
        const pattern = `%${(0, request_utils_1.escapeLikeWildcards)(filters.keyword)}%`;
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.systemEvents.eventType, pattern), (0, drizzle_orm_1.like)(schema_1.systemEvents.message, pattern)));
    }
    return conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
}
function truncateSystemEventDetail(detailJson) {
    if (!detailJson)
        return null;
    if (detailJson.length <= SYSTEM_EVENT_DETAIL_PREVIEW_MAX_LENGTH)
        return detailJson;
    return `${detailJson.slice(0, SYSTEM_EVENT_DETAIL_PREVIEW_MAX_LENGTH)}...`;
}
async function fetchActivityLogRows(whereClause, limit, offset) {
    return database_1.db.select({
        id: schema_1.activityLogs.id,
        pharmacyId: schema_1.activityLogs.pharmacyId,
        action: schema_1.activityLogs.action,
        detail: schema_1.activityLogs.detail,
        ipAddress: schema_1.activityLogs.ipAddress,
        createdAt: schema_1.activityLogs.createdAt,
    })
        .from(schema_1.activityLogs)
        .where(whereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.activityLogs.createdAt))
        .limit(limit)
        .offset(offset);
}
async function mapActivityLogsWithPharmacyName(rows) {
    const pharmacyIds = [...new Set(rows.map((row) => row.pharmacyId).filter((id) => id !== null))];
    const pharmacyRows = pharmacyIds.length > 0
        ? await database_1.db.select({ id: schema_1.pharmacies.id, name: schema_1.pharmacies.name })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, pharmacyIds))
        : [];
    const pharmacyMap = new Map(pharmacyRows.map((row) => [row.id, row.name]));
    return rows.map((row) => ({
        ...row,
        pharmacyName: row.pharmacyId ? pharmacyMap.get(row.pharmacyId) ?? null : null,
    }));
}
async function fetchSystemEventRows(whereClause, limit, offset) {
    return database_1.db.select({
        id: schema_1.systemEvents.id,
        source: schema_1.systemEvents.source,
        level: schema_1.systemEvents.level,
        eventType: schema_1.systemEvents.eventType,
        message: schema_1.systemEvents.message,
        detailJson: schema_1.systemEvents.detailJson,
        occurredAt: schema_1.systemEvents.occurredAt,
        createdAt: schema_1.systemEvents.createdAt,
    })
        .from(schema_1.systemEvents)
        .where(whereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.systemEvents.occurredAt), (0, drizzle_orm_1.desc)(schema_1.systemEvents.id))
        .limit(limit)
        .offset(offset);
}
async function fetchFailureSummary(whereClause) {
    const [failureTotal] = await database_1.db.select({ count: db_utils_1.rowCount })
        .from(schema_1.activityLogs)
        .where(whereClause);
    const failureByActionRows = await database_1.db.select({
        action: schema_1.activityLogs.action,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.activityLogs)
        .where(whereClause)
        .groupBy(schema_1.activityLogs.action);
    const failureByAction = failureByActionRows.reduce((acc, row) => {
        acc[row.action] = row.count;
        return acc;
    }, {});
    const failureReasonExpr = (0, drizzle_orm_1.sql) `coalesce(substring(${schema_1.activityLogs.detail} from 'reason=([^|]+)'), 'unknown')`;
    const failureByReason = await database_1.db.select({
        reason: failureReasonExpr,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.activityLogs)
        .where(whereClause)
        .groupBy(failureReasonExpr)
        .orderBy((0, drizzle_orm_1.sql) `count(*)::int desc`)
        .limit(10);
    return {
        failureTotal: failureTotal.count,
        failureByAction,
        failureByReason,
    };
}
async function fetchSystemEventTotal(whereClause) {
    const [totalRow] = await database_1.db.select({ count: db_utils_1.rowCount })
        .from(schema_1.systemEvents)
        .where(whereClause);
    return totalRow.count;
}
async function fetchSystemEventSummary(whereClause) {
    const [bySourceRows, byLevelRows] = await Promise.all([
        database_1.db.select({
            source: schema_1.systemEvents.source,
            count: db_utils_1.rowCount,
        })
            .from(schema_1.systemEvents)
            .where(whereClause)
            .groupBy(schema_1.systemEvents.source),
        database_1.db.select({
            level: schema_1.systemEvents.level,
            count: db_utils_1.rowCount,
        })
            .from(schema_1.systemEvents)
            .where(whereClause)
            .groupBy(schema_1.systemEvents.level),
    ]);
    return {
        bySource: bySourceRows.reduce((acc, row) => {
            acc[row.source] = row.count;
            return acc;
        }, {}),
        byLevel: byLevelRows.reduce((acc, row) => {
            acc[row.level] = row.count;
            return acc;
        }, {}),
    };
}
const router = (0, express_1.Router)();
router.get('/logs', async (req, res) => {
    try {
        const { page, limit, offset } = (0, admin_utils_1.parseListPagination)(req, 50);
        const filters = parseAdminLogFilters(req);
        const whereClause = buildActivityLogWhereClause(filters);
        const failureWhereClause = buildActivityLogWhereClause(filters, { forceFailureOnly: true });
        const rows = await fetchActivityLogRows(whereClause, limit, offset);
        const mappedRows = await mapActivityLogsWithPharmacyName(rows);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.activityLogs)
            .where(whereClause);
        const failureSummary = await fetchFailureSummary(failureWhereClause);
        (0, admin_utils_1.sendPaginated)(res, mappedRows, page, limit, total.count, {
            summary: {
                failureTotal: failureSummary.failureTotal,
                failureByAction: failureSummary.failureByAction,
                failureByReason: failureSummary.failureByReason,
            },
            filters: {
                action: filters.actionFilter ?? null,
                result: filters.failureOnly ? 'failure' : 'all',
                keyword: filters.keyword ?? null,
            },
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin logs error', 'ログの取得に失敗しました', res);
    }
});
router.get('/system-events', async (req, res) => {
    try {
        const { page, limit, offset } = (0, admin_utils_1.parseListPagination)(req, 50);
        const filters = parseAdminSystemEventFilters(req);
        const whereClause = buildSystemEventWhereClause(filters);
        const shouldLoadSummary = page === 1;
        const [rows, total, summary] = await Promise.all([
            fetchSystemEventRows(whereClause, limit, offset),
            fetchSystemEventTotal(whereClause),
            shouldLoadSummary
                ? fetchSystemEventSummary(whereClause)
                : Promise.resolve({ bySource: {}, byLevel: {} }),
        ]);
        const responseRows = rows.map((row) => ({
            ...row,
            detailJson: truncateSystemEventDetail(row.detailJson),
        }));
        (0, admin_utils_1.sendPaginated)(res, responseRows, page, limit, total, {
            summary: {
                bySource: summary.bySource,
                byLevel: summary.byLevel,
            },
            filters: {
                source: filters.sourceFilter ?? null,
                level: filters.levelFilter ?? null,
                keyword: filters.keyword ?? null,
            },
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin system events error', 'システムイベントの取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-logs.js.map