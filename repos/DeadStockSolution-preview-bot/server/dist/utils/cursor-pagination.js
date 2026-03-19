"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
function encodeCursor(payload) {
    return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
}
function decodeCursor(raw) {
    if (typeof raw !== 'string' || raw.trim().length === 0)
        return null;
    try {
        const decoded = Buffer.from(raw, 'base64url').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (!parsed || typeof parsed !== 'object')
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=cursor-pagination.js.map