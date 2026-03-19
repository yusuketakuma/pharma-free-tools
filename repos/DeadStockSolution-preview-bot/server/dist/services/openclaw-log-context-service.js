"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOpenClawLogContext = buildOpenClawLogContext;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const number_utils_1 = require("../utils/number-utils");
const DEFAULT_WINDOW_HOURS = 24;
const DEFAULT_RECENT_FAILURE_LIMIT = 20;
const DEFAULT_RECENT_ACTIVITY_LIMIT = 20;
const DEFAULT_DETAIL_MAX_LENGTH = 280;
const IMPORT_FAILURE_ACTIONS = ['upload', 'drug_master_sync', 'drug_master_package_upload'];
function sanitizeDetail(detail) {
    if (!detail)
        return null;
    const normalized = detail.replace(/\s+/g, ' ').trim();
    if (!normalized)
        return null;
    const maxLength = (0, number_utils_1.parseBoundedInt)(process.env.OPENCLAW_LOG_CONTEXT_DETAIL_MAX_LENGTH, DEFAULT_DETAIL_MAX_LENGTH, 80, 2000);
    if (normalized.length <= maxLength)
        return normalized;
    return `${normalized.slice(0, maxLength)}...`;
}
function normalizeLogRows(rows) {
    return rows.map((row) => ({
        action: row.action,
        detail: sanitizeDetail(row.detail),
        createdAt: row.createdAt,
        pharmacyId: row.pharmacyId,
    }));
}
async function buildOpenClawLogContext(pharmacyId, now = new Date()) {
    const windowHours = (0, number_utils_1.parseBoundedInt)(process.env.OPENCLAW_LOG_CONTEXT_WINDOW_HOURS, DEFAULT_WINDOW_HOURS, 1, 24 * 30);
    const failureLimit = (0, number_utils_1.parseBoundedInt)(process.env.OPENCLAW_LOG_CONTEXT_RECENT_FAILURE_LIMIT, DEFAULT_RECENT_FAILURE_LIMIT, 1, 200);
    const activityLimit = (0, number_utils_1.parseBoundedInt)(process.env.OPENCLAW_LOG_CONTEXT_RECENT_ACTIVITY_LIMIT, DEFAULT_RECENT_ACTIVITY_LIMIT, 1, 200);
    const windowStartIso = new Date(now.getTime() - windowHours * 60 * 60 * 1000).toISOString();
    const failureWhereClause = (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.activityLogs.pharmacyId, pharmacyId), (0, drizzle_orm_1.gte)(schema_1.activityLogs.createdAt, windowStartIso), (0, drizzle_orm_1.like)(schema_1.activityLogs.detail, '失敗|%'), (0, drizzle_orm_1.inArray)(schema_1.activityLogs.action, IMPORT_FAILURE_ACTIONS));
    const [failureTotalRow] = await database_1.db.select({ count: db_utils_1.rowCount })
        .from(schema_1.activityLogs)
        .where(failureWhereClause);
    const failureByActionRows = await database_1.db.select({
        action: schema_1.activityLogs.action,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.activityLogs)
        .where(failureWhereClause)
        .groupBy(schema_1.activityLogs.action);
    const failureReasonExpr = (0, drizzle_orm_1.sql) `coalesce(substring(${schema_1.activityLogs.detail} from 'reason=([^|]+)'), 'unknown')`;
    const failureByReasonRows = await database_1.db.select({
        reason: failureReasonExpr,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.activityLogs)
        .where(failureWhereClause)
        .groupBy(failureReasonExpr)
        .orderBy((0, drizzle_orm_1.sql) `count(*)::int desc`)
        .limit(10);
    const recentFailureRows = await database_1.db.select({
        action: schema_1.activityLogs.action,
        detail: schema_1.activityLogs.detail,
        createdAt: schema_1.activityLogs.createdAt,
        pharmacyId: schema_1.activityLogs.pharmacyId,
    })
        .from(schema_1.activityLogs)
        .where(failureWhereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.activityLogs.createdAt))
        .limit(failureLimit);
    const pharmacyWhereClause = (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.activityLogs.pharmacyId, pharmacyId), (0, drizzle_orm_1.gte)(schema_1.activityLogs.createdAt, windowStartIso));
    const recentPharmacyRows = await database_1.db.select({
        action: schema_1.activityLogs.action,
        detail: schema_1.activityLogs.detail,
        createdAt: schema_1.activityLogs.createdAt,
        pharmacyId: schema_1.activityLogs.pharmacyId,
    })
        .from(schema_1.activityLogs)
        .where(pharmacyWhereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.activityLogs.createdAt))
        .limit(activityLimit);
    return {
        generatedAt: now.toISOString(),
        windowHours,
        monitoredImportActions: [...IMPORT_FAILURE_ACTIONS],
        importFailures: {
            total: failureTotalRow?.count ?? 0,
            byAction: failureByActionRows.map((row) => ({
                action: row.action,
                count: row.count,
            })),
            byReason: failureByReasonRows.map((row) => ({
                reason: row.reason,
                count: row.count,
            })),
            recent: normalizeLogRows(recentFailureRows),
        },
        pharmacyActivity: {
            pharmacyId,
            recent: normalizeLogRows(recentPharmacyRows),
        },
    };
}
//# sourceMappingURL=openclaw-log-context-service.js.map