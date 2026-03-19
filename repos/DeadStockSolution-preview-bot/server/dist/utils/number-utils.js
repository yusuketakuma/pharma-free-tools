"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBoundedInt = parseBoundedInt;
exports.parseBooleanFlag = parseBooleanFlag;
function parseBoundedInt(raw, fallback, min, max) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed))
        return fallback;
    const value = Math.floor(parsed);
    if (value < min || value > max)
        return fallback;
    return value;
}
function parseBooleanFlag(raw, fallback) {
    if (typeof raw !== 'string')
        return fallback;
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true')
        return true;
    if (normalized === 'false')
        return false;
    return fallback;
}
//# sourceMappingURL=number-utils.js.map