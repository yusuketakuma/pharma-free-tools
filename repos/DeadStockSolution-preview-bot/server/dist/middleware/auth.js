"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAuthUserCache = invalidateAuthUserCache;
exports.clearAuthUserCacheForTests = clearAuthUserCacheForTests;
exports.requireLogin = requireLogin;
exports.requireAdmin = requireAdmin;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_service_1 = require("../services/auth-service");
const DEFAULT_AUTH_USER_CACHE_TTL_MS = 5_000;
const MAX_AUTH_USER_CACHE_TTL_MS = 60_000;
const MAX_AUTH_USER_CACHE_ENTRIES = 5_000;
const CACHE_SWEEP_INTERVAL_WRITES = 128;
const parsedAuthUserCacheTtl = Number(process.env.AUTH_USER_CACHE_TTL_MS ?? DEFAULT_AUTH_USER_CACHE_TTL_MS);
const AUTH_USER_CACHE_TTL_MS = Number.isFinite(parsedAuthUserCacheTtl) && parsedAuthUserCacheTtl >= 0
    ? Math.min(parsedAuthUserCacheTtl, MAX_AUTH_USER_CACHE_TTL_MS)
    : DEFAULT_AUTH_USER_CACHE_TTL_MS;
const authUserCache = new Map();
let authUserCacheWrites = 0;
function isAuthUserCacheEnabled() {
    return process.env.NODE_ENV !== 'test' && AUTH_USER_CACHE_TTL_MS > 0;
}
function getCachedAuthUser(userId) {
    if (!isAuthUserCacheEnabled())
        return null;
    const cached = authUserCache.get(userId);
    if (!cached)
        return null;
    if (cached.expiresAt <= Date.now()) {
        authUserCache.delete(userId);
        return null;
    }
    return cached;
}
function sweepExpiredAuthUsers(now = Date.now()) {
    for (const [userId, cached] of authUserCache) {
        if (cached.expiresAt <= now) {
            authUserCache.delete(userId);
        }
    }
}
function enforceAuthUserCacheLimit() {
    if (authUserCache.size <= MAX_AUTH_USER_CACHE_ENTRIES)
        return;
    sweepExpiredAuthUsers();
    while (authUserCache.size > MAX_AUTH_USER_CACHE_ENTRIES) {
        const oldestUserId = authUserCache.keys().next().value;
        if (oldestUserId === undefined)
            break;
        authUserCache.delete(oldestUserId);
    }
}
function cacheAuthUser(user) {
    if (!isAuthUserCacheEnabled())
        return;
    authUserCacheWrites += 1;
    if (authUserCacheWrites % CACHE_SWEEP_INTERVAL_WRITES === 0) {
        sweepExpiredAuthUsers();
    }
    authUserCache.set(user.id, {
        ...user,
        expiresAt: Date.now() + AUTH_USER_CACHE_TTL_MS,
    });
    enforceAuthUserCacheLimit();
}
function invalidateAuthUserCache(userId) {
    authUserCache.delete(userId);
}
function clearAuthUserCacheForTests() {
    authUserCache.clear();
    authUserCacheWrites = 0;
}
function sendInactiveAccountResponse(res, verificationStatus, rejectionReason) {
    if (verificationStatus === 'pending_verification') {
        res.status(403).json({ error: '審査中です', verificationStatus: 'pending_verification' });
    }
    else if (verificationStatus === 'rejected') {
        res.status(403).json({ error: '却下されました', verificationStatus: 'rejected', rejectionReason });
    }
    else {
        res.status(401).json({ error: 'アカウントが無効です' });
    }
}
async function requireLogin(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: 'ログインが必要です' });
        return;
    }
    let payload;
    try {
        payload = (0, auth_service_1.verifyToken)(token);
    }
    catch {
        res.status(401).json({ error: 'セッションが無効です。再度ログインしてください' });
        return;
    }
    if (typeof payload.sessionVersion !== 'string' || payload.sessionVersion.length === 0) {
        res.status(401).json({ error: 'セッションが無効です。再度ログインしてください' });
        return;
    }
    try {
        const cached = getCachedAuthUser(payload.id);
        if (cached) {
            if (cached.sessionVersion !== payload.sessionVersion) {
                res.status(401).json({ error: 'セッションが無効です。再度ログインしてください' });
                return;
            }
            if (!cached.isActive) {
                sendInactiveAccountResponse(res, cached.verificationStatus, cached.rejectionReason);
                return;
            }
            req.user = {
                id: cached.id,
                email: cached.email,
                isAdmin: cached.isAdmin,
            };
            next();
            return;
        }
        const rows = await database_1.db.select({
            id: schema_1.pharmacies.id,
            email: schema_1.pharmacies.email,
            isAdmin: schema_1.pharmacies.isAdmin,
            isActive: schema_1.pharmacies.isActive,
            passwordHash: schema_1.pharmacies.passwordHash,
            verificationStatus: schema_1.pharmacies.verificationStatus,
            rejectionReason: schema_1.pharmacies.rejectionReason,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, payload.id))
            .limit(1);
        if (rows.length === 0) {
            res.status(401).json({ error: 'アカウントが無効です。再度ログインしてください' });
            return;
        }
        if (!rows[0].isActive) {
            sendInactiveAccountResponse(res, rows[0].verificationStatus, rows[0].rejectionReason);
            return;
        }
        const sessionVersion = (0, auth_service_1.deriveSessionVersion)(rows[0].passwordHash);
        if (sessionVersion !== payload.sessionVersion) {
            res.status(401).json({ error: 'セッションが無効です。再度ログインしてください' });
            return;
        }
        cacheAuthUser({
            id: rows[0].id,
            email: rows[0].email,
            isAdmin: rows[0].isAdmin ?? false,
            isActive: rows[0].isActive,
            sessionVersion,
            verificationStatus: rows[0].verificationStatus,
            rejectionReason: rows[0].rejectionReason,
        });
        req.user = {
            id: rows[0].id,
            email: rows[0].email,
            isAdmin: rows[0].isAdmin ?? false,
        };
        next();
    }
    catch {
        res.status(500).json({ error: '認証処理中にエラーが発生しました' });
    }
}
function requireAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        res.status(403).json({ error: '管理者権限が必要です' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map