"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExcelBuffer = parseExcelBuffer;
exports.getPreviewRows = getPreviewRows;
const node_1 = __importDefault(require("read-excel-file/node"));
const crypto_1 = __importDefault(require("crypto"));
const MAX_UPLOAD_ROWS = 100000;
const MAX_UPLOAD_COLUMNS = 200;
const MAX_UPLOAD_CELLS = 3_000_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 6;
const MAX_CACHE_TOTAL_BYTES = 32 * 1024 * 1024;
const MAX_CACHEABLE_BUFFER_BYTES = 5 * 1024 * 1024;
const parsedExcelCache = new Map();
function buildCacheKey(buffer) {
    return crypto_1.default.createHash('sha256').update(buffer).digest('hex');
}
function pruneExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of parsedExcelCache.entries()) {
        if (now - entry.createdAt > CACHE_TTL_MS) {
            parsedExcelCache.delete(key);
        }
    }
}
function enforceCacheLimit() {
    if (parsedExcelCache.size <= MAX_CACHE_ENTRIES) {
        const totalSize = [...parsedExcelCache.values()].reduce((sum, entry) => sum + entry.sizeBytes, 0);
        if (totalSize <= MAX_CACHE_TOTAL_BYTES) {
            return;
        }
    }
    const entries = [...parsedExcelCache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    let currentTotal = entries.reduce((sum, [, entry]) => sum + entry.sizeBytes, 0);
    for (const [key, entry] of entries) {
        const shouldTrimByEntries = parsedExcelCache.size > MAX_CACHE_ENTRIES;
        const shouldTrimByTotalSize = currentTotal > MAX_CACHE_TOTAL_BYTES;
        if (!shouldTrimByEntries && !shouldTrimByTotalSize) {
            break;
        }
        parsedExcelCache.delete(key);
        currentTotal -= entry.sizeBytes;
    }
}
function cacheParsedRows(cacheKey, rows, sizeBytes) {
    parsedExcelCache.set(cacheKey, {
        rows,
        createdAt: Date.now(),
        sizeBytes,
    });
    enforceCacheLimit();
}
function normalizeCellValue(value) {
    if (value === null || value === undefined)
        return '';
    if (value instanceof Date)
        return value.toISOString();
    return value;
}
async function parseExcelBuffer(buffer) {
    pruneExpiredCache();
    const isCacheableBuffer = buffer.length <= MAX_CACHEABLE_BUFFER_BYTES;
    const cacheKey = isCacheableBuffer ? buildCacheKey(buffer) : null;
    if (isCacheableBuffer) {
        const cached = parsedExcelCache.get(cacheKey);
        if (cached) {
            return cached.rows;
        }
    }
    const rows = await (0, node_1.default)(buffer);
    if (rows.length > MAX_UPLOAD_ROWS) {
        throw new Error(`行数が上限(${MAX_UPLOAD_ROWS})を超えています`);
    }
    let totalCells = 0;
    const normalized = rows.map((row) => {
        if (row.length > MAX_UPLOAD_COLUMNS) {
            throw new Error(`列数が上限(${MAX_UPLOAD_COLUMNS})を超えています`);
        }
        totalCells += row.length;
        if (totalCells > MAX_UPLOAD_CELLS) {
            throw new Error(`セル数が上限(${MAX_UPLOAD_CELLS})を超えています`);
        }
        return row.map((cell) => normalizeCellValue(cell));
    });
    if (isCacheableBuffer) {
        cacheParsedRows(cacheKey, normalized, buffer.length);
    }
    return normalized;
}
function getPreviewRows(allRows, headerRowIndex, count = 5) {
    const start = headerRowIndex + 1;
    return allRows.slice(start, start + count);
}
//# sourceMappingURL=upload-service.js.map