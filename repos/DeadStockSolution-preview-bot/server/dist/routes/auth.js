"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_service_1 = require("../services/auth-service");
const validators_1 = require("../utils/validators");
const geocode_service_1 = require("../services/geocode-service");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const log_service_1 = require("../services/log-service");
const password_reset_service_1 = require("../services/password-reset-service");
const logger_1 = require("../services/logger");
const error_handler_1 = require("../middleware/error-handler");
const registration_screening_service_1 = require("../services/registration-screening-service");
const openclaw_service_1 = require("../services/openclaw-service");
const pharmacy_verification_service_1 = require("../services/pharmacy-verification-service");
const router = (0, express_1.Router)();
const EXPOSE_PASSWORD_RESET_TOKEN = process.env.EXPOSE_PASSWORD_RESET_TOKEN === 'true';
if (process.env.NODE_ENV !== 'test' && EXPOSE_PASSWORD_RESET_TOKEN) {
    throw new Error('EXPOSE_PASSWORD_RESET_TOKEN=true は test 環境でのみ許可されています');
}
const SHOULD_EXPOSE_PASSWORD_RESET_TOKEN = process.env.NODE_ENV === 'test' && EXPOSE_PASSWORD_RESET_TOKEN;
const registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '登録試行回数が多すぎます。しばらくしてから再試行してください' },
});
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'ログイン試行回数が多すぎます。しばらくしてから再試行してください' },
});
const AUTH_CONFIGURATION_ERROR_MESSAGE = '認証設定が未完了です。管理者に連絡してください';
const PASSWORD_RESET_MIN_RESPONSE_MS = process.env.NODE_ENV === 'test' ? 0 : 180;
const PASSWORD_RESET_RESPONSE_JITTER_MS = process.env.NODE_ENV === 'test' ? 0 : 120;
const testPharmacyPreviewLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'テスト薬局情報の取得回数が多すぎます。しばらくしてから再試行してください' },
});
function handleAuthConfigurationError(context, err, res) {
    if (!(0, auth_service_1.isJwtSecretMissingError)(err)) {
        return false;
    }
    logger_1.logger.error(`${context} configuration error`, {
        error: err.message,
    });
    res.status(503).json({ error: AUTH_CONFIGURATION_ERROR_MESSAGE });
    return true;
}
function waitMs(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function extractUniqueViolationConstraint(err) {
    if (!err || typeof err !== 'object')
        return null;
    const code = String(err.code ?? '');
    if (code !== '23505')
        return null;
    const constraint = String(err.constraint ?? '').toLowerCase();
    if (constraint)
        return constraint;
    const message = String(err.message ?? '');
    const matched = message.match(/unique constraint "([^"]+)"/i);
    return matched?.[1]?.toLowerCase() ?? '';
}
function isTestPharmacyPreviewEnabled() {
    return process.env.ENABLE_TEST_PHARMACY_PREVIEW !== 'false';
}
function extractErrorCode(err) {
    if (!err || typeof err !== 'object')
        return null;
    const code = err.code;
    if (typeof code === 'string' && code.trim().length > 0) {
        return code;
    }
    return extractErrorCode(err.cause);
}
function includesIsTestAccountToken(err) {
    if (!err || typeof err !== 'object')
        return false;
    const message = String(err.message ?? '').toLowerCase();
    if (message.includes('is_test_account') || message.includes('test_account_password')) {
        return true;
    }
    return includesIsTestAccountToken(err.cause);
}
function isMissingTestPharmacyColumnError(err) {
    return extractErrorCode(err) === '42703' || includesIsTestAccountToken(err);
}
let isTestAccountColumnAvailable = null;
let testPharmacyColumnsEnsured = false;
// テスト薬局リストのメモリキャッシュ（cold start 時の DB往復を回避）
const TEST_PHARMACY_CACHE_TTL_MS = 60_000;
let testPharmacyCache = null;
async function ensureTestPharmacyColumns() {
    if (testPharmacyColumnsEnsured) {
        return true;
    }
    try {
        await database_1.db.execute((0, drizzle_orm_1.sql) `ALTER TABLE "pharmacies" ADD COLUMN IF NOT EXISTS "is_test_account" boolean DEFAULT false NOT NULL`);
        await database_1.db.execute((0, drizzle_orm_1.sql) `ALTER TABLE "pharmacies" ADD COLUMN IF NOT EXISTS "test_account_password" text`);
        testPharmacyColumnsEnsured = true;
        return true;
    }
    catch (err) {
        logger_1.logger.error('Auto ensure test pharmacy columns failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        return false;
    }
}
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const errors = (0, validators_1.validateRegistration)(req.body);
        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }
        (0, auth_service_1.assertJwtSecretConfigured)();
        const { email, password, name, postalCode, address, phone, fax, licenseNumber, prefecture, permitLicenseNumber, permitPharmacyName, permitAddress, } = req.body;
        // Check existing email
        const existing = await database_1.db.select({ id: schema_1.pharmacies.id })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.email, email))
            .limit(1);
        if (existing.length > 0) {
            res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
            return;
        }
        // Check existing license number
        const existingLicense = await database_1.db.select({ id: schema_1.pharmacies.id })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.licenseNumber, licenseNumber))
            .limit(1);
        if (existingLicense.length > 0) {
            res.status(409).json({ error: 'この薬局開設許可番号は既に登録されています' });
            return;
        }
        const passwordHash = await (0, auth_service_1.hashPassword)(password);
        // 住所からジオコーディング（都道府県+住所で検索）
        const fullAddress = `${prefecture}${address}`;
        const coords = await (0, geocode_service_1.geocodeAddress)(fullAddress);
        if (!coords) {
            res.status(400).json({
                errors: [{ field: 'address', message: '住所から位置情報を特定できませんでした。正しい住所を入力してください' }],
            });
            return;
        }
        const screening = (0, registration_screening_service_1.evaluateRegistrationScreening)({
            pharmacyName: name,
            prefecture,
            address,
            licenseNumber,
            permitLicenseNumber,
            permitPharmacyName,
            permitAddress,
        });
        const registrationIp = (0, log_service_1.getClientIp)(req);
        const normalizedPostalCode = postalCode.replace(/[-ー－\s]/g, '');
        const registrationResult = await database_1.db.transaction(async (tx) => {
            const [review] = await tx.insert(schema_1.pharmacyRegistrationReviews).values({
                email,
                pharmacyName: name,
                postalCode: normalizedPostalCode,
                prefecture,
                address,
                phone,
                fax,
                licenseNumber,
                permitLicenseNumber,
                permitPharmacyName,
                permitAddress,
                verdict: screening.approved ? 'approved' : 'rejected',
                screeningScore: screening.screeningScore,
                screeningReasons: screening.reasons.join(' / '),
                mismatchDetailsJson: screening.mismatches.length > 0
                    ? JSON.stringify(screening.mismatches)
                    : null,
                registrationIp,
            }).returning({ id: schema_1.pharmacyRegistrationReviews.id });
            if (!screening.approved) {
                return {
                    approved: false,
                    reviewId: review.id,
                };
            }
            const [createdPharmacy] = await tx.insert(schema_1.pharmacies).values({
                email,
                passwordHash,
                name,
                postalCode: normalizedPostalCode,
                address,
                phone,
                fax,
                licenseNumber,
                prefecture,
                latitude: coords.lat,
                longitude: coords.lng,
                isActive: false,
                verificationStatus: 'pending_verification',
            }).returning({ id: schema_1.pharmacies.id });
            // Insert verification request into user_requests for OpenClaw verification
            const [verificationRequest] = await tx.insert(schema_1.userRequests).values({
                pharmacyId: createdPharmacy.id,
                requestText: JSON.stringify({
                    type: pharmacy_verification_service_1.PHARMACY_VERIFICATION_REQUEST_TYPE,
                    pharmacyName: name,
                    postalCode: normalizedPostalCode,
                    prefecture,
                    address,
                    licenseNumber,
                    instruction: '薬局機能情報提供制度APIで検索し、薬局名と開設許可番号の一致を確認してください',
                }),
            }).returning({ id: schema_1.userRequests.id });
            // Link verification request to pharmacy
            await tx.update(schema_1.pharmacies)
                .set({ verificationRequestId: verificationRequest.id })
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, createdPharmacy.id));
            await tx.update(schema_1.pharmacyRegistrationReviews)
                .set({
                createdPharmacyId: createdPharmacy.id,
                reviewedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacyRegistrationReviews.id, review.id));
            return {
                approved: true,
                reviewId: review.id,
                pharmacyId: createdPharmacy.id,
                verificationRequestId: verificationRequest.id,
            };
        });
        if (!registrationResult.approved) {
            (0, log_service_1.writeLog)('register', {
                detail: `失敗|phase=screening|reason=permit_mismatch|score=${screening.screeningScore}`,
                ipAddress: registrationIp,
            });
            res.status(403).json({
                error: '登録情報と薬局開設許可証情報が一致しないため、登録できません',
                screening: {
                    score: screening.screeningScore,
                    mismatches: screening.mismatches,
                    reviewId: registrationResult.reviewId,
                },
            });
            return;
        }
        const pharmacyId = registrationResult.pharmacyId;
        (0, log_service_1.writeLog)('register', {
            pharmacyId,
            detail: `新規登録（審査待ち）: ${name}`,
            ipAddress: registrationIp,
        });
        res.status(201).json({
            message: '登録申請を受け付けました。審査完了後にメールでお知らせします。',
            verificationStatus: 'pending_verification',
            pharmacyId,
        });
        // Fire-and-forget: OpenClaw verification handoff
        (0, openclaw_service_1.handoffToOpenClaw)({
            requestId: registrationResult.verificationRequestId,
            pharmacyId,
            requestText: JSON.stringify({
                type: pharmacy_verification_service_1.PHARMACY_VERIFICATION_REQUEST_TYPE,
                pharmacyName: name,
                postalCode: normalizedPostalCode,
                prefecture,
                address,
                licenseNumber,
            }),
        }).catch((err) => {
            logger_1.logger.error('OpenClaw verification handoff failed', () => ({
                pharmacyId,
                error: err instanceof Error ? err.message : String(err),
            }));
        });
    }
    catch (err) {
        if (handleAuthConfigurationError('Registration', err, res)) {
            return;
        }
        const uniqueConstraint = extractUniqueViolationConstraint(err);
        if (uniqueConstraint !== null) {
            if (uniqueConstraint.includes('license')) {
                res.status(409).json({ error: 'この薬局開設許可番号は既に登録されています' });
                return;
            }
            if (uniqueConstraint.includes('email')) {
                res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
                return;
            }
            res.status(409).json({ error: 'この情報は既に登録されています' });
            return;
        }
        (0, error_handler_1.handleRouteError)(err, 'Registration error', '登録に失敗しました', res);
    }
});
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const errors = (0, validators_1.validateLogin)(req.body);
        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }
        (0, auth_service_1.assertJwtSecretConfigured)();
        const { email, password } = req.body;
        const rows = await database_1.db.select()
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.email, email))
            .limit(1);
        if (rows.length === 0) {
            res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
            return;
        }
        const pharmacy = rows[0];
        if (!pharmacy.isActive) {
            res.status(403).json({ error: 'このアカウントは無効になっています' });
            return;
        }
        const valid = await (0, auth_service_1.verifyPassword)(password, pharmacy.passwordHash);
        if (!valid) {
            (0, log_service_1.writeLog)('login_failed', { detail: `ログイン失敗: ${email}`, ipAddress: (0, log_service_1.getClientIp)(req) });
            res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
            return;
        }
        const token = (0, auth_service_1.generateToken)({
            id: pharmacy.id,
            email: pharmacy.email,
            isAdmin: pharmacy.isAdmin ?? false,
            sessionVersion: (0, auth_service_1.deriveSessionVersion)(pharmacy.passwordHash),
        });
        (0, auth_1.invalidateAuthUserCache)(pharmacy.id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });
        (0, csrf_1.setCsrfCookie)(res, (0, csrf_1.generateCsrfToken)());
        const logAction = pharmacy.isAdmin ? 'admin_login' : 'login';
        (0, log_service_1.writeLog)(logAction, { pharmacyId: pharmacy.id, detail: `ログイン: ${pharmacy.name}`, ipAddress: (0, log_service_1.getClientIp)(req) });
        res.json({
            id: pharmacy.id,
            email: pharmacy.email,
            name: pharmacy.name,
            prefecture: pharmacy.prefecture,
            isAdmin: pharmacy.isAdmin,
        });
    }
    catch (err) {
        if (handleAuthConfigurationError('Login', err, res)) {
            return;
        }
        (0, error_handler_1.handleRouteError)(err, 'Login error', 'ログインに失敗しました', res);
    }
});
router.post('/password-reset/request', loginLimiter, async (req, res) => {
    try {
        const requestStartedAt = Date.now();
        const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
        if (!email) {
            res.status(400).json({ error: 'メールアドレスを入力してください' });
            return;
        }
        const emailResult = validators_1.emailSchema.safeParse(email);
        if (!emailResult.success) {
            res.status(400).json({ error: emailResult.error.issues[0].message });
            return;
        }
        const result = await (0, password_reset_service_1.createPasswordResetToken)(email);
        const targetMs = PASSWORD_RESET_MIN_RESPONSE_MS
            + (PASSWORD_RESET_RESPONSE_JITTER_MS > 0
                ? Math.floor(Math.random() * (PASSWORD_RESET_RESPONSE_JITTER_MS + 1))
                : 0);
        const elapsedMs = Date.now() - requestStartedAt;
        if (elapsedMs < targetMs) {
            await waitMs(targetMs - elapsedMs);
        }
        // Always return success to prevent email enumeration
        (0, log_service_1.writeLog)('password_reset_request', {
            detail: 'パスワードリセット要求を受理',
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({
            message: 'パスワードリセットの手続きを受け付けました',
            // Token exposure should be explicitly enabled only in secured dev/test environments.
            ...(SHOULD_EXPOSE_PASSWORD_RESET_TOKEN && result ? { token: result.token } : {}),
        });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'Password reset request error', 'パスワードリセットに失敗しました', res);
    }
});
router.post('/password-reset/confirm', loginLimiter, async (req, res) => {
    try {
        const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
        const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
        if (!token || !/^[a-f0-9]{64}$/.test(token)) {
            res.status(400).json({ error: 'リセットトークンが無効です' });
            return;
        }
        const passwordResult = validators_1.passwordSchema.safeParse(newPassword);
        if (!passwordResult.success) {
            res.status(400).json({ error: passwordResult.error.issues[0].message });
            return;
        }
        const resetResult = await (0, password_reset_service_1.resetPasswordWithToken)(token, newPassword);
        if (!resetResult.success) {
            (0, log_service_1.writeLog)('password_reset_failed', { detail: 'リセットトークン無効または期限切れ', ipAddress: (0, log_service_1.getClientIp)(req) });
            res.status(400).json({ error: 'リセットトークンが無効または期限切れです' });
            return;
        }
        (0, auth_1.invalidateAuthUserCache)(resetResult.pharmacyId);
        (0, log_service_1.writeLog)('password_reset_complete', { detail: 'パスワードリセット完了', ipAddress: (0, log_service_1.getClientIp)(req) });
        res.json({ message: 'パスワードをリセットしました。新しいパスワードでログインしてください' });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'Password reset confirm error', 'パスワードリセットに失敗しました', res);
    }
});
router.post('/logout', (req, res) => {
    let pharmacyId = null;
    const token = typeof req.cookies?.token === 'string' ? req.cookies.token : '';
    if (token) {
        try {
            const payload = (0, auth_service_1.verifyToken)(token);
            pharmacyId = payload.id;
        }
        catch {
            // ignore invalid token
        }
    }
    res.clearCookie('token');
    (0, csrf_1.clearCsrfCookie)(res);
    if (pharmacyId !== null) {
        (0, auth_1.invalidateAuthUserCache)(pharmacyId);
    }
    void (0, log_service_1.writeLog)('logout', {
        pharmacyId,
        detail: 'ログアウト',
        ipAddress: (0, log_service_1.getClientIp)(req),
    });
    res.json({ message: 'ログアウトしました' });
});
router.get('/csrf-token', (req, res) => {
    const token = (0, csrf_1.ensureCsrfCookie)(req, res);
    res.json({ csrfToken: token });
});
router.get('/me', auth_1.requireLogin, async (req, res) => {
    try {
        let rows;
        if (isTestAccountColumnAvailable === false) {
            const legacyRows = await database_1.db.select({
                id: schema_1.pharmacies.id,
                email: schema_1.pharmacies.email,
                name: schema_1.pharmacies.name,
                postalCode: schema_1.pharmacies.postalCode,
                address: schema_1.pharmacies.address,
                phone: schema_1.pharmacies.phone,
                fax: schema_1.pharmacies.fax,
                licenseNumber: schema_1.pharmacies.licenseNumber,
                prefecture: schema_1.pharmacies.prefecture,
                isAdmin: schema_1.pharmacies.isAdmin,
            })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
                .limit(1);
            rows = legacyRows.map((row) => ({
                ...row,
                isTestAccount: false,
            }));
        }
        else {
            try {
                rows = await database_1.db.select({
                    id: schema_1.pharmacies.id,
                    email: schema_1.pharmacies.email,
                    name: schema_1.pharmacies.name,
                    postalCode: schema_1.pharmacies.postalCode,
                    address: schema_1.pharmacies.address,
                    phone: schema_1.pharmacies.phone,
                    fax: schema_1.pharmacies.fax,
                    licenseNumber: schema_1.pharmacies.licenseNumber,
                    prefecture: schema_1.pharmacies.prefecture,
                    isAdmin: schema_1.pharmacies.isAdmin,
                    isTestAccount: schema_1.pharmacies.isTestAccount,
                })
                    .from(schema_1.pharmacies)
                    .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
                    .limit(1);
                isTestAccountColumnAvailable = true;
            }
            catch (err) {
                if (!isMissingTestPharmacyColumnError(err)) {
                    throw err;
                }
                isTestAccountColumnAvailable = false;
                logger_1.logger.warn('is_test_account column is not available yet; fallback to legacy /auth/me response', {
                    error: err instanceof Error ? err.message : String(err),
                });
                const legacyRows = await database_1.db.select({
                    id: schema_1.pharmacies.id,
                    email: schema_1.pharmacies.email,
                    name: schema_1.pharmacies.name,
                    postalCode: schema_1.pharmacies.postalCode,
                    address: schema_1.pharmacies.address,
                    phone: schema_1.pharmacies.phone,
                    fax: schema_1.pharmacies.fax,
                    licenseNumber: schema_1.pharmacies.licenseNumber,
                    prefecture: schema_1.pharmacies.prefecture,
                    isAdmin: schema_1.pharmacies.isAdmin,
                })
                    .from(schema_1.pharmacies)
                    .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
                    .limit(1);
                rows = legacyRows.map((row) => ({
                    ...row,
                    isTestAccount: false,
                }));
            }
        }
        if (rows.length === 0) {
            res.status(404).json({ error: 'ユーザーが見つかりません' });
            return;
        }
        res.json(rows[0]);
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'Get me error', 'ユーザー情報の取得に失敗しました', res);
    }
});
router.get('/test-pharmacies', testPharmacyPreviewLimiter, async (req, res) => {
    try {
        if (!isTestPharmacyPreviewEnabled()) {
            res.status(404).json({ error: 'テスト薬局情報は利用できません' });
            return;
        }
        const includePasswordRaw = req.query.includePassword;
        const includePassword = includePasswordRaw === '1' || includePasswordRaw === 'true';
        // キャッシュが有効ならDBアクセスをスキップ
        if (testPharmacyCache && testPharmacyCache.expiresAt > Date.now()) {
            const cached = testPharmacyCache.rows;
            if (cached.length === 0) {
                res.status(404).json({ error: 'テスト薬局がDBに登録されていません（5件登録を確認してください）' });
                return;
            }
            res.setHeader('Cache-Control', 'private, max-age=60');
            res.json({
                accounts: cached.map((row) => ({
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    prefecture: row.prefecture,
                    password: includePassword ? (row.password ?? '') : '',
                })),
            });
            return;
        }
        const rows = await (async () => {
            const getRowsFromFlag = () => database_1.db.select({
                id: schema_1.pharmacies.id,
                name: schema_1.pharmacies.name,
                email: schema_1.pharmacies.email,
                prefecture: schema_1.pharmacies.prefecture,
                password: schema_1.pharmacies.testAccountPassword,
            })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.isTestAccount, true))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.pharmacies.id));
            try {
                const currentRows = await getRowsFromFlag();
                isTestAccountColumnAvailable = true;
                return currentRows;
            }
            catch (err) {
                if (!isMissingTestPharmacyColumnError(err)) {
                    throw err;
                }
                logger_1.logger.warn('test pharmacy columns are missing; attempting auto-heal', {
                    error: err instanceof Error ? err.message : String(err),
                });
                const ensured = await ensureTestPharmacyColumns();
                if (!ensured) {
                    isTestAccountColumnAvailable = false;
                    res.status(503).json({ error: 'テスト薬局機能のDBスキーマが未適用です。マイグレーションを実行してください' });
                    return null;
                }
                const healedRows = await getRowsFromFlag();
                isTestAccountColumnAvailable = true;
                return healedRows;
            }
        })();
        if (!rows) {
            return;
        }
        // 結果をキャッシュ（テスト薬局データはほぼ変わらない）
        testPharmacyCache = { expiresAt: Date.now() + TEST_PHARMACY_CACHE_TTL_MS, rows };
        if (rows.length === 0) {
            res.status(404).json({ error: 'テスト薬局がDBに登録されていません（5件登録を確認してください）' });
            return;
        }
        res.setHeader('Cache-Control', 'private, max-age=60');
        res.json({
            accounts: rows.map((row) => ({
                id: row.id,
                name: row.name,
                email: row.email,
                prefecture: row.prefecture,
                password: includePassword ? (row.password ?? '') : '',
            })),
        });
    }
    catch (err) {
        (0, error_handler_1.handleRouteError)(err, 'Get test pharmacies error', 'テスト薬局情報の取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map