"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeString = normalizeString;
exports.parseNumber = parseNumber;
function normalizeString(str) {
    // NFKC normalization (full-width to half-width, etc.)
    let normalized = str.normalize('NFKC');
    // Remove whitespace
    normalized = normalized.replace(/\s+/g, '');
    // Remove parentheses and their content variations
    normalized = normalized.replace(/[（()）\[\]【】]/g, '');
    return normalized.toLowerCase();
}
function parseNumber(value) {
    if (value === null || value === undefined || value === '')
        return null;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '')
            return null;
        const maybeAsciiNumber = trimmed.replace(/,/g, '');
        const quick = Number(maybeAsciiNumber);
        if (Number.isFinite(quick))
            return quick;
    }
    const str = String(value).normalize('NFKC').replace(/,/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
}
//# sourceMappingURL=string-utils.js.map