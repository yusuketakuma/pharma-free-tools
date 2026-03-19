"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePositiveInt = parsePositiveInt;
exports.parsePagination = parsePagination;
exports.normalizeSearchTerm = normalizeSearchTerm;
exports.isPositiveSafeInteger = isPositiveSafeInteger;
exports.escapeLikeWildcards = escapeLikeWildcards;
function parsePositiveInt(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed))
        return null;
    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed) || parsed <= 0)
        return null;
    return parsed;
}
function parsePagination(pageValue, limitValue, options = {}) {
    const defaultPage = options.defaultPage ?? 1;
    const defaultLimit = options.defaultLimit ?? 20;
    const maxLimit = options.maxLimit ?? 100;
    const maxPage = options.maxPage ?? 10000;
    const parsedPage = parsePositiveInt(pageValue);
    const parsedLimit = parsePositiveInt(limitValue);
    const page = Math.min(parsedPage ?? defaultPage, maxPage);
    const limit = Math.min(parsedLimit ?? defaultLimit, maxLimit);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
function normalizeSearchTerm(value, maxLength = 100) {
    if (typeof value !== 'string')
        return undefined;
    const sanitized = value
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim();
    if (!sanitized)
        return undefined;
    return sanitized.slice(0, maxLength);
}
function isPositiveSafeInteger(value) {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
/** Escape LIKE wildcards for safe use in SQL LIKE patterns */
function escapeLikeWildcards(value) {
    return value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}
//# sourceMappingURL=request-utils.js.map