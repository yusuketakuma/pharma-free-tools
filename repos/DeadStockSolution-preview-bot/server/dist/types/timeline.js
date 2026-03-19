"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMELINE_EVENT_TYPES = void 0;
exports.toTimelineEventType = toTimelineEventType;
exports.TIMELINE_EVENT_TYPES = new Set([
    'match_update',
    'new_comment',
    'exchange_feedback',
    'admin_message',
    'exchange_completed',
    'near_expiry',
    'proposal_proposed',
    'proposal_accepted_a',
    'proposal_accepted_b',
    'proposal_confirmed',
    'proposal_rejected',
    'proposal_completed',
    'proposal_cancelled',
    'proposal_received',
    'proposal_status_changed',
    'upload_dead_stock',
    'upload_used_medication',
    'request_update',
]);
function toTimelineEventType(s) {
    if (exports.TIMELINE_EVENT_TYPES.has(s)) {
        return s;
    }
    console.warn(`[toTimelineEventType] Unknown event type: "${s}", falling back to 'request_update'`);
    return 'request_update';
}
//# sourceMappingURL=timeline.js.map