"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.setCsrfCookie = setCsrfCookie;
exports.clearCsrfCookie = clearCsrfCookie;
exports.ensureCsrfCookie = ensureCsrfCookie;
exports.csrfProtection = csrfProtection;
const crypto_1 = __importDefault(require("crypto"));
const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';
const EXEMPT_PATH_PREFIXES = [
    '/auth/login',
    '/auth/register',
    '/auth/password-reset/request',
    '/auth/password-reset/confirm',
    '/auth/csrf-token',
];
function isSafeMethod(method) {
    return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
function isExemptPath(path) {
    return EXEMPT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}
function timingSafeCompare(a, b) {
    const aBuffer = Buffer.from(a, 'utf8');
    const bBuffer = Buffer.from(b, 'utf8');
    if (aBuffer.length !== bBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(aBuffer, bBuffer);
}
function generateCsrfToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function setCsrfCookie(res, token) {
    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    });
}
function clearCsrfCookie(res) {
    res.clearCookie(CSRF_COOKIE_NAME);
}
function ensureCsrfCookie(req, res) {
    const token = typeof req.cookies?.[CSRF_COOKIE_NAME] === 'string'
        ? req.cookies[CSRF_COOKIE_NAME]
        : '';
    if (token) {
        return token;
    }
    const created = generateCsrfToken();
    setCsrfCookie(res, created);
    return created;
}
function csrfProtection(req, res, next) {
    if (isSafeMethod(req.method) || isExemptPath(req.path)) {
        next();
        return;
    }
    // CSRF is required only for authenticated cookie sessions.
    const authToken = typeof req.cookies?.token === 'string' ? req.cookies.token : '';
    if (!authToken) {
        next();
        return;
    }
    const csrfCookie = typeof req.cookies?.[CSRF_COOKIE_NAME] === 'string'
        ? req.cookies[CSRF_COOKIE_NAME]
        : '';
    const csrfHeader = req.header(CSRF_HEADER_NAME) ?? '';
    if (!csrfCookie || !csrfHeader || !timingSafeCompare(csrfCookie, csrfHeader)) {
        res.status(403).json({ error: 'CSRFトークンが無効です。再読み込みしてください' });
        return;
    }
    next();
}
//# sourceMappingURL=csrf.js.map