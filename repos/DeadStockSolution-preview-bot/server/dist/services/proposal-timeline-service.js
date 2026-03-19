"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProposalTimelineActionRows = fetchProposalTimelineActionRows;
exports.buildProposalTimeline = buildProposalTimeline;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const PROPOSAL_TIMELINE_ACTIONS = [
    'proposal_accept',
    'proposal_reject',
    'proposal_complete',
    'proposal_create',
];
function toTimelineLabel(action) {
    if (action === 'proposal_accept')
        return '承認';
    if (action === 'proposal_reject')
        return '拒否';
    if (action === 'proposal_complete')
        return '交換完了';
    return 'ステータス更新';
}
function resolveNextStatus(action, detail) {
    if (action === 'proposal_accept') {
        return detail?.match(/status=([^|]+)/)?.[1] ?? 'accepted';
    }
    if (action === 'proposal_reject') {
        return 'rejected';
    }
    if (action === 'proposal_complete') {
        return 'completed';
    }
    return null;
}
async function fetchProposalTimelineActionRows(proposalId) {
    return database_1.db.select({
        action: schema_1.activityLogs.action,
        detail: schema_1.activityLogs.detail,
        createdAt: schema_1.activityLogs.createdAt,
        actorPharmacyId: schema_1.activityLogs.pharmacyId,
        actorName: schema_1.pharmacies.name,
    })
        .from(schema_1.activityLogs)
        .leftJoin(schema_1.pharmacies, (0, drizzle_orm_1.eq)(schema_1.activityLogs.pharmacyId, schema_1.pharmacies.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.activityLogs.action, PROPOSAL_TIMELINE_ACTIONS), (0, drizzle_orm_1.sql) `${schema_1.activityLogs.detail} LIKE ${`proposalId=${proposalId}|%`}`))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.activityLogs.createdAt), (0, drizzle_orm_1.asc)(schema_1.activityLogs.id));
}
function buildProposalTimeline({ proposedAt, proposalCreatorPharmacyId, proposalCreatorName, actionRows, includeStatusTransitions = false, }) {
    let previousStatus = 'proposed';
    const createdEvent = {
        action: 'proposal_created',
        label: '仮マッチング作成',
        at: proposedAt,
        actorPharmacyId: proposalCreatorPharmacyId,
        actorName: proposalCreatorName ?? '提案元薬局',
    };
    if (includeStatusTransitions) {
        createdEvent.statusFrom = null;
        createdEvent.statusTo = 'proposed';
    }
    return [
        createdEvent,
        ...actionRows.map((row) => {
            const nextStatus = resolveNextStatus(row.action, row.detail);
            const event = {
                action: row.action,
                label: toTimelineLabel(row.action),
                at: row.createdAt,
                actorPharmacyId: row.actorPharmacyId,
                actorName: row.actorName ?? '不明',
            };
            if (includeStatusTransitions) {
                event.statusFrom = nextStatus ? previousStatus : null;
                event.statusTo = nextStatus;
            }
            if (nextStatus) {
                previousStatus = nextStatus;
            }
            return event;
        }),
    ];
}
//# sourceMappingURL=proposal-timeline-service.js.map