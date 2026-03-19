"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET_WEAK_ERROR_MESSAGE = exports.JWT_SECRET_MISSING_ERROR_MESSAGE = void 0;
exports.assertJwtSecretConfigured = assertJwtSecretConfigured;
exports.isJwtSecretMissingError = isJwtSecretMissingError;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.deriveSessionVersion = deriveSessionVersion;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SALT_ROUNDS = 10;
exports.JWT_SECRET_MISSING_ERROR_MESSAGE = 'JWT_SECRET environment variable is not set';
exports.JWT_SECRET_WEAK_ERROR_MESSAGE = 'JWT_SECRET is too weak';
const JWT_SECRET_MIN_LENGTH = 32;
const WEAK_JWT_SECRET_VALUES = new Set([
    'your-jwt-secret-change-this',
    'test-secret-only',
    'change-this',
    'changeme',
    'secret',
]);
function isWeakJwtSecret(secret) {
    if (secret.length < JWT_SECRET_MIN_LENGTH)
        return true;
    return WEAK_JWT_SECRET_VALUES.has(secret.toLowerCase());
}
function getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (secret) {
        if (process.env.NODE_ENV !== 'test' && isWeakJwtSecret(secret)) {
            throw new Error(exports.JWT_SECRET_WEAK_ERROR_MESSAGE);
        }
        return secret;
    }
    if (process.env.NODE_ENV === 'test') {
        return 'test-secret-only';
    }
    throw new Error(exports.JWT_SECRET_MISSING_ERROR_MESSAGE);
}
function assertJwtSecretConfigured() {
    void getJwtSecret();
}
function isJwtSecretMissingError(err) {
    return err instanceof Error
        && (err.message === exports.JWT_SECRET_MISSING_ERROR_MESSAGE || err.message === exports.JWT_SECRET_WEAK_ERROR_MESSAGE);
}
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function deriveSessionVersion(passwordHash) {
    return crypto_1.default
        .createHmac('sha256', getJwtSecret())
        .update(passwordHash)
        .digest('hex')
        .slice(0, 32);
}
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, getJwtSecret());
}
//# sourceMappingURL=auth-service.js.map