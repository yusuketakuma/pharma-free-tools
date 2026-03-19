"use strict";
/**
 * タイムラインサービス
 *
 * 全 aggregator を並列実行し、優先度付与・ページネーションを行うメイン API。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeline = getTimeline;
exports.getTimelineUnreadCount = getTimelineUnreadCount;
exports.markTimelineViewed = markTimelineViewed;
exports.getSmartDigest = getSmartDigest;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const timeline_aggregators_1 = require("./timeline-aggregators");
const timeline_priority_engine_1 = require("./timeline-priority-engine");
const timeline_unread_counts_1 = require("./timeline-unread-counts");
const cursor_pagination_1 = require("../utils/cursor-pagination");
// デフォルト値定数
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DIGEST_PER_TABLE_LIMIT = 100;
const CURSOR_FETCH_FACTOR = 4;
const CURSOR_PER_TABLE_LIMIT_MAX = 200;
function timestampSortValue(timestamp) {
    const parsed = Date.parse(timestamp);
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}
function eventIdForSort(id) {
    const separator = id.lastIndexOf('_');
    if (separator < 0)
        return null;
    const suffix = id.slice(separator + 1);
    if (!/^\d+$/.test(suffix))
        return null;
    const parsed = Number(suffix);
    return Number.isFinite(parsed) ? parsed : null;
}
/**
 * Timeline の並び順:
 * 1) timestamp DESC
 * 2) id DESC (同時刻時の決定論的 tie-break)
 */
function compareTimelineOrder(a, b) {
    const left = timestampSortValue(a.timestamp);
    const right = timestampSortValue(b.timestamp);
    if (left !== right)
        return right - left;
    const aId = eventIdForSort(a.id);
    const bId = eventIdForSort(b.id);
    if (aId !== null && bId !== null) {
        return bId - aId;
    }
    return a.id.localeCompare(b.id);
}
function buildCursorFromEvent(event) {
    return { timestamp: event.timestamp, id: event.id };
}
function buildNextCursor(events, hasMore) {
    if (!hasMore || events.length === 0)
        return null;
    const tail = events[events.length - 1];
    return (0, cursor_pagination_1.encodeCursor)(buildCursorFromEvent(tail));
}
/**
 * RawTimelineEvent に優先度を付与して TimelineEvent に変換する。
 */
function enrichEvent(raw, now) {
    return {
        ...raw,
        priority: (0, timeline_priority_engine_1.assignPriority)(raw, now),
    };
}
/**
 * 全 fetcher を並列実行して flatten されたイベント配列を返す。
 */
async function fetchAllEvents(db, pharmacyId, since, perTableLimit, before) {
    const results = await Promise.all([
        (0, timeline_aggregators_1.fetchNotificationEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchMatchEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchProposalEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchCommentEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchFeedbackEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchUploadEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchAdminMessageEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchExchangeHistoryEvents)(db, pharmacyId, since, perTableLimit, before),
        (0, timeline_aggregators_1.fetchExpiryRiskEvents)(db, pharmacyId, perTableLimit, before),
    ]);
    return results.flat();
}
/**
 * タイムライン取得（メイン関数）
 *
 * - 全9 fetcher を Promise.all() で並列実行
 * - 優先度付与、timestamp 降順ソート
 * - priority フィルタ（任意）
 * - cursor-based ページネーション
 */
async function getTimeline(db, pharmacyId, options) {
    const limit = Math.min(Math.max(1, options?.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
    const priority = options?.priority;
    const since = options?.since;
    const cursor = options?.cursor ?? null;
    const cursorBefore = cursor?.timestamp;
    const perTableLimit = Math.min(Math.max(limit * CURSOR_FETCH_FACTOR, limit + 1), CURSOR_PER_TABLE_LIMIT_MAX);
    const now = new Date();
    const rawEvents = await fetchAllEvents(db, pharmacyId, since, perTableLimit, cursorBefore);
    // 優先度付与
    let enriched = rawEvents.map((raw) => enrichEvent(raw, now));
    // 優先度フィルタ
    if (priority) {
        enriched = enriched.filter((e) => e.priority === priority);
    }
    // timestamp 降順ソート
    enriched.sort(compareTimelineOrder);
    const total = enriched.length;
    const filteredForCursor = cursor
        ? enriched.filter((event) => compareTimelineOrder(event, cursor) > 0)
        : enriched;
    const hasMore = filteredForCursor.length > limit;
    const events = filteredForCursor.slice(0, limit);
    return {
        events,
        total,
        hasMore,
        nextCursor: buildNextCursor(events, hasMore),
    };
}
/**
 * 未読数取得
 *
 * 全テーブルの COUNT を単一 SQL で集計する（1 round trip）。
 */
async function getTimelineUnreadCount(db, pharmacyId) {
    return (0, timeline_unread_counts_1.countAllUnread)(db, pharmacyId);
}
/**
 * 閲覧済みマーク
 *
 * pharmacies.lastTimelineViewedAt を現在時刻に更新する。
 */
async function markTimelineViewed(db, pharmacyId) {
    await db
        .update(schema_1.pharmacies)
        .set({ lastTimelineViewedAt: new Date().toISOString() })
        .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId));
}
/**
 * スマートダイジェスト
 *
 * Critical/High のイベントのみ抽出（最大5件）、timestamp 降順。
 */
async function getSmartDigest(db, pharmacyId) {
    const now = new Date();
    const rawEvents = await fetchAllEvents(db, pharmacyId, undefined, DIGEST_PER_TABLE_LIMIT);
    const enriched = rawEvents.map((raw) => enrichEvent(raw, now));
    const highPriority = enriched.filter((e) => e.priority === 'critical' || e.priority === 'high');
    highPriority.sort(compareTimelineOrder);
    return highPriority.slice(0, 5);
}
//# sourceMappingURL=timeline-service.js.map