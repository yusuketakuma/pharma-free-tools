"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = groupBy;
exports.splitIntoChunks = splitIntoChunks;
function groupBy(arr, keyFn) {
    const map = new Map();
    for (const item of arr) {
        const key = keyFn(item);
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
    }
    return map;
}
function splitIntoChunks(items, chunkSize) {
    if (items.length === 0)
        return [];
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
}
//# sourceMappingURL=array-utils.js.map