"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateDashboardUnreadCache = invalidateDashboardUnreadCache;
exports.createNotification = createNotification;
exports.getUnreadCount = getUnreadCount;
exports.getDashboardUnreadCount = getDashboardUnreadCount;
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.markAllDashboardAsRead = markAllDashboardAsRead;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const logger_1 = require("./logger");
function isUndefinedTableError(err) {
    return typeof err === 'object' && err !== null && err.code === '42P01';
}
function toBoolean(value) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value !== 0;
    if (typeof value === 'string')
        return ['t', 'true', '1'].includes(value.toLowerCase());
    return false;
}
const DASHBOARD_UNREAD_CACHE_TTL_MS = 15_000;
const DASHBOARD_UNREAD_CACHE_MAX_SIZE = 500;
const DASHBOARD_UNREAD_CACHE_ENABLED = process.env.NODE_ENV !== 'test';
const dashboardUnreadCache = new Map();
function getCachedDashboardUnreadCount(pharmacyId) {
    if (!DASHBOARD_UNREAD_CACHE_ENABLED)
        return null;
    const cached = dashboardUnreadCache.get(pharmacyId);
    if (!cached)
        return null;
    if (cached.expiresAt <= Date.now()) {
        dashboardUnreadCache.delete(pharmacyId);
        return null;
    }
    return cached.value;
}
function setCachedDashboardUnreadCount(pharmacyId, value) {
    if (!DASHBOARD_UNREAD_CACHE_ENABLED)
        return;
    const now = Date.now();
    if (dashboardUnreadCache.size >= DASHBOARD_UNREAD_CACHE_MAX_SIZE && !dashboardUnreadCache.has(pharmacyId)) {
        for (const [key, entry] of dashboardUnreadCache) {
            if (entry.expiresAt <= now)
                dashboardUnreadCache.delete(key);
        }
        if (dashboardUnreadCache.size >= DASHBOARD_UNREAD_CACHE_MAX_SIZE) {
            const oldest = dashboardUnreadCache.keys().next().value;
            if (oldest !== undefined)
                dashboardUnreadCache.delete(oldest);
        }
    }
    dashboardUnreadCache.set(pharmacyId, {
        value,
        expiresAt: now + DASHBOARD_UNREAD_CACHE_TTL_MS,
    });
}
function invalidateDashboardUnreadCache(pharmacyId) {
    if (!DASHBOARD_UNREAD_CACHE_ENABLED)
        return;
    dashboardUnreadCache.delete(pharmacyId);
}
async function markNotificationsAsRead(executor, pharmacyId) {
    const updatedRows = await executor.execute((0, drizzle_orm_1.sql) `
    WITH updated AS (
      UPDATE notifications
      SET is_read = true, read_at = now()
      WHERE pharmacy_id = ${pharmacyId} AND is_read = false
      RETURNING 1
    )
    SELECT COUNT(*)::int AS count FROM updated
  `);
    return Number(updatedRows.rows[0]?.count ?? 0);
}
async function createNotification(input) {
    try {
        const [result] = await database_1.db.insert(schema_1.notifications).values({
            pharmacyId: input.pharmacyId,
            type: input.type,
            title: input.title,
            message: input.message,
            referenceType: input.referenceType ?? null,
            referenceId: input.referenceId ?? null,
        }).returning({ id: schema_1.notifications.id });
        invalidateDashboardUnreadCache(input.pharmacyId);
        return result ?? null;
    }
    catch (err) {
        logger_1.logger.error('Failed to create notification', { error: err.message });
        return null;
    }
}
async function getUnreadCount(pharmacyId) {
    const [result] = await database_1.db.select({ value: (0, drizzle_orm_1.count)() })
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.notifications.isRead, false)));
    return result?.value ?? 0;
}
async function getDashboardUnreadCount(pharmacyId) {
    const cached = getCachedDashboardUnreadCount(pharmacyId);
    if (cached !== null) {
        return cached;
    }
    const matchUnreadPromise = database_1.db.select({ count: db_utils_1.rowCount })
        .from(schema_1.matchNotifications)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.matchNotifications.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.matchNotifications.isRead, false)))
        .catch((err) => {
        if (!isUndefinedTableError(err)) {
            throw err;
        }
        logger_1.logger.warn('match_notifications unread count query failed (table may not exist)', {
            error: err instanceof Error ? err.message : String(err),
        });
        return [{ count: 0 }];
    });
    const [notificationsUnread, [adminUnreadRow], [matchUnreadRow]] = await Promise.all([
        getUnreadCount(pharmacyId),
        database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.adminMessages)
            .leftJoin(schema_1.adminMessageReads, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adminMessageReads.messageId, schema_1.adminMessages.id), (0, drizzle_orm_1.eq)(schema_1.adminMessageReads.pharmacyId, pharmacyId)))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'all'), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'pharmacy'), (0, drizzle_orm_1.eq)(schema_1.adminMessages.targetPharmacyId, pharmacyId))), (0, drizzle_orm_1.isNull)(schema_1.adminMessageReads.messageId))),
        matchUnreadPromise,
    ]);
    const totalUnread = notificationsUnread + (adminUnreadRow?.count ?? 0) + (matchUnreadRow?.count ?? 0);
    setCachedDashboardUnreadCount(pharmacyId, totalUnread);
    return totalUnread;
}
async function getNotifications(pharmacyId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [countResult] = await database_1.db.select({ value: (0, drizzle_orm_1.count)() })
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.pharmacyId, pharmacyId));
    const rows = await database_1.db.select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.pharmacyId, pharmacyId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))
        .limit(limit)
        .offset(offset);
    return { rows, total: countResult?.value ?? 0 };
}
async function markAsRead(notificationId, pharmacyId) {
    const result = await database_1.db.update(schema_1.notifications)
        .set({ isRead: true, readAt: new Date().toISOString() })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId), (0, drizzle_orm_1.eq)(schema_1.notifications.pharmacyId, pharmacyId)))
        .returning({ id: schema_1.notifications.id });
    if (result.length > 0) {
        invalidateDashboardUnreadCache(pharmacyId);
    }
    return result.length > 0;
}
async function markAllAsRead(pharmacyId) {
    const count = await markNotificationsAsRead(database_1.db, pharmacyId);
    if (count > 0) {
        invalidateDashboardUnreadCache(pharmacyId);
    }
    return count;
}
async function markAllDashboardAsRead(pharmacyId) {
    const total = await database_1.db.transaction(async (tx) => {
        const notificationCount = await markNotificationsAsRead(tx, pharmacyId);
        const matchTableExistsRows = await tx.execute((0, drizzle_orm_1.sql) `
      SELECT to_regclass('public.match_notifications') IS NOT NULL AS exists
    `);
        const hasMatchNotificationsTable = toBoolean(matchTableExistsRows.rows[0]?.exists);
        const matchUpdateRows = hasMatchNotificationsTable
            ? await tx.execute((0, drizzle_orm_1.sql) `
        WITH updated AS (
          UPDATE match_notifications
          SET is_read = true
          WHERE pharmacy_id = ${pharmacyId} AND is_read = false
          RETURNING 1
        )
        SELECT COUNT(*)::int AS count FROM updated
      `)
            : { rows: [{ count: 0 }] };
        const insertedAdminReadRows = await tx.execute((0, drizzle_orm_1.sql) `
      WITH inserted AS (
        INSERT INTO admin_message_reads (message_id, pharmacy_id)
        SELECT m.id, ${pharmacyId}
        FROM admin_messages AS m
        LEFT JOIN admin_message_reads AS reads
          ON reads.message_id = m.id AND reads.pharmacy_id = ${pharmacyId}
        WHERE (
          m.target_type = 'all'
          OR (m.target_type = 'pharmacy' AND m.target_pharmacy_id = ${pharmacyId})
        )
          AND reads.message_id IS NULL
        ON CONFLICT (message_id, pharmacy_id) DO NOTHING
        RETURNING 1
      )
      SELECT COUNT(*)::int AS count FROM inserted
    `);
        const matchUpdateCount = Number(matchUpdateRows.rows[0]?.count ?? 0);
        const adminMessageReadCount = Number(insertedAdminReadRows.rows[0]?.count ?? 0);
        return notificationCount + matchUpdateCount + adminMessageReadCount;
    });
    if (total > 0) {
        invalidateDashboardUnreadCache(pharmacyId);
    }
    return total;
}
//# sourceMappingURL=notification-service.js.map