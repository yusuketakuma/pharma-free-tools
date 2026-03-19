"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaleBeforeIso = getStaleBeforeIso;
exports.getNextRetryIso = getNextRetryIso;
function getStaleBeforeIso(staleTimeoutMs) {
    return new Date(Date.now() - staleTimeoutMs).toISOString();
}
function getNextRetryIso(nextAttempts, maxAttempts, backoffBaseMs) {
    if (nextAttempts >= maxAttempts)
        return null;
    const backoffMs = backoffBaseMs * Math.max(1, nextAttempts);
    return new Date(Date.now() + backoffMs).toISOString();
}
//# sourceMappingURL=job-retry-utils.js.map