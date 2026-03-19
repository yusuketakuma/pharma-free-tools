"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTrustProxySetting = resolveTrustProxySetting;
function resolveTrustProxySetting(env = process.env) {
    const trustProxyRaw = env.TRUST_PROXY?.trim();
    if (trustProxyRaw === 'true') {
        return 1;
    }
    if (trustProxyRaw === 'false') {
        return false;
    }
    if (trustProxyRaw && /^\d+$/.test(trustProxyRaw)) {
        return Number(trustProxyRaw);
    }
    const runningOnVercel = (env.VERCEL ?? '').trim() === '1' || (env.VERCEL_ENV ?? '').trim().length > 0;
    return runningOnVercel ? 1 : false;
}
//# sourceMappingURL=trust-proxy.js.map