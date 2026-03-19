"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapNotificationToEvent = mapNotificationToEvent;
exports.mapMatchNotificationToEvent = mapMatchNotificationToEvent;
exports.mapProposalToEvent = mapProposalToEvent;
exports.mapCommentToEvent = mapCommentToEvent;
exports.mapFeedbackToEvent = mapFeedbackToEvent;
exports.mapUploadToEvent = mapUploadToEvent;
exports.mapAdminMessageToEvent = mapAdminMessageToEvent;
exports.mapExchangeHistoryToEvent = mapExchangeHistoryToEvent;
exports.mapExpiryRiskToEvent = mapExpiryRiskToEvent;
exports.getExpiryDateRange = getExpiryDateRange;
exports.fetchNotificationEvents = fetchNotificationEvents;
exports.fetchMatchEvents = fetchMatchEvents;
exports.fetchProposalEvents = fetchProposalEvents;
exports.fetchCommentEvents = fetchCommentEvents;
exports.fetchFeedbackEvents = fetchFeedbackEvents;
exports.fetchUploadEvents = fetchUploadEvents;
exports.fetchAdminMessageEvents = fetchAdminMessageEvents;
exports.fetchExchangeHistoryEvents = fetchExchangeHistoryEvents;
exports.fetchExpiryRiskEvents = fetchExpiryRiskEvents;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const timeline_1 = require("../types/timeline");
// ── マッピング関数（テスト可能な純粋関数として分離） ──────
function mapNotificationToEvent(row) {
    let actionPath = '/';
    if (row.referenceType === 'proposal' && row.referenceId) {
        actionPath = `/proposals/${row.referenceId}`;
    }
    else if (row.referenceType === 'match') {
        actionPath = '/matching';
    }
    return {
        id: `notification_${row.id}`,
        source: 'notification',
        type: (0, timeline_1.toTimelineEventType)(row.type),
        title: row.title,
        body: row.message,
        timestamp: row.createdAt ?? new Date().toISOString(),
        isRead: row.isRead,
        actionPath,
        metadata: {
            referenceType: row.referenceType,
            referenceId: row.referenceId,
        },
    };
}
function mapMatchNotificationToEvent(row) {
    const diff = row.candidateCountAfter - row.candidateCountBefore;
    const diffLabel = diff >= 0 ? `+${diff}` : `${diff}`;
    return {
        id: `match_${row.id}`,
        source: 'match',
        type: 'match_update',
        title: 'マッチング候補が更新されました',
        body: `候補数が ${row.candidateCountBefore}件 から ${row.candidateCountAfter}件 に変わりました（${diffLabel}）`,
        timestamp: row.createdAt ?? new Date().toISOString(),
        isRead: row.isRead,
        actionPath: '/matching',
        metadata: {
            candidateCountBefore: row.candidateCountBefore,
            candidateCountAfter: row.candidateCountAfter,
        },
    };
}
function mapProposalToEvent(row, pharmacyId) {
    const isInbound = row.pharmacyBId === pharmacyId;
    const isRequester = !isInbound;
    const roleLabel = isInbound ? '受信' : '送信済み';
    return {
        id: `proposal_${row.id}`,
        source: 'proposal',
        type: (0, timeline_1.toTimelineEventType)(`proposal_${row.status}`),
        title: `仮マッチング（${roleLabel}）: ${row.status}`,
        body: `マッチング #${row.id} のステータスは「${row.status}」です。`,
        timestamp: row.proposedAt ?? new Date().toISOString(),
        isRead: false,
        actionPath: `/proposals/${row.id}`,
        metadata: {
            proposalId: row.id,
            status: row.status,
            isInbound,
            completedAt: row.completedAt,
            // 後方互換: 既存 UI/テスト期待を崩さないため残置
            isRequester,
        },
    };
}
function mapCommentToEvent(row) {
    const bodyPreview = row.body.length > 80 ? `${row.body.slice(0, 80)}…` : row.body;
    return {
        id: `comment_${row.id}`,
        source: 'comment',
        type: 'new_comment',
        title: '提案にコメントが届きました',
        body: bodyPreview,
        timestamp: row.createdAt ?? new Date().toISOString(),
        isRead: row.readByRecipient,
        actionPath: `/proposals/${row.proposalId}`,
        metadata: {
            proposalId: row.proposalId,
        },
    };
}
function mapFeedbackToEvent(row) {
    const ratingLabel = `★${row.rating}`;
    const bodyText = row.comment
        ? `評価: ${ratingLabel} / コメント: ${row.comment}`
        : `評価: ${ratingLabel}`;
    return {
        id: `feedback_${row.id}`,
        source: 'feedback',
        type: 'exchange_feedback',
        title: '取引フィードバックが届きました',
        body: bodyText,
        timestamp: row.createdAt ?? new Date().toISOString(),
        isRead: false,
        actionPath: `/proposals/${row.proposalId}`,
        metadata: {
            proposalId: row.proposalId,
            rating: row.rating,
        },
    };
}
function mapUploadToEvent(row) {
    const typeLabel = row.uploadType === 'dead_stock' ? 'デッドストック' : '使用量';
    return {
        id: `upload_${row.id}`,
        source: 'upload',
        type: (0, timeline_1.toTimelineEventType)(`upload_${row.uploadType}`),
        title: `${typeLabel}データをアップロードしました`,
        body: `ファイル: ${row.originalFilename}`,
        timestamp: row.createdAt ?? new Date().toISOString(),
        isRead: true,
        actionPath: '/upload',
        metadata: {
            uploadType: row.uploadType,
            originalFilename: row.originalFilename,
        },
    };
}
function mapAdminMessageToEvent(row) {
    return {
        id: `admin_message_${row.id}`,
        source: 'admin_message',
        type: 'admin_message',
        title: `管理者からのお知らせ: ${row.title}`,
        body: row.body,
        timestamp: row.createdAt ?? new Date().toISOString(),
        isRead: row.isRead,
        actionPath: '/',
        metadata: {
            messageId: row.id,
        },
    };
}
function mapExchangeHistoryToEvent(row, pharmacyId) {
    const isA = row.pharmacyAId === pharmacyId;
    const roleLabel = isA ? '提案元' : '受取側';
    const totalLabel = row.totalValue ? `薬価合計: ${row.totalValue}円` : '薬価合計: -';
    return {
        id: `exchange_history_${row.id}`,
        source: 'exchange_history',
        type: 'exchange_completed',
        title: `交換が完了しました（${roleLabel}）`,
        body: `マッチング #${row.proposalId} の交換が完了しました。${totalLabel}`,
        timestamp: row.completedAt ?? new Date().toISOString(),
        isRead: true,
        actionPath: `/proposals/${row.proposalId}`,
        metadata: {
            proposalId: row.proposalId,
            totalValue: row.totalValue,
            isRequester: isA,
        },
    };
}
function mapExpiryRiskToEvent(row) {
    const expiryLabel = row.expirationDateIso ?? '不明';
    return {
        id: `expiry_risk_${row.id}`,
        source: 'expiry_risk',
        type: 'near_expiry',
        title: `期限切れ間近の在庫があります: ${row.drugName}`,
        body: `有効期限: ${expiryLabel} / 数量: ${row.quantity}`,
        timestamp: row.createdAt ?? new Date().toISOString(),
        isRead: false,
        actionPath: '/upload',
        metadata: {
            drugName: row.drugName,
            expirationDateIso: row.expirationDateIso,
            quantity: row.quantity,
        },
    };
}
/** 期限リスク判定用の日付範囲（今日〜3日後）を返す */
function getExpiryDateRange() {
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    return {
        todayStr: today.toISOString().split('T')[0],
        threeDaysLaterStr: threeDaysLater.toISOString().split('T')[0],
    };
}
// ── fetcher 関数 ────────────────────────────────────────
async function fetchNotificationEvents(db, pharmacyId, since, limit, before) {
    const conditions = [(0, drizzle_orm_1.eq)(schema_1.notifications.pharmacyId, pharmacyId)];
    if (since) {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.notifications.createdAt, since));
    }
    if (before) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.notifications.createdAt, before));
    }
    let query = db
        .select({
        id: schema_1.notifications.id,
        type: schema_1.notifications.type,
        title: schema_1.notifications.title,
        message: schema_1.notifications.message,
        referenceType: schema_1.notifications.referenceType,
        referenceId: schema_1.notifications.referenceId,
        isRead: schema_1.notifications.isRead,
        createdAt: schema_1.notifications.createdAt,
    })
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map(mapNotificationToEvent);
}
async function fetchMatchEvents(db, pharmacyId, since, limit, before) {
    const conditions = [(0, drizzle_orm_1.eq)(schema_1.matchNotifications.pharmacyId, pharmacyId)];
    if (since) {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.matchNotifications.createdAt, since));
    }
    if (before) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.matchNotifications.createdAt, before));
    }
    let query = db
        .select({
        id: schema_1.matchNotifications.id,
        candidateCountBefore: schema_1.matchNotifications.candidateCountBefore,
        candidateCountAfter: schema_1.matchNotifications.candidateCountAfter,
        isRead: schema_1.matchNotifications.isRead,
        createdAt: schema_1.matchNotifications.createdAt,
    })
        .from(schema_1.matchNotifications)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.matchNotifications.createdAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map(mapMatchNotificationToEvent);
}
async function fetchProposalEvents(db, pharmacyId, since, limit, before) {
    const conditions = [
        (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId),
        (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId),
    ];
    const ownershipCondition = (0, drizzle_orm_1.or)(...conditions);
    const whereConditions = [ownershipCondition];
    if (since) {
        whereConditions.push((0, drizzle_orm_1.gte)(schema_1.exchangeProposals.proposedAt, since));
    }
    if (before) {
        whereConditions.push((0, drizzle_orm_1.lte)(schema_1.exchangeProposals.proposedAt, before));
    }
    let query = db
        .select({
        id: schema_1.exchangeProposals.id,
        pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
        pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
        status: schema_1.exchangeProposals.status,
        proposedAt: schema_1.exchangeProposals.proposedAt,
        completedAt: schema_1.exchangeProposals.completedAt,
    })
        .from(schema_1.exchangeProposals)
        .where((0, drizzle_orm_1.and)(...whereConditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeProposals.proposedAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map((row) => mapProposalToEvent(row, pharmacyId));
}
async function fetchCommentEvents(db, pharmacyId, since, limit, before) {
    const conditions = [
        (0, drizzle_orm_1.eq)(schema_1.proposalComments.isDeleted, false),
        (0, drizzle_orm_1.ne)(schema_1.proposalComments.authorPharmacyId, pharmacyId),
        (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.pharmacyBId, pharmacyId)),
    ];
    if (since) {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.proposalComments.createdAt, since));
    }
    if (before) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.proposalComments.createdAt, before));
    }
    let query = db
        .select({
        id: schema_1.proposalComments.id,
        proposalId: schema_1.proposalComments.proposalId,
        body: schema_1.proposalComments.body,
        readByRecipient: schema_1.proposalComments.readByRecipient,
        createdAt: schema_1.proposalComments.createdAt,
    })
        .from(schema_1.proposalComments)
        .innerJoin(schema_1.exchangeProposals, (0, drizzle_orm_1.eq)(schema_1.proposalComments.proposalId, schema_1.exchangeProposals.id))
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.proposalComments.createdAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map(mapCommentToEvent);
}
async function fetchFeedbackEvents(db, pharmacyId, since, limit, before) {
    const conditions = [(0, drizzle_orm_1.eq)(schema_1.exchangeFeedback.toPharmacyId, pharmacyId)];
    if (since) {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.exchangeFeedback.createdAt, since));
    }
    if (before) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.exchangeFeedback.createdAt, before));
    }
    let query = db
        .select({
        id: schema_1.exchangeFeedback.id,
        proposalId: schema_1.exchangeFeedback.proposalId,
        rating: schema_1.exchangeFeedback.rating,
        comment: schema_1.exchangeFeedback.comment,
        createdAt: schema_1.exchangeFeedback.createdAt,
    })
        .from(schema_1.exchangeFeedback)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeFeedback.createdAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map(mapFeedbackToEvent);
}
async function fetchUploadEvents(db, pharmacyId, since, limit, before) {
    const conditions = [(0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, pharmacyId)];
    if (since) {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.uploads.createdAt, since));
    }
    if (before) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.uploads.createdAt, before));
    }
    let query = db
        .select({
        id: schema_1.uploads.id,
        uploadType: schema_1.uploads.uploadType,
        originalFilename: schema_1.uploads.originalFilename,
        createdAt: schema_1.uploads.createdAt,
    })
        .from(schema_1.uploads)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.uploads.createdAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map(mapUploadToEvent);
}
async function fetchAdminMessageEvents(db, pharmacyId, since, limit, before) {
    const sinceCondition = since ? (0, drizzle_orm_1.gte)(schema_1.adminMessages.createdAt, since) : undefined;
    const beforeCondition = before ? (0, drizzle_orm_1.lte)(schema_1.adminMessages.createdAt, before) : undefined;
    const messageSelect = {
        id: schema_1.adminMessages.id,
        title: schema_1.adminMessages.title,
        body: schema_1.adminMessages.body,
        createdAt: schema_1.adminMessages.createdAt,
    };
    // 全体向け + 自薬局向けを並列取得（limit は各サブクエリで半分ずつ割り当て）
    const subLimit = limit ? Math.ceil(limit / 2) : undefined;
    let allQuery = db
        .select(messageSelect)
        .from(schema_1.adminMessages)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'all'), ...(sinceCondition ? [sinceCondition] : []), ...(beforeCondition ? [beforeCondition] : [])))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.adminMessages.createdAt));
    if (subLimit)
        allQuery = allQuery.limit(subLimit);
    let pharmacyQuery = db
        .select(messageSelect)
        .from(schema_1.adminMessages)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adminMessages.targetType, 'pharmacy'), (0, drizzle_orm_1.eq)(schema_1.adminMessages.targetPharmacyId, pharmacyId), ...(sinceCondition ? [sinceCondition] : []), ...(beforeCondition ? [beforeCondition] : [])))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.adminMessages.createdAt));
    if (subLimit)
        pharmacyQuery = pharmacyQuery.limit(subLimit);
    const [allMessages, pharmacyMessages] = await Promise.all([allQuery, pharmacyQuery]);
    // 重複排除してマージ
    const seen = new Set();
    const merged = [];
    for (const row of [...allMessages, ...pharmacyMessages]) {
        if (!seen.has(row.id)) {
            seen.add(row.id);
            merged.push(row);
        }
    }
    if (merged.length === 0)
        return [];
    // 既読状態を adminMessageReads から取得
    const messageIds = merged.map((row) => row.id);
    const readRows = await db
        .select({ messageId: schema_1.adminMessageReads.messageId })
        .from(schema_1.adminMessageReads)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.adminMessageReads.messageId, messageIds), (0, drizzle_orm_1.eq)(schema_1.adminMessageReads.pharmacyId, pharmacyId)));
    const readMessageIdSet = new Set(readRows.map((row) => row.messageId));
    return merged.map((row) => mapAdminMessageToEvent({
        ...row,
        isRead: readMessageIdSet.has(row.id),
    }));
}
async function fetchExchangeHistoryEvents(db, pharmacyId, since, limit, before) {
    const ownershipCondition = (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyAId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.exchangeHistory.pharmacyBId, pharmacyId));
    const conditions = [ownershipCondition];
    if (since) {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.exchangeHistory.completedAt, since));
    }
    if (before) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.exchangeHistory.completedAt, before));
    }
    let query = db
        .select({
        id: schema_1.exchangeHistory.id,
        proposalId: schema_1.exchangeHistory.proposalId,
        pharmacyAId: schema_1.exchangeHistory.pharmacyAId,
        pharmacyBId: schema_1.exchangeHistory.pharmacyBId,
        totalValue: schema_1.exchangeHistory.totalValue,
        completedAt: schema_1.exchangeHistory.completedAt,
    })
        .from(schema_1.exchangeHistory)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeHistory.completedAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map((row) => mapExchangeHistoryToEvent(row, pharmacyId));
}
async function fetchExpiryRiskEvents(db, pharmacyId, limit, before) {
    // 今日から3日以内に期限が切れる在庫を取得
    const { todayStr, threeDaysLaterStr } = getExpiryDateRange();
    const conditions = [
        (0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, pharmacyId),
        (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true),
        (0, drizzle_orm_1.isNotNull)(schema_1.deadStockItems.expirationDateIso),
        (0, drizzle_orm_1.gte)(schema_1.deadStockItems.expirationDateIso, todayStr),
        (0, drizzle_orm_1.lte)(schema_1.deadStockItems.expirationDateIso, threeDaysLaterStr),
    ];
    if (before) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.deadStockItems.createdAt, before));
    }
    let query = db
        .select({
        id: schema_1.deadStockItems.id,
        drugName: schema_1.deadStockItems.drugName,
        expirationDateIso: schema_1.deadStockItems.expirationDateIso,
        quantity: schema_1.deadStockItems.quantity,
        createdAt: schema_1.deadStockItems.createdAt,
    })
        .from(schema_1.deadStockItems)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.deadStockItems.createdAt));
    if (limit)
        query = query.limit(limit);
    const rows = await query;
    return rows.map(mapExpiryRiskToEvent);
}
//# sourceMappingURL=timeline-aggregators.js.map