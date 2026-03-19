"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProposalPriority = getProposalPriority;
exports.sortByPriority = sortByPriority;
const RESPONSE_DEADLINE_HOURS = 72;
function to2(value) {
    return Math.round(value * 100) / 100;
}
function buildDeadlineAt(proposedAt) {
    if (!proposedAt)
        return null;
    const ts = new Date(proposedAt).getTime();
    if (!Number.isFinite(ts))
        return null;
    return new Date(ts + (RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000)).toISOString();
}
function isInboundWaiting(input, viewerPharmacyId) {
    if (input.status === 'proposed')
        return input.pharmacyBId === viewerPharmacyId;
    if (input.status === 'accepted_a')
        return input.pharmacyBId === viewerPharmacyId;
    if (input.status === 'accepted_b')
        return input.pharmacyAId === viewerPharmacyId;
    return false;
}
function getProposalPriority(input, viewerPharmacyId) {
    const reasons = [];
    let score = 0;
    const inboundWaiting = isInboundWaiting(input, viewerPharmacyId);
    const outbound = input.pharmacyAId === viewerPharmacyId;
    const deadlineAt = buildDeadlineAt(input.proposedAt);
    if (input.status === 'confirmed') {
        score += 70;
        reasons.push('確定済み・交換完了待ち');
    }
    else if (inboundWaiting) {
        score += 85;
        reasons.push('あなたの承認待ち');
    }
    else if (input.status === 'proposed' && outbound) {
        score += 45;
        reasons.push('相手薬局の承認待ち');
    }
    else if (input.status === 'accepted_a' || input.status === 'accepted_b') {
        score += 55;
        reasons.push('片側承認済み');
    }
    else if (input.status === 'completed') {
        score += 10;
        reasons.push('完了済み');
    }
    else if (input.status === 'rejected' || input.status === 'cancelled') {
        score += 5;
        reasons.push('終了済み');
    }
    if (deadlineAt && inboundWaiting) {
        const deadlineMs = new Date(deadlineAt).getTime();
        const remaining = deadlineMs - Date.now();
        if (remaining <= 0) {
            score += 20;
            reasons.push('承認期限を超過');
        }
        else if (remaining <= 24 * 60 * 60 * 1000) {
            score += 12;
            reasons.push('承認期限が24時間以内');
        }
        else if (remaining <= 48 * 60 * 60 * 1000) {
            score += 6;
            reasons.push('承認期限が近い');
        }
    }
    return {
        priorityScore: to2(Math.max(0, Math.min(100, score))),
        priorityReasons: reasons.length > 0 ? reasons : ['通常優先度'],
        deadlineAt,
    };
}
function sortByPriority(rows) {
    return [...rows].sort((a, b) => {
        if (a.priorityScore !== b.priorityScore)
            return b.priorityScore - a.priorityScore;
        const aDeadline = a.deadlineAt ? new Date(a.deadlineAt).getTime() : Number.POSITIVE_INFINITY;
        const bDeadline = b.deadlineAt ? new Date(b.deadlineAt).getTime() : Number.POSITIVE_INFINITY;
        if (aDeadline !== bDeadline)
            return aDeadline - bDeadline;
        const aTs = a.proposedAt ? new Date(a.proposedAt).getTime() : 0;
        const bTs = b.proposedAt ? new Date(b.proposedAt).getTime() : 0;
        return bTs - aTs || b.id - a.id;
    });
}
//# sourceMappingURL=proposal-priority-service.js.map