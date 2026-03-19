"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CANDIDATES = exports.VALUE_TOLERANCE = exports.MIN_EXCHANGE_VALUE = void 0;
exports.balanceValues = balanceValues;
exports.groupByPharmacy = groupByPharmacy;
const matching_score_service_1 = require("./matching-score-service");
exports.MIN_EXCHANGE_VALUE = 10000;
exports.VALUE_TOLERANCE = 10;
exports.MAX_CANDIDATES = 30;
function balanceValues(itemsA, itemsB) {
    let totalA = itemsA.reduce((sum, i) => sum + i.yakkaValue, 0);
    let totalB = itemsB.reduce((sum, i) => sum + i.yakkaValue, 0);
    if (Math.abs(totalA - totalB) <= exports.VALUE_TOLERANCE) {
        return {
            balancedA: itemsA.filter((item) => item.quantity > 0),
            balancedB: itemsB.filter((item) => item.quantity > 0),
            totalA: (0, matching_score_service_1.roundTo2)(totalA),
            totalB: (0, matching_score_service_1.roundTo2)(totalB),
        };
    }
    let balancedA = itemsA;
    let balancedB = itemsB;
    if (totalA > totalB + exports.VALUE_TOLERANCE) {
        const adjustableA = [...itemsA].sort((a, b) => (b.yakkaUnitPrice || 0) - (a.yakkaUnitPrice || 0));
        let remaining = totalA - totalB;
        for (const item of adjustableA) {
            if (remaining <= exports.VALUE_TOLERANCE)
                break;
            const maxReduction = item.yakkaValue;
            const minReductionUnit = item.yakkaUnitPrice * 0.1;
            const reduction = Math.min(remaining, Math.max(0, maxReduction - minReductionUnit));
            if (reduction <= 0)
                continue;
            const unitsToRemove = Math.floor((reduction / item.yakkaUnitPrice) * 10) / 10;
            const newQty = Math.max(0.1, item.quantity - unitsToRemove);
            const actualReduction = (item.quantity - newQty) * item.yakkaUnitPrice;
            item.quantity = newQty;
            item.yakkaValue = (0, matching_score_service_1.roundTo2)(newQty * item.yakkaUnitPrice);
            remaining -= actualReduction;
        }
        totalA = adjustableA.reduce((sum, i) => sum + i.yakkaValue, 0);
        balancedA = adjustableA;
    }
    else if (totalB > totalA + exports.VALUE_TOLERANCE) {
        const adjustableB = [...itemsB].sort((a, b) => (b.yakkaUnitPrice || 0) - (a.yakkaUnitPrice || 0));
        let remaining = totalB - totalA;
        for (const item of adjustableB) {
            if (remaining <= exports.VALUE_TOLERANCE)
                break;
            const maxReduction = item.yakkaValue;
            const minReductionUnit = item.yakkaUnitPrice * 0.1;
            const reduction = Math.min(remaining, Math.max(0, maxReduction - minReductionUnit));
            if (reduction <= 0)
                continue;
            const unitsToRemove = Math.floor((reduction / item.yakkaUnitPrice) * 10) / 10;
            const newQty = Math.max(0.1, item.quantity - unitsToRemove);
            const actualReduction = (item.quantity - newQty) * item.yakkaUnitPrice;
            item.quantity = newQty;
            item.yakkaValue = (0, matching_score_service_1.roundTo2)(newQty * item.yakkaUnitPrice);
            remaining -= actualReduction;
        }
        totalB = adjustableB.reduce((sum, i) => sum + i.yakkaValue, 0);
        balancedB = adjustableB;
    }
    return {
        balancedA: balancedA.filter((item) => item.quantity > 0),
        balancedB: balancedB.filter((item) => item.quantity > 0),
        totalA: (0, matching_score_service_1.roundTo2)(totalA),
        totalB: (0, matching_score_service_1.roundTo2)(totalB),
    };
}
function groupByPharmacy(rows) {
    const grouped = new Map();
    for (const row of rows) {
        const list = grouped.get(row.pharmacyId);
        if (list) {
            list.push(row);
        }
        else {
            grouped.set(row.pharmacyId, [row]);
        }
    }
    return grouped;
}
//# sourceMappingURL=matching-filter-service.js.map