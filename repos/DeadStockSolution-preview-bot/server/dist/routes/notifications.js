"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const schema_1 = require("../db/schema");
const request_utils_1 = require("../utils/request-utils");
const path_utils_1 = require("../utils/path-utils");
const logger_1 = require("../services/logger");
const cursor_pagination_1 = require("../utils/cursor-pagination");
const notification_service_1 = require("../services/notification-service");
const PROPOSAL_RESPONSE_DEADLINE_HOURS = 72;
const NOTICE_RESULT_LIMIT = 20;
const SOURCE_NOTICE_FETCH_LIMIT = 30;
const PROPOSAL_NOTICE_LIMIT = SOURCE_NOTICE_FETCH_LIMIT;
const PROPOSAL_NOTICE_STATUSES = ['proposed', 'accepted_a', 'accepted_b', 'confirmed'];
const PROPOSAL_EVENT_NOTIFICATION_TYPES = new Set(['proposal_received', 'proposal_status_changed']);
const MATCH_NOTICE_LIMIT = SOURCE_NOTICE_FETCH_LIMIT;
const MAX_NOTICE_PAGE_LIMIT = 50;
function isUndefinedTableError(err) {
    return typeof err === 'object' && err !== null && err.code === '42P01';
}
function parseNumericList(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
}
function parseMatchDiff(raw) {
    try {
        const parsed = JSON.parse(raw);
        const addedCount = parseNumericList(parsed.addedPharmacyIds).length;
        const removedCount = parseNumericList(parsed.removedPharmacyIds).length;
        return { addedCount, removedCount };
    }
    catch {
        return { addedCount: 0, removedCount: 0 };
    }
}
function matchUpdateNotice(row, currentPharmacyId, triggerPharmacyName) {
    const uploadTypeLabel = row.triggerUploadType === 'dead_stock' ? 'デッドストック' : '使用量';
    const triggerLabel = row.triggerPharmacyId === currentPharmacyId
        ? '自薬局'
        : (triggerPharmacyName ?? `薬局 #${row.triggerPharmacyId}`);
    const { addedCount, removedCount } = parseMatchDiff(row.diffJson);
    return {
        id: `match-${row.id}`,
        type: 'match_update',
        title: `${triggerLabel}の${uploadTypeLabel}更新で候補が更新されました`,
        body: `候補数 ${row.candidateCountBefore}件 → ${row.candidateCountAfter}件（追加 ${addedCount} / 除外 ${removedCount}）`,
        actionPath: '/matching',
        actionLabel: '候補を確認',
        createdAt: row.createdAt,
        deadlineAt: null,
        unread: !row.isRead,
        priority: row.isRead ? 4 : 2,
    };
}
function buildProposalDeadlineAt(proposedAt) {
    if (!proposedAt)
        return null;
    const proposedAtMs = new Date(proposedAt).getTime();
    if (!Number.isFinite(proposedAtMs))
        return null;
    const deadlineMs = proposedAtMs + (PROPOSAL_RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000);
    return new Date(deadlineMs).toISOString();
}
function proposalActionNotice(proposal, currentPharmacyId, linkedNotification) {
    const isA = proposal.pharmacyAId === currentPharmacyId;
    const actionPath = `/proposals/${proposal.id}`;
    const deadlineAt = buildProposalDeadlineAt(proposal.proposedAt);
    const linkedId = linkedNotification ? `notification-${linkedNotification.id}` : null;
    const linkedCreatedAt = linkedNotification?.createdAt ?? proposal.proposedAt;
    const linkedUnread = linkedNotification ? !linkedNotification.isRead : true;
    if (proposal.status === 'proposed') {
        if (isA) {
            return {
                id: linkedId ?? `proposal-${proposal.id}-outbound`,
                type: 'outbound_request',
                title: '仮マッチングを送信済みです',
                body: `マッチング #${proposal.id} の相手薬局承認待ちです。`,
                actionPath,
                actionLabel: '詳細へ',
                createdAt: linkedCreatedAt,
                deadlineAt,
                unread: linkedNotification ? linkedUnread : false,
                priority: 3,
            };
        }
        return {
            id: linkedId ?? `proposal-${proposal.id}-inbound`,
            type: 'inbound_request',
            title: '仮マッチングが届いています',
            body: `マッチング #${proposal.id} を確認し、承認または拒否してください。`,
            actionPath,
            actionLabel: '承認/拒否を行う',
            createdAt: linkedCreatedAt,
            deadlineAt,
            unread: linkedUnread,
            priority: 1,
        };
    }
    if ((proposal.status === 'accepted_a' && !isA) || (proposal.status === 'accepted_b' && isA)) {
        return {
            id: linkedId ?? `proposal-${proposal.id}-pending-my-approval`,
            type: 'inbound_request',
            title: '相手承認済みの仮マッチングがあります',
            body: `マッチング #${proposal.id} はあなたの承認待ちです。`,
            actionPath,
            actionLabel: '承認する',
            createdAt: linkedCreatedAt,
            deadlineAt,
            unread: linkedUnread,
            priority: 1,
        };
    }
    if (proposal.status === 'confirmed') {
        return {
            id: linkedId ?? `proposal-${proposal.id}-confirmed`,
            type: 'status_update',
            title: 'マッチングが確定しました',
            body: `マッチング #${proposal.id} の受け渡し後、交換完了を実行してください。`,
            actionPath,
            actionLabel: '交換完了へ進む',
            createdAt: linkedCreatedAt,
            deadlineAt: null,
            unread: linkedUnread,
            priority: 2,
        };
    }
    return null;
}
function timestampSortValue(timestamp) {
    if (timestamp === null)
        return Number.NEGATIVE_INFINITY;
    const value = Date.parse(timestamp);
    return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}
function compareNoticeOrder(a, b) {
    if (a.priority !== b.priority)
        return a.priority - b.priority;
    const aTime = timestampSortValue(a.createdAt);
    const bTime = timestampSortValue(b.createdAt);
    if (aTime !== bTime)
        return bTime - aTime;
    return a.id.localeCompare(b.id);
}
function parseNoticeCursor(raw) {
    const cursor = (0, cursor_pagination_1.decodeCursor)(raw);
    if (!cursor)
        return null;
    if (typeof cursor.id !== 'string' || cursor.id.length === 0)
        return null;
    if (!Number.isInteger(cursor.priority) || cursor.priority < 0)
        return null;
    if (cursor.createdAt !== null && typeof cursor.createdAt !== 'string')
        return null;
    return cursor;
}
function mergeDedupSortByTimestamp(branchA, branchB, getTimestamp) {
    const deduped = new Map();
    for (const row of branchA)
        deduped.set(row.id, row);
    for (const row of branchB) {
        if (!deduped.has(row.id))
            deduped.set(row.id, row);
    }
    return [...deduped.values()].sort((left, right) => {
        const leftSort = timestampSortValue(getTimestamp(left));
        const rightSort = timestampSortValue(getTimestamp(right));
        return rightSort - leftSort || right.id - left.id;
    });
}
function resolveNotificationType(type) {
    if (type === 'new_comment')
        return 'new_comment';
    if (type === 'proposal_received' || type === 'proposal_status_changed' || type === 'request_update')
        return 'status_update';
    return null;
}
function resolveNotificationActionPath(referenceType, referenceId) {
    if (referenceType === 'match')
        return '/matching';
    if ((referenceType === 'proposal' || referenceType === 'comment') && referenceId) {
        return `/proposals/${referenceId}`;
    }
    if (referenceType === 'request')
        return '/';
    return '/';
}
function notificationToNotice(n) {
    const noticeType = resolveNotificationType(n.type);
    if (!noticeType) {
        logger_1.logger.warn('Unsupported notification type skipped', { type: n.type, id: n.id });
        return null;
    }
    return {
        id: `notification-${n.id}`,
        type: noticeType,
        title: n.title,
        body: n.message,
        actionPath: resolveNotificationActionPath(n.referenceType, n.referenceId),
        actionLabel: '確認する',
        createdAt: n.createdAt,
        deadlineAt: null,
        unread: !n.isRead,
        priority: n.isRead ? 5 : 3,
    };
}
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.get('/', async (req, res) => {
    try {
        const pharmacyId = req.user.id;
        const limit = Math.min((0, request_utils_1.parsePositiveInt)(req.query.limit) ?? NOTICE_RESULT_LIMIT, MAX_NOTICE_PAGE_LIMIT);
        const cursor = parseNoticeCursor(req.query.cursor);
        const proposalSelect = {
            id: schema_1.exchangeProposals.id,
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
            status: schema_1.exchangeProposals.status,
            proposedAt: schema_1.exchangeProposals.proposedAt,
        };
        const messageSelect = {
            id: schema_1.adminMessages.id,
            title: schema_1.adminMessages.title,
            body: schema_1.adminMessages.body,
            actionPath: schema_1.adminMessages.actionPath,
            createdAt: schema_1.adminMessages.createdAt,
        };
        // 全6クエリを完全並列実行（直列→並列で約50%高速化）
        const [proposalsA, proposalsB, messagesAll, messagesPharmacy, matchRows, notificationRows] = await Promise.all([
            database_1.db.select(proposalSelect)
                .from(schema_1.exchangeProposals)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.inArray)(schema_1.exchangeProposals.status, PROPOSAL_NOTICE_STATUSES)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeProposals.proposedAt))
                .limit(PROPOSAL_NOTICE_LIMIT),
            database_1.db.select(proposalSelect)
                .from(schema_1.exchangeProposals)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId), (0, drizzle_orm_1.inArray)(schema_1.exchangeProposals.status, PROPOSAL_NOTICE_STATUSES)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeProposals.proposedAt))
                .limit(PROPOSAL_NOTICE_LIMIT),
            database_1.db.select(messageSelect)
                .from(schema_1.adminMessages)
                .where((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'all'))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.adminMessages.createdAt), (0, drizzle_orm_1.desc)(schema_1.adminMessages.id))
                .limit(SOURCE_NOTICE_FETCH_LIMIT),
            database_1.db.select(messageSelect)
                .from(schema_1.adminMessages)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'pharmacy'), (0, drizzle_orm_1.eq)(schema_1.adminMessages.targetPharmacyId, pharmacyId)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.adminMessages.createdAt), (0, drizzle_orm_1.desc)(schema_1.adminMessages.id))
                .limit(SOURCE_NOTICE_FETCH_LIMIT),
            (async () => {
                try {
                    return await database_1.db.select({
                        id: schema_1.matchNotifications.id,
                        triggerPharmacyId: schema_1.matchNotifications.triggerPharmacyId,
                        triggerUploadType: schema_1.matchNotifications.triggerUploadType,
                        candidateCountBefore: schema_1.matchNotifications.candidateCountBefore,
                        candidateCountAfter: schema_1.matchNotifications.candidateCountAfter,
                        diffJson: schema_1.matchNotifications.diffJson,
                        isRead: schema_1.matchNotifications.isRead,
                        createdAt: schema_1.matchNotifications.createdAt,
                    })
                        .from(schema_1.matchNotifications)
                        .where((0, drizzle_orm_1.eq)(schema_1.matchNotifications.pharmacyId, pharmacyId))
                        .orderBy((0, drizzle_orm_1.desc)(schema_1.matchNotifications.createdAt), (0, drizzle_orm_1.desc)(schema_1.matchNotifications.id))
                        .limit(MATCH_NOTICE_LIMIT);
                }
                catch (err) {
                    if (!isUndefinedTableError(err)) {
                        throw err;
                    }
                    logger_1.logger.warn('match_notifications query failed (table may not exist)', {
                        error: err instanceof Error ? err.message : String(err),
                    });
                    return [];
                }
            })(),
            database_1.db.select()
                .from(schema_1.notifications)
                .where((0, drizzle_orm_1.eq)(schema_1.notifications.pharmacyId, pharmacyId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt), (0, drizzle_orm_1.desc)(schema_1.notifications.id))
                .limit(SOURCE_NOTICE_FETCH_LIMIT),
        ]);
        const proposalRows = mergeDedupSortByTimestamp(proposalsA, proposalsB, (row) => row.proposedAt)
            .slice(0, PROPOSAL_NOTICE_LIMIT);
        const messageRows = mergeDedupSortByTimestamp(messagesAll, messagesPharmacy, (row) => row.createdAt)
            .slice(0, SOURCE_NOTICE_FETCH_LIMIT);
        const latestProposalNotificationById = new Map();
        for (const row of notificationRows) {
            if (row.referenceType !== 'proposal')
                continue;
            if (!PROPOSAL_EVENT_NOTIFICATION_TYPES.has(row.type))
                continue;
            if (!row.referenceId || row.referenceId <= 0)
                continue;
            if (latestProposalNotificationById.has(row.referenceId))
                continue;
            latestProposalNotificationById.set(row.referenceId, {
                id: row.id,
                isRead: row.isRead,
                createdAt: row.createdAt,
            });
        }
        // messageReads と triggerPharmacy names を並列取得
        const messageIds = messageRows.map((message) => message.id);
        const triggerPharmacyIds = [...new Set(matchRows.map((row) => row.triggerPharmacyId))];
        const [messageReadRows, triggerPharmacyRows] = await Promise.all([
            messageIds.length > 0
                ? database_1.db.select({ messageId: schema_1.adminMessageReads.messageId })
                    .from(schema_1.adminMessageReads)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.adminMessageReads.messageId, messageIds), (0, drizzle_orm_1.eq)(schema_1.adminMessageReads.pharmacyId, pharmacyId)))
                : Promise.resolve([]),
            triggerPharmacyIds.length > 0
                ? database_1.db.select({ id: schema_1.pharmacies.id, name: schema_1.pharmacies.name })
                    .from(schema_1.pharmacies)
                    .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, triggerPharmacyIds))
                : Promise.resolve([]),
        ]);
        const readMessageIdSet = new Set(messageReadRows.map((row) => row.messageId));
        const notices = [];
        const mappedProposalReferenceIds = new Set();
        for (const proposal of proposalRows) {
            const linkedNotification = latestProposalNotificationById.get(proposal.id);
            const item = proposalActionNotice(proposal, pharmacyId, linkedNotification);
            if (item)
                notices.push(item);
            if (item && linkedNotification) {
                mappedProposalReferenceIds.add(proposal.id);
            }
        }
        for (const message of messageRows) {
            const unread = !readMessageIdSet.has(message.id);
            const actionPath = (0, path_utils_1.sanitizeInternalPath)(message.actionPath) ?? '/';
            notices.push({
                id: `message-${message.id}`,
                type: 'admin_message',
                title: `管理者: ${message.title}`,
                body: message.body,
                actionPath,
                actionLabel: actionPath === '/' ? 'ダッシュボードへ' : '内容を確認',
                createdAt: message.createdAt,
                deadlineAt: null,
                unread,
                priority: unread ? 1 : 4,
            });
        }
        const triggerPharmacyNameById = new Map(triggerPharmacyRows.map((row) => [row.id, row.name]));
        for (const row of matchRows) {
            notices.push(matchUpdateNotice(row, pharmacyId, triggerPharmacyNameById.get(row.triggerPharmacyId) ?? null));
        }
        for (const n of notificationRows) {
            if (n.referenceType === 'proposal'
                && PROPOSAL_EVENT_NOTIFICATION_TYPES.has(n.type)
                && n.referenceId
                && mappedProposalReferenceIds.has(n.referenceId)) {
                continue;
            }
            const notice = notificationToNotice(n);
            if (notice)
                notices.push(notice);
        }
        notices.sort(compareNoticeOrder);
        const startIndex = (() => {
            if (!cursor)
                return 0;
            const exactIndex = notices.findIndex((notice) => notice.id === cursor.id);
            if (exactIndex >= 0)
                return exactIndex + 1;
            const cursorTime = timestampSortValue(cursor.createdAt);
            const fallback = notices.findIndex((notice) => {
                if (notice.priority > cursor.priority)
                    return true;
                if (notice.priority < cursor.priority)
                    return false;
                const noticeTime = timestampSortValue(notice.createdAt);
                if (noticeTime < cursorTime)
                    return true;
                if (noticeTime > cursorTime)
                    return false;
                return notice.id.localeCompare(cursor.id) > 0;
            });
            return fallback >= 0 ? fallback : notices.length;
        })();
        const pagedNotices = notices.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < notices.length;
        const lastNotice = pagedNotices[pagedNotices.length - 1];
        const nextCursor = hasMore && lastNotice
            ? (0, cursor_pagination_1.encodeCursor)({
                id: lastNotice.id,
                priority: lastNotice.priority,
                createdAt: lastNotice.createdAt,
            })
            : null;
        const unreadMessages = notices.filter((item) => item.type === 'admin_message' && item.unread).length;
        const actionableRequests = notices.filter((item) => item.unread && (item.type === 'inbound_request' || item.type === 'status_update' || item.type === 'match_update')).length;
        res.json({
            notices: pagedNotices,
            summary: {
                unreadMessages,
                actionableRequests,
                total: notices.length,
            },
            pagination: {
                limit,
                hasMore,
                nextCursor,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('Notifications fetch error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '通知の取得に失敗しました' });
    }
});
router.post('/messages/:id/read', async (req, res) => {
    try {
        const id = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!id) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        const pharmacyId = req.user.id;
        const [message] = await database_1.db.select({
            id: schema_1.adminMessages.id,
            targetType: schema_1.adminMessages.targetType,
            targetPharmacyId: schema_1.adminMessages.targetPharmacyId,
        })
            .from(schema_1.adminMessages)
            .where((0, drizzle_orm_1.eq)(schema_1.adminMessages.id, id))
            .limit(1);
        if (!message) {
            res.status(404).json({ error: 'メッセージが見つかりません' });
            return;
        }
        const isTarget = message.targetType === 'all' || message.targetPharmacyId === pharmacyId;
        if (!isTarget) {
            res.status(404).json({ error: 'メッセージが見つかりません' });
            return;
        }
        await database_1.db.insert(schema_1.adminMessageReads).values({
            messageId: id,
            pharmacyId,
        }).onConflictDoNothing({
            target: [schema_1.adminMessageReads.messageId, schema_1.adminMessageReads.pharmacyId],
        });
        (0, notification_service_1.invalidateDashboardUnreadCache)(pharmacyId);
        res.json({ message: '既読にしました' });
    }
    catch (err) {
        logger_1.logger.error('Notification read error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '既読処理に失敗しました' });
    }
});
router.post('/matches/:id/read', async (req, res) => {
    try {
        const id = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!id) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        const pharmacyId = req.user.id;
        const [matchNotice] = await database_1.db.select({
            id: schema_1.matchNotifications.id,
            pharmacyId: schema_1.matchNotifications.pharmacyId,
        })
            .from(schema_1.matchNotifications)
            .where((0, drizzle_orm_1.eq)(schema_1.matchNotifications.id, id))
            .limit(1);
        if (!matchNotice) {
            res.status(404).json({ error: '通知が見つかりません' });
            return;
        }
        if (matchNotice.pharmacyId !== pharmacyId) {
            res.status(404).json({ error: '通知が見つかりません' });
            return;
        }
        await database_1.db.update(schema_1.matchNotifications)
            .set({ isRead: true })
            .where((0, drizzle_orm_1.eq)(schema_1.matchNotifications.id, id));
        (0, notification_service_1.invalidateDashboardUnreadCache)(pharmacyId);
        res.json({ message: '既読にしました' });
    }
    catch (err) {
        logger_1.logger.error('Match notification read error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '既読処理に失敗しました' });
    }
});
// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
    try {
        const pharmacyId = req.user.id;
        const unreadCount = await (0, notification_service_1.getDashboardUnreadCount)(pharmacyId);
        res.json({ unreadCount });
    }
    catch (err) {
        logger_1.logger.error('Get unread count error', { error: err.message });
        res.status(500).json({ error: '未読件数の取得に失敗しました' });
    }
});
// PATCH /api/notifications/read-all (/:id/read より先に定義すること)
const markAllReadHandler = async (req, res) => {
    try {
        const count = await (0, notification_service_1.markAllDashboardAsRead)(req.user.id);
        res.json({ message: `${count}件を既読にしました`, count });
    }
    catch (err) {
        logger_1.logger.error('Mark all as read error', { error: err.message });
        res.status(500).json({ error: '一括既読更新に失敗しました' });
    }
};
router.patch('/read-all', markAllReadHandler);
// PATCH /api/notifications/:id/read
const markReadHandler = async (req, res) => {
    try {
        const notificationId = (0, request_utils_1.parsePositiveInt)(req.params.id);
        if (!notificationId) {
            res.status(400).json({ error: '不正なIDです' });
            return;
        }
        const success = await (0, notification_service_1.markAsRead)(notificationId, req.user.id);
        if (!success) {
            res.status(404).json({ error: '通知が見つかりません' });
            return;
        }
        res.json({ message: '既読にしました' });
    }
    catch (err) {
        logger_1.logger.error('Mark as read error', { error: err.message });
        res.status(500).json({ error: '既読更新に失敗しました' });
    }
};
router.patch('/:id/read', markReadHandler);
exports.default = router;
//# sourceMappingURL=notifications.js.map