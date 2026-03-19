"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeInternalPath = isSafeInternalPath;
exports.sanitizeInternalPath = sanitizeInternalPath;
function isSafeInternalPath(value) {
    if (!value || value.length > 200)
        return false;
    if (!value.startsWith('/'))
        return false;
    if (value.startsWith('//'))
        return false;
    if (/\.\./.test(value))
        return false;
    if (/[^\x20-\x7E]/.test(value))
        return false;
    return true;
}
function sanitizeInternalPath(value) {
    if (!value)
        return null;
    return isSafeInternalPath(value) ? value : null;
}
//# sourceMappingURL=path-utils.js.map