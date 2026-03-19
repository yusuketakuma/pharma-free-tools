"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_service_1 = require("../services/auth-service");
const auth_1 = require("../middleware/auth");
const geocode_service_1 = require("../services/geocode-service");
const pharmacy_verification_service_1 = require("../services/pharmacy-verification-service");
const csrf_1 = require("../middleware/csrf");
const log_service_1 = require("../services/log-service");
const logger_1 = require("../services/logger");
const error_handler_1 = require("../middleware/error-handler");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireLogin, async (req, res) => {
    try {
        const rows = await database_1.db.select({
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
            matchingAutoNotifyEnabled: schema_1.pharmacies.matchingAutoNotifyEnabled,
            version: schema_1.pharmacies.version,
            createdAt: schema_1.pharmacies.createdAt,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
            .limit(1);
        if (rows.length === 0) {
            res.status(404).json({ error: 'アカウントが見つかりません' });
            return;
        }
        res.json(rows[0]);
    }
    catch (err) {
        logger_1.logger.error('Get account error', {
            error: (0, error_handler_1.getErrorMessage)(err),
        });
        res.status(500).json({ error: 'アカウント情報の取得に失敗しました' });
    }
});
router.put('/', auth_1.requireLogin, async (req, res) => {
    let latestVersion = null;
    try {
        const { email, name, postalCode, address, phone, fax, prefecture, licenseNumber, currentPassword, newPassword, testAccountPassword, matchingAutoNotifyEnabled, version, } = req.body;
        // version バリデーション
        if (version === undefined || version === null || typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 2_147_483_647) {
            res.status(400).json({ error: 'バージョン情報が不正です' });
            return;
        }
        const accountRows = await database_1.db.select({
            id: schema_1.pharmacies.id,
            email: schema_1.pharmacies.email,
            name: schema_1.pharmacies.name,
            postalCode: schema_1.pharmacies.postalCode,
            address: schema_1.pharmacies.address,
            phone: schema_1.pharmacies.phone,
            fax: schema_1.pharmacies.fax,
            licenseNumber: schema_1.pharmacies.licenseNumber,
            prefecture: schema_1.pharmacies.prefecture,
            isTestAccount: schema_1.pharmacies.isTestAccount,
            testAccountPassword: schema_1.pharmacies.testAccountPassword,
            verificationRequestId: schema_1.pharmacies.verificationRequestId,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
            .limit(1);
        if (accountRows.length === 0) {
            res.status(404).json({ error: 'アカウントが見つかりません' });
            return;
        }
        const currentAccount = accountRows[0];
        const updates = {};
        if (email !== undefined) {
            if (typeof email !== 'string') {
                res.status(400).json({ error: 'メールアドレスが不正です' });
                return;
            }
            const normalizedEmail = email.trim().toLowerCase();
            const parsedEmail = validators_1.emailSchema.safeParse(normalizedEmail);
            if (!parsedEmail.success) {
                res.status(400).json({ error: parsedEmail.error.issues[0]?.message ?? 'メールアドレスが不正です' });
                return;
            }
            updates.email = normalizedEmail;
        }
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
                res.status(400).json({ error: '薬局名は1〜100文字で入力してください' });
                return;
            }
            updates.name = name.trim();
        }
        if (postalCode !== undefined) {
            if (typeof postalCode !== 'string') {
                res.status(400).json({ error: '郵便番号が不正です' });
                return;
            }
            const normalized = postalCode.replace(/[-ー－\s]/g, '');
            if (!/^\d{7}$/.test(normalized)) {
                res.status(400).json({ error: '郵便番号は7桁の数字で入力してください' });
                return;
            }
            updates.postalCode = normalized;
        }
        if (address !== undefined) {
            if (typeof address !== 'string' || address.trim().length === 0 || address.trim().length > 255) {
                res.status(400).json({ error: '住所は1〜255文字で入力してください' });
                return;
            }
            updates.address = address.trim();
        }
        // 住所または都道府県が変更された場合、再ジオコーディング
        if (address !== undefined || prefecture !== undefined) {
            const newPrefecture = updates.prefecture ?? currentAccount.prefecture;
            const newAddress = updates.address ?? currentAccount.address;
            const fullAddress = `${newPrefecture}${newAddress}`;
            const coords = await (0, geocode_service_1.geocodeAddress)(fullAddress);
            if (!coords) {
                res.status(400).json({ error: '住所から位置情報を特定できませんでした。正しい住所を入力してください' });
                return;
            }
            updates.latitude = coords.lat;
            updates.longitude = coords.lng;
        }
        if (phone !== undefined) {
            if (typeof phone !== 'string' || phone.trim().length === 0 || phone.trim().length > 30) {
                res.status(400).json({ error: '電話番号が不正です' });
                return;
            }
            updates.phone = phone.trim();
        }
        if (fax !== undefined) {
            if (typeof fax !== 'string' || fax.trim().length === 0 || fax.trim().length > 30) {
                res.status(400).json({ error: 'FAX番号が不正です' });
                return;
            }
            updates.fax = fax.trim();
        }
        if (prefecture !== undefined) {
            if (typeof prefecture !== 'string' || prefecture.trim().length === 0 || prefecture.trim().length > 10) {
                res.status(400).json({ error: '都道府県が不正です' });
                return;
            }
            updates.prefecture = prefecture.trim();
        }
        if (licenseNumber !== undefined) {
            if (typeof licenseNumber !== 'string' || licenseNumber.trim().length === 0 || licenseNumber.trim().length > 50) {
                res.status(400).json({ error: '薬局開設許可番号が不正です' });
                return;
            }
            updates.licenseNumber = licenseNumber.trim();
        }
        if (testAccountPassword !== undefined) {
            if (!currentAccount.isTestAccount) {
                res.status(400).json({ error: 'テストアカウントではないため表示用パスワードは設定できません' });
                return;
            }
            if (typeof testAccountPassword !== 'string') {
                res.status(400).json({ error: 'テストアカウントの表示用パスワードが不正です' });
                return;
            }
            const normalizedTestAccountPassword = testAccountPassword.trim();
            if (normalizedTestAccountPassword.length === 0 || normalizedTestAccountPassword.length > 100) {
                res.status(400).json({ error: 'テストアカウントの表示用パスワードは1〜100文字で入力してください' });
                return;
            }
            updates.testAccountPassword = normalizedTestAccountPassword;
        }
        if (matchingAutoNotifyEnabled !== undefined) {
            if (typeof matchingAutoNotifyEnabled !== 'boolean') {
                res.status(400).json({ error: '通知設定の値が不正です' });
                return;
            }
            updates.matchingAutoNotifyEnabled = matchingAutoNotifyEnabled;
        }
        if (updates.email !== undefined) {
            const existingEmailRows = await database_1.db.select({ id: schema_1.pharmacies.id })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.email, updates.email))
                .limit(1);
            if (existingEmailRows.length > 0 && existingEmailRows[0].id !== req.user.id) {
                res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
                return;
            }
        }
        if (updates.licenseNumber !== undefined) {
            const existingLicenseRows = await database_1.db.select({ id: schema_1.pharmacies.id })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.licenseNumber, updates.licenseNumber))
                .limit(1);
            if (existingLicenseRows.length > 0 && existingLicenseRows[0].id !== req.user.id) {
                res.status(409).json({ error: 'この薬局開設許可番号は既に登録されています' });
                return;
            }
        }
        if (newPassword !== undefined && newPassword !== '') {
            if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 100) {
                res.status(400).json({ error: '新しいパスワードは8〜100文字で入力してください' });
                return;
            }
            if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
                res.status(400).json({ error: '現在のパスワードを入力してください' });
                return;
            }
            const rows = await database_1.db.select({ passwordHash: schema_1.pharmacies.passwordHash })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
                .limit(1);
            if (rows.length === 0) {
                res.status(404).json({ error: 'アカウントが見つかりません' });
                return;
            }
            const valid = await (0, auth_service_1.verifyPassword)(currentPassword, rows[0].passwordHash);
            if (!valid) {
                res.status(400).json({ error: '現在のパスワードが正しくありません' });
                return;
            }
            updates.passwordHash = await (0, auth_service_1.hashPassword)(newPassword);
            if (currentAccount.isTestAccount) {
                updates.testAccountPassword = newPassword;
            }
        }
        if (currentAccount.isTestAccount) {
            const nextTestAccountPassword = updates.testAccountPassword !== undefined
                ? updates.testAccountPassword
                : currentAccount.testAccountPassword;
            if (typeof nextTestAccountPassword !== 'string' || nextTestAccountPassword.trim().length === 0) {
                res.status(400).json({ error: 'テストアカウントには表示用パスワードの設定が必要です' });
                return;
            }
        }
        const changedReverificationFields = (0, pharmacy_verification_service_1.detectChangedReverificationFields)(currentAccount, updates);
        const hasReverificationField = changedReverificationFields.length > 0;
        updates.updatedAt = new Date().toISOString();
        // version をインクリメント
        updates.version = (0, drizzle_orm_1.sql) `${schema_1.pharmacies.version} + 1`;
        // 楽観的ロック: id と version の両方が一致する場合のみ更新
        const updateResult = await database_1.db.update(schema_1.pharmacies)
            .set(updates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id), (0, drizzle_orm_1.eq)(schema_1.pharmacies.version, version)))
            .returning({
            id: schema_1.pharmacies.id,
            email: schema_1.pharmacies.email,
            isAdmin: schema_1.pharmacies.isAdmin,
            isActive: schema_1.pharmacies.isActive,
            passwordHash: schema_1.pharmacies.passwordHash,
            version: schema_1.pharmacies.version,
        });
        // 更新行数 0 = 楽観的ロック競合
        if (updateResult.length === 0) {
            // 最新データを取得して 409 レスポンスに含める
            const latestRows = await database_1.db.select({
                id: schema_1.pharmacies.id,
                email: schema_1.pharmacies.email,
                name: schema_1.pharmacies.name,
                postalCode: schema_1.pharmacies.postalCode,
                address: schema_1.pharmacies.address,
                phone: schema_1.pharmacies.phone,
                fax: schema_1.pharmacies.fax,
                licenseNumber: schema_1.pharmacies.licenseNumber,
                prefecture: schema_1.pharmacies.prefecture,
                matchingAutoNotifyEnabled: schema_1.pharmacies.matchingAutoNotifyEnabled,
                version: schema_1.pharmacies.version,
            })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
                .limit(1);
            res.status(409).json({
                error: '他のデバイスまたはタブで更新されています。最新データを確認してください',
                latestData: latestRows[0] ?? null,
            });
            return;
        }
        const updatedPharmacy = updateResult[0];
        latestVersion = updatedPharmacy?.version ?? null;
        (0, auth_1.invalidateAuthUserCache)(req.user.id);
        if (!updatedPharmacy || !updatedPharmacy.isActive) {
            res.clearCookie('token');
            res.status(401).json({ error: 'アカウントが無効です。再度ログインしてください' });
            return;
        }
        // Regenerate token from current DB state
        const token = (0, auth_service_1.generateToken)({
            id: updatedPharmacy.id,
            email: updatedPharmacy.email,
            isAdmin: updatedPharmacy.isAdmin ?? false,
            sessionVersion: (0, auth_service_1.deriveSessionVersion)(updatedPharmacy.passwordHash),
        });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });
        // 再認証トリガー: 対象フィールドが実際に変更された場合のみ
        if (hasReverificationField) {
            await (0, pharmacy_verification_service_1.triggerReverification)(req.user.id, changedReverificationFields, {
                currentVerificationRequestId: currentAccount.verificationRequestId,
            });
        }
        void (0, log_service_1.writeLog)('account_update', {
            pharmacyId: req.user.id,
            detail: hasReverificationField ? 'アカウント情報を更新（再認証トリガー）' : 'アカウント情報を更新',
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({
            message: hasReverificationField
                ? 'アカウント情報を更新しました。プロフィール変更のため再審査を行います。'
                : 'アカウント情報を更新しました',
            version: updatedPharmacy.version,
            ...(hasReverificationField ? { verificationStatus: 'pending_verification' } : {}),
        });
    }
    catch (err) {
        if (err instanceof pharmacy_verification_service_1.ReverificationTriggerError) {
            (0, pharmacy_verification_service_1.sendReverificationTriggerErrorResponse)(res, 'アカウント情報は更新されましたが、再審査依頼の登録に失敗しました。時間をおいて再試行してください。', latestVersion);
            return;
        }
        logger_1.logger.error('Update account error', {
            error: (0, error_handler_1.getErrorMessage)(err),
        });
        res.status(500).json({ error: 'アカウント更新に失敗しました' });
    }
});
router.delete('/', auth_1.requireLogin, async (req, res) => {
    try {
        const currentPassword = typeof req.body?.currentPassword === 'string'
            ? req.body.currentPassword
            : '';
        if (!currentPassword) {
            res.status(400).json({ error: '退会には現在のパスワードが必要です' });
            return;
        }
        const rows = await database_1.db.select({ passwordHash: schema_1.pharmacies.passwordHash })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id))
            .limit(1);
        if (rows.length === 0) {
            res.status(404).json({ error: 'アカウントが見つかりません' });
            return;
        }
        const valid = await (0, auth_service_1.verifyPassword)(currentPassword, rows[0].passwordHash);
        if (!valid) {
            res.status(400).json({ error: '現在のパスワードが正しくありません' });
            return;
        }
        await database_1.db.update(schema_1.pharmacies)
            .set({ isActive: false, updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, req.user.id));
        (0, auth_1.invalidateAuthUserCache)(req.user.id);
        res.clearCookie('token');
        (0, csrf_1.clearCsrfCookie)(res);
        void (0, log_service_1.writeLog)('account_deactivate', {
            pharmacyId: req.user.id,
            detail: 'アカウントを無効化',
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message: 'アカウントを無効化しました' });
    }
    catch (err) {
        logger_1.logger.error('Delete account error', {
            error: (0, error_handler_1.getErrorMessage)(err),
        });
        res.status(500).json({ error: 'アカウント削除に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=account.js.map