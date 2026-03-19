"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCronSecret = resolveCronSecret;
exports.isAuthorizedCron = isAuthorizedCron;
const crypto_1 = require("crypto");
function resolveCronSecret(...envKeys) {
    for (const key of envKeys) {
        const value = process.env[key]?.trim();
        if (value && value.length > 0)
            return value;
    }
    const fallback = process.env.CRON_SECRET?.trim();
    return fallback && fallback.length > 0 ? fallback : null;
}
function isAuthorizedCron(reqAuthHeader, secret) {
    const expected = `Bearer ${secret}`;
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(reqAuthHeader || '', 'utf8');
    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }
    return (0, crypto_1.timingSafeEqual)(expectedBuffer, receivedBuffer);
}
//# sourceMappingURL=internal-cron-auth.js.map