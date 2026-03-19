"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeString = normalizeString;
exports.normalizeNullableNumber = normalizeNullableNumber;
exports.normalizeDate = normalizeDate;
exports.deadStockKey = deadStockKey;
exports.usedMedicationKey = usedMedicationKey;
exports.equalNullableNumber = equalNullableNumber;
exports.dedupeIncomingByKey = dedupeIncomingByKey;
exports.buildExistingByKey = buildExistingByKey;
function normalizeString(value) {
    return (value ?? '').trim();
}
function normalizeNullableNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value))
        return null;
    return Math.round(Number(value) * 1000) / 1000;
}
function normalizeDate(value) {
    if (!value)
        return null;
    const normalized = value.replace(/\//g, '-').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized))
        return null;
    return normalized;
}
function deadStockKey(item) {
    return [
        normalizeString(item.drugCode),
        normalizeString(item.drugName),
        normalizeString(item.unit),
        normalizeString(item.expirationDate),
        normalizeString(item.lotNumber),
    ].join('|');
}
function usedMedicationKey(item) {
    return [
        normalizeString(item.drugCode),
        normalizeString(item.drugName),
        normalizeString(item.unit),
    ].join('|');
}
function equalNullableNumber(a, b) {
    const left = a === null ? null : Number(a);
    const right = b === null ? null : Number(b);
    if (left === null || right === null)
        return left === right;
    return Math.abs(left - right) < 0.0001;
}
function dedupeIncomingByKey(incoming, keyFn) {
    const deduped = new Map();
    for (const item of incoming) {
        deduped.set(keyFn(item), item);
    }
    return [...deduped.values()];
}
function buildExistingByKey(existing, keyFn) {
    const existingByKey = new Map();
    for (const row of existing) {
        const key = keyFn(row);
        if (!existingByKey.has(key))
            existingByKey.set(key, row);
    }
    return existingByKey;
}
//# sourceMappingURL=upload-diff-utils.js.map