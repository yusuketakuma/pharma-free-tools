"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const request_utils_1 = require("../utils/request-utils");
const timeline_service_1 = require("../services/timeline-service");
const error_handler_1 = require("../middleware/error-handler");
const cursor_pagination_1 = require("../utils/cursor-pagination");
const router = (0, express_1.Router)();
const VALID_PRIORITIES = new Set(['critical', 'high', 'medium', 'low']);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
function parseTimelineCursor(raw) {
    if (raw === undefined)
        return undefined;
    if (typeof raw !== 'string' || raw.trim().length === 0)
        return null;
    const cursor = (0, cursor_pagination_1.decodeCursor)(raw);
    if (!cursor)
        return null;
    if (typeof cursor.id !== 'string' || cursor.id.length === 0)
        return null;
    if (typeof cursor.timestamp !== 'string' || !Number.isFinite(Date.parse(cursor.timestamp)))
        return null;
    return cursor;
}
function parseTimelinePriority(raw) {
    if (typeof raw !== 'string')
        return undefined;
    return VALID_PRIORITIES.has(raw) ? raw : undefined;
}
function parseTimelineLimit(raw) {
    const parsedLimit = (0, request_utils_1.parsePositiveInt)(raw);
    return Math.min(parsedLimit ?? DEFAULT_LIMIT, MAX_LIMIT);
}
// GET /api/timeline
// query: cursor, limit, priority (optional filter), since (optional ISO date)
// Response: { events: TimelineEvent[], total: number, hasMore: boolean, nextCursor: string | null, ... }
router.get('/', auth_1.requireLogin, async (req, res) => {
    try {
        const authReq = req;
        const pharmacyId = authReq.user.id;
        const limit = parseTimelineLimit(req.query.limit);
        const priority = parseTimelinePriority(req.query.priority);
        const since = typeof req.query.since === 'string' ? req.query.since : undefined;
        const cursor = parseTimelineCursor(req.query.cursor);
        if (cursor === null) {
            res.status(400).json({ error: 'cursorが不正です' });
            return;
        }
        const result = await (0, timeline_service_1.getTimeline)(database_1.db, pharmacyId, { cursor, limit, priority, since });
        res.json({
            ...result,
            limit,
            pagination: {
                mode: 'cursor',
                limit,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor ?? null,
            },
        });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'タイムライン取得エラー', 'タイムラインの取得に失敗しました', res);
    }
});
// GET /api/timeline/bootstrap
// query: limit, priority (optional), since (optional)
// Response: { timeline, digest, unreadCount }
router.get('/bootstrap', auth_1.requireLogin, async (req, res) => {
    try {
        const authReq = req;
        const pharmacyId = authReq.user.id;
        const limit = parseTimelineLimit(req.query.limit);
        const priority = parseTimelinePriority(req.query.priority);
        const since = typeof req.query.since === 'string' ? req.query.since : undefined;
        const [timeline, digestEvents, unreadCount] = await Promise.all([
            (0, timeline_service_1.getTimeline)(database_1.db, pharmacyId, { limit, priority, since, cursor: undefined }),
            (0, timeline_service_1.getSmartDigest)(database_1.db, pharmacyId),
            (0, timeline_service_1.getTimelineUnreadCount)(database_1.db, pharmacyId),
        ]);
        res.json({
            timeline: {
                ...timeline,
                limit,
                pagination: {
                    mode: 'cursor',
                    limit,
                    hasMore: timeline.hasMore,
                    nextCursor: timeline.nextCursor ?? null,
                },
            },
            digest: { events: digestEvents },
            unreadCount,
        });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'タイムライン初期データ取得エラー', 'タイムライン初期データの取得に失敗しました', res);
    }
});
// GET /api/timeline/unread-count
// Response: { unreadCount: number }
router.get('/unread-count', auth_1.requireLogin, async (req, res) => {
    try {
        const authReq = req;
        const pharmacyId = authReq.user.id;
        const unreadCount = await (0, timeline_service_1.getTimelineUnreadCount)(database_1.db, pharmacyId);
        res.json({ unreadCount });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'タイムライン未読数取得エラー', 'タイムライン未読数の取得に失敗しました', res);
    }
});
// PATCH /api/timeline/mark-viewed
// Response: { success: true }
router.patch('/mark-viewed', auth_1.requireLogin, async (req, res) => {
    try {
        const authReq = req;
        const pharmacyId = authReq.user.id;
        await (0, timeline_service_1.markTimelineViewed)(database_1.db, pharmacyId);
        res.json({ success: true });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'タイムライン閲覧済みマークエラー', 'タイムライン閲覧済みマークに失敗しました', res);
    }
});
// GET /api/timeline/digest
// Response: { events: TimelineEvent[] }
router.get('/digest', auth_1.requireLogin, async (req, res) => {
    try {
        const authReq = req;
        const pharmacyId = authReq.user.id;
        const events = await (0, timeline_service_1.getSmartDigest)(database_1.db, pharmacyId);
        res.json({ events });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'タイムラインダイジェスト取得エラー', 'タイムラインダイジェストの取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=timeline.js.map