"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_STAGNANT_STOCK_DAYS = void 0;
exports.countStagnantItems = countStagnantItems;
exports.countTraceableItems = countTraceableItems;
exports.buildDeadStockDisposalPriority = buildDeadStockDisposalPriority;
exports.buildBusinessImpact = buildBusinessImpact;
exports.buildPriorityReasons = buildPriorityReasons;
exports.sortMatchCandidatesByPriority = sortMatchCandidatesByPriority;
const matching_score_service_1 = require("./matching-score-service");
const DAY_MS = 24 * 60 * 60 * 1000;
exports.DEFAULT_STAGNANT_STOCK_DAYS = 90;
function toFiniteNumber(value) {
    return Number.isFinite(value) ? Number(value) : 0;
}
function parseIsoDate(value) {
    if (!value)
        return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function countAndSumNearExpiry(items, nearExpiryDays, now) {
    const thresholdDays = Math.max(1, Math.floor(nearExpiryDays));
    const todayMs = (0, matching_score_service_1.toStartOfDay)(now).getTime();
    let count = 0;
    let valueSum = 0;
    for (const item of items) {
        const expirySource = item.expirationDateIso ?? item.expirationDate;
        const expiry = (0, matching_score_service_1.parseExpiryDate)(expirySource);
        if (!expiry)
            continue;
        const expiryDayMs = (0, matching_score_service_1.toStartOfDay)(expiry).getTime();
        const diffDays = Math.floor((expiryDayMs - todayMs) / DAY_MS);
        if (diffDays >= 0 && diffDays <= thresholdDays) {
            count += 1;
            valueSum += toFiniteNumber(item.yakkaValue);
        }
    }
    return { count, valueSum: (0, matching_score_service_1.roundTo2)(valueSum) };
}
function countStagnantItems(items, now, stagnantDays = exports.DEFAULT_STAGNANT_STOCK_DAYS) {
    const thresholdDays = Math.max(1, Math.floor(stagnantDays));
    const nowMs = now.getTime();
    let count = 0;
    for (const item of items) {
        const createdAt = parseIsoDate(item.stockCreatedAt);
        if (!createdAt)
            continue;
        const ageDays = Math.floor((nowMs - createdAt.getTime()) / DAY_MS);
        if (ageDays >= thresholdDays)
            count += 1;
    }
    return count;
}
function countTraceableItems(items) {
    let count = 0;
    for (const item of items) {
        if (item.expirationDateIso || item.expirationDate || item.lotNumber) {
            count += 1;
        }
    }
    return count;
}
function buildDeadStockDisposalPriority(candidate, nearExpiryDays, now, nearExpiryOut) {
    const stagnantA = countStagnantItems(candidate.itemsFromA, now);
    const stagnantB = countStagnantItems(candidate.itemsFromB, now);
    const nearA = countAndSumNearExpiry(candidate.itemsFromA, nearExpiryDays, now);
    const nearB = countAndSumNearExpiry(candidate.itemsFromB, nearExpiryDays, now);
    const traceableA = countTraceableItems(candidate.itemsFromA);
    const traceableB = countTraceableItems(candidate.itemsFromB);
    if (nearExpiryOut) {
        nearExpiryOut.countA = nearA.count;
        nearExpiryOut.countB = nearB.count;
        nearExpiryOut.valueSumA = nearA.valueSum;
        nearExpiryOut.valueSumB = nearB.valueSum;
    }
    return {
        mutualStagnantItems: Math.min(stagnantA, stagnantB),
        mutualNearExpiryItems: Math.min(nearA.count, nearB.count),
        mutualExchangeValue: Math.min(toFiniteNumber(candidate.totalValueA), toFiniteNumber(candidate.totalValueB)),
        mutualItemCount: Math.min(candidate.itemsFromA.length, candidate.itemsFromB.length),
        mutualTraceableItems: Math.min(traceableA, traceableB),
    };
}
function buildBusinessImpact(candidate, priority, nearExpiryStats) {
    return {
        estimatedWasteAvoidanceYen: (0, matching_score_service_1.roundTo2)(Math.min(nearExpiryStats.valueSumA, nearExpiryStats.valueSumB)),
        estimatedWorkingCapitalReleaseYen: (0, matching_score_service_1.roundTo2)(priority.mutualExchangeValue),
        estimatedMutualLiquidationItems: priority.mutualStagnantItems,
        estimatedMutualNearExpiryItems: priority.mutualNearExpiryItems,
        estimatedTraceableExchangeItems: priority.mutualTraceableItems,
    };
}
function buildPriorityReasons(priority) {
    const reasons = [
        {
            code: 'mutual_stagnant',
            label: '相互不動在庫の解消効果',
            value: priority.mutualStagnantItems,
        },
        {
            code: 'mutual_near_expiry',
            label: '期限切迫在庫の相互救済',
            value: priority.mutualNearExpiryItems,
        },
        {
            code: 'mutual_exchange_value',
            label: '相互交換金額の規模',
            value: (0, matching_score_service_1.roundTo2)(priority.mutualExchangeValue),
        },
        {
            code: 'mutual_item_count',
            label: '相互引取品目数',
            value: priority.mutualItemCount,
        },
        {
            code: 'mutual_traceability',
            label: 'トレーサブル在庫の相互引取',
            value: priority.mutualTraceableItems,
        },
    ];
    return reasons.filter((reason) => reason.value > 0).slice(0, 3);
}
function compareNumberDesc(a, b) {
    return b - a;
}
function compareNumberAsc(a, b) {
    return a - b;
}
function sortMatchCandidatesByPriority(candidates, nearExpiryDays, now) {
    return [...candidates]
        .map((candidate) => {
        const nearExpiryStats = { countA: 0, countB: 0, valueSumA: 0, valueSumB: 0 };
        const priorityBreakdown = buildDeadStockDisposalPriority(candidate, nearExpiryDays, now, nearExpiryStats);
        const businessImpact = buildBusinessImpact(candidate, priorityBreakdown, nearExpiryStats);
        const priorityReasons = buildPriorityReasons(priorityBreakdown);
        return {
            candidate: {
                ...candidate,
                priorityBreakdown,
                businessImpact,
                priorityReasons,
            },
            priority: priorityBreakdown,
        };
    })
        // Prioritize bidirectional dead-stock liquidation first, then legacy matching quality.
        .sort((a, b) => (compareNumberDesc(a.priority.mutualStagnantItems, b.priority.mutualStagnantItems)
        || compareNumberDesc(a.priority.mutualNearExpiryItems, b.priority.mutualNearExpiryItems)
        || compareNumberDesc(a.priority.mutualExchangeValue, b.priority.mutualExchangeValue)
        || compareNumberDesc(a.priority.mutualItemCount, b.priority.mutualItemCount)
        || compareNumberDesc(a.priority.mutualTraceableItems, b.priority.mutualTraceableItems)
        || compareNumberDesc(toFiniteNumber(a.candidate.score), toFiniteNumber(b.candidate.score))
        || compareNumberAsc(Number.isFinite(a.candidate.distance) ? a.candidate.distance : Number.MAX_SAFE_INTEGER, Number.isFinite(b.candidate.distance) ? b.candidate.distance : Number.MAX_SAFE_INTEGER)
        || compareNumberAsc(a.candidate.pharmacyId, b.candidate.pharmacyId)))
        .map((entry) => entry.candidate);
}
//# sourceMappingURL=matching-priority-service.js.map