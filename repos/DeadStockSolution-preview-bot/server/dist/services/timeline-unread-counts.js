"use strict";
/**
 * タイムライン未読 COUNT クエリ
 *
 * テーブルごとに軽量な COUNT(*) クエリを発行し、全行フェッチを回避する。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUnreadNotifications = countUnreadNotifications;
exports.countUnreadMatchNotifications = countUnreadMatchNotifications;
exports.countUnreadComments = countUnreadComments;
exports.countUnreadAdminMessages = countUnreadAdminMessages;
exports.countUnreadProposals = countUnreadProposals;
exports.countUnreadFeedback = countUnreadFeedback;
exports.countUnreadExpiryRisk = countUnreadExpiryRisk;
exports.countUnreadUploads = countUnreadUploads;
exports.countUnreadExchangeHistory = countUnreadExchangeHistory;
exports.countAllUnread = countAllUnread;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const timeline_aggregators_1 = require("./timeline-aggregators");
/**
 * isRead フラグパターン共通ヘルパー。
 * pharmacyId 一致 + (isRead=false OR createdAt > lastViewed) の COUNT を返す。
 */
async function countUnreadByIsReadFlag(db, table, pharmacyIdCol, isReadCol, createdAtCol, pharmacyId, lastViewed) {
    const conditions = [(0, drizzle_orm_1.eq)(pharmacyIdCol, pharmacyId)];
    if (lastViewed) {
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(isReadCol, false), (0, drizzle_orm_1.gt)(createdAtCol, lastViewed)));
    }
    else {
        conditions.push((0, drizzle_orm_1.eq)(isReadCol, false));
    }
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(table)
        .where((0, drizzle_orm_1.and)(...conditions));
    return rows[0]?.count ?? 0;
}
/** notifications: isRead=false OR createdAt > lastViewed */
async function countUnreadNotifications(db, pharmacyId, lastViewed) {
    return countUnreadByIsReadFlag(db, schema_1.notifications, schema_1.notifications.pharmacyId, schema_1.notifications.isRead, schema_1.notifications.createdAt, pharmacyId, lastViewed);
}
/** matchNotifications: isRead=false OR createdAt > lastViewed */
async function countUnreadMatchNotifications(db, pharmacyId, lastViewed) {
    return countUnreadByIsReadFlag(db, schema_1.matchNotifications, schema_1.matchNotifications.pharmacyId, schema_1.matchNotifications.isRead, schema_1.matchNotifications.createdAt, pharmacyId, lastViewed);
}
/** proposalComments: 参加中提案のみ + readByRecipient=false OR createdAt > lastViewed */
async function countUnreadComments(db, pharmacyId, lastViewed) {
    const baseConditions = [
        (0, drizzle_orm_1.eq)(schema_1.proposalComments.isDeleted, false),
        (0, drizzle_orm_1.ne)(schema_1.proposalComments.authorPharmacyId, pharmacyId),
        (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId)),
    ];
    if (lastViewed) {
        baseConditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.proposalComments.readByRecipient, false), (0, drizzle_orm_1.gt)(schema_1.proposalComments.createdAt, lastViewed)));
    }
    else {
        baseConditions.push((0, drizzle_orm_1.eq)(schema_1.proposalComments.readByRecipient, false));
    }
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(schema_1.proposalComments)
        .innerJoin(schema_1.exchangeProposals, (0, drizzle_orm_1.eq)(schema_1.proposalComments.proposalId, schema_1.exchangeProposals.id))
        .where((0, drizzle_orm_1.and)(...baseConditions));
    return rows[0]?.count ?? 0;
}
/** adminMessages: LEFT JOIN adminMessageReads → IS NULL (未読) + lastViewed */
async function countUnreadAdminMessages(db, pharmacyId, lastViewed) {
    const targetCondition = (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'all'), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'pharmacy'), (0, drizzle_orm_1.eq)(schema_1.adminMessages.targetPharmacyId, pharmacyId)));
    const unreadCondition = lastViewed
        ? (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.adminMessageReads.id), (0, drizzle_orm_1.gt)(schema_1.adminMessages.createdAt, lastViewed))
        : (0, drizzle_orm_1.isNull)(schema_1.adminMessageReads.id);
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(schema_1.adminMessages)
        .leftJoin(schema_1.adminMessageReads, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adminMessageReads.messageId, schema_1.adminMessages.id), (0, drizzle_orm_1.eq)(schema_1.adminMessageReads.pharmacyId, pharmacyId)))
        .where((0, drizzle_orm_1.and)(targetCondition, unreadCondition));
    return rows[0]?.count ?? 0;
}
/** exchangeProposals: 常に unread → COUNT(*) */
async function countUnreadProposals(db, pharmacyId) {
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(schema_1.exchangeProposals)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId)));
    return rows[0]?.count ?? 0;
}
/** exchangeFeedback: 常に unread → COUNT(*) */
async function countUnreadFeedback(db, pharmacyId) {
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(schema_1.exchangeFeedback)
        .where((0, drizzle_orm_1.eq)(schema_1.exchangeFeedback.toPharmacyId, pharmacyId));
    return rows[0]?.count ?? 0;
}
/** deadStockItems: 常に unread (期限リスク条件付き) → COUNT(*) */
async function countUnreadExpiryRisk(db, pharmacyId) {
    const { todayStr, threeDaysLaterStr } = (0, timeline_aggregators_1.getExpiryDateRange)();
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(schema_1.deadStockItems)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true), (0, drizzle_orm_1.isNotNull)(schema_1.deadStockItems.expirationDateIso), (0, drizzle_orm_1.gte)(schema_1.deadStockItems.expirationDateIso, todayStr), (0, drizzle_orm_1.lte)(schema_1.deadStockItems.expirationDateIso, threeDaysLaterStr)));
    return rows[0]?.count ?? 0;
}
/** uploads: 常に read → createdAt > lastViewed のみ */
async function countUnreadUploads(db, pharmacyId, lastViewed) {
    if (!lastViewed)
        return 0;
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(schema_1.uploads)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, pharmacyId), (0, drizzle_orm_1.gt)(schema_1.uploads.createdAt, lastViewed)));
    return rows[0]?.count ?? 0;
}
/** exchangeHistory: 常に read → completedAt > lastViewed のみ */
async function countUnreadExchangeHistory(db, pharmacyId, lastViewed) {
    if (!lastViewed)
        return 0;
    const rows = await db
        .select({ count: db_utils_1.rowCount })
        .from(schema_1.exchangeHistory)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyBId, pharmacyId)), (0, drizzle_orm_1.gt)(schema_1.exchangeHistory.completedAt, lastViewed)));
    return rows[0]?.count ?? 0;
}
/**
 * 全未読数を単一 SQL で集計する（1 round trip 版）。
 *
 * 9テーブルの COUNT をスカラーサブクエリで結合し、DBへの
 * ラウンドトリップを10回から1回に削減する。
 * last_timeline_viewed_at は外側クエリの `pharmacies` 行を再利用し、
 * 各サブクエリでの重複参照を避ける。
 */
async function countAllUnread(db, pharmacyId) {
    const { todayStr, threeDaysLaterStr } = (0, timeline_aggregators_1.getExpiryDateRange)();
    const rows = await db
        .select({
        total: (0, drizzle_orm_1.sql) `
        COALESCE((
          SELECT count(*)::int FROM notifications
          WHERE pharmacy_id = ${pharmacyId}
            AND (is_read = false OR (
              ${schema_1.pharmacies.lastTimelineViewedAt} IS NOT NULL
              AND created_at > ${schema_1.pharmacies.lastTimelineViewedAt}
            ))
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM match_notifications
          WHERE pharmacy_id = ${pharmacyId}
            AND (is_read = false OR (
              ${schema_1.pharmacies.lastTimelineViewedAt} IS NOT NULL
              AND created_at > ${schema_1.pharmacies.lastTimelineViewedAt}
            ))
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM exchange_proposals
          WHERE pharmacy_a_id = ${pharmacyId} OR pharmacy_b_id = ${pharmacyId}
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM proposal_comments pc
          WHERE pc.is_deleted = false
            AND pc.author_pharmacy_id != ${pharmacyId}
            AND EXISTS (
              SELECT 1 FROM exchange_proposals ep
              WHERE ep.id = pc.proposal_id
                AND (ep.pharmacy_a_id = ${pharmacyId} OR ep.pharmacy_b_id = ${pharmacyId})
            )
            AND (pc.read_by_recipient = false OR (
              ${schema_1.pharmacies.lastTimelineViewedAt} IS NOT NULL
              AND pc.created_at > ${schema_1.pharmacies.lastTimelineViewedAt}
            ))
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM exchange_feedback
          WHERE to_pharmacy_id = ${pharmacyId}
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM uploads
          WHERE pharmacy_id = ${pharmacyId}
            AND ${schema_1.pharmacies.lastTimelineViewedAt} IS NOT NULL
            AND created_at > ${schema_1.pharmacies.lastTimelineViewedAt}
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM admin_messages am
          LEFT JOIN admin_message_reads amr ON amr.message_id = am.id AND amr.pharmacy_id = ${pharmacyId}
          WHERE (am.target_type = 'all' OR (am.target_type = 'pharmacy' AND am.target_pharmacy_id = ${pharmacyId}))
            AND (amr.id IS NULL OR (
              ${schema_1.pharmacies.lastTimelineViewedAt} IS NOT NULL
              AND am.created_at > ${schema_1.pharmacies.lastTimelineViewedAt}
            ))
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM exchange_history
          WHERE (pharmacy_a_id = ${pharmacyId} OR pharmacy_b_id = ${pharmacyId})
            AND ${schema_1.pharmacies.lastTimelineViewedAt} IS NOT NULL
            AND completed_at > ${schema_1.pharmacies.lastTimelineViewedAt}
        ), 0)
        + COALESCE((
          SELECT count(*)::int FROM dead_stock_items
          WHERE pharmacy_id = ${pharmacyId}
            AND is_available = true
            AND expiration_date_iso IS NOT NULL
            AND expiration_date_iso >= ${todayStr}
            AND expiration_date_iso <= ${threeDaysLaterStr}
        ), 0)
      `,
    })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId));
    return rows[0]?.total ?? 0;
}
//# sourceMappingURL=timeline-unread-counts.js.map