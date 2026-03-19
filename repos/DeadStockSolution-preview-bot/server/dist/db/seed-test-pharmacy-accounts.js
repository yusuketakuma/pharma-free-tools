"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("../config/database");
const schema_1 = require("./schema");
const auth_service_1 = require("../services/auth-service");
const logger_1 = require("../services/logger");
function parseSeedPayloadFromEnv() {
    const raw = process.env.TEST_PHARMACY_SEED_JSON;
    if (!raw || raw.trim().length === 0) {
        throw new Error('TEST_PHARMACY_SEED_JSON が未設定です');
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (err) {
        throw new Error(`TEST_PHARMACY_SEED_JSON のJSON解析に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.accounts)) {
        throw new Error('TEST_PHARMACY_SEED_JSON は {"accounts":[...]} 形式で指定してください');
    }
    const accounts = parsed.accounts.map((item, index) => {
        if (!item || typeof item !== 'object') {
            throw new Error(`accounts[${index}] が不正です`);
        }
        const row = item;
        const id = row.id;
        if (id !== undefined && (!Number.isInteger(id) || id <= 0)) {
            throw new Error(`accounts[${index}].id は正の整数で指定してください`);
        }
        const requiredStringKeys = [
            'name',
            'email',
            'password',
            'postalCode',
            'address',
            'phone',
            'fax',
            'licenseNumber',
            'prefecture',
        ];
        for (const key of requiredStringKeys) {
            if (typeof row[key] !== 'string' || row[key].trim().length === 0) {
                throw new Error(`accounts[${index}].${key} は空でない文字列が必要です`);
            }
        }
        if (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') {
            throw new Error(`accounts[${index}].latitude / longitude は数値が必要です`);
        }
        return {
            ...(id !== undefined ? { id: id } : {}),
            name: String(row.name).trim(),
            email: String(row.email).trim().toLowerCase(),
            password: String(row.password),
            postalCode: String(row.postalCode).replace(/[-ー－\s]/g, ''),
            address: String(row.address).trim(),
            phone: String(row.phone).trim(),
            fax: String(row.fax).trim(),
            licenseNumber: String(row.licenseNumber).trim(),
            prefecture: String(row.prefecture).trim(),
            latitude: row.latitude,
            longitude: row.longitude,
        };
    });
    if (accounts.length === 0) {
        throw new Error('accounts は1件以上必要です');
    }
    return { accounts };
}
async function seedTestPharmacyAccounts() {
    const { accounts } = parseSeedPayloadFromEnv();
    const now = new Date().toISOString();
    await database_1.db.transaction(async (tx) => {
        for (const account of accounts) {
            const passwordHash = await (0, auth_service_1.hashPassword)(account.password);
            await tx.insert(schema_1.pharmacies).values({
                ...(account.id !== undefined ? { id: account.id } : {}),
                email: account.email,
                passwordHash,
                name: account.name,
                postalCode: account.postalCode,
                address: account.address,
                phone: account.phone,
                fax: account.fax,
                licenseNumber: account.licenseNumber,
                prefecture: account.prefecture,
                latitude: account.latitude,
                longitude: account.longitude,
                isAdmin: false,
                isActive: true,
                isTestAccount: true,
                testAccountPassword: account.password,
                updatedAt: now,
            }).onConflictDoUpdate({
                target: schema_1.pharmacies.email,
                set: {
                    passwordHash,
                    name: account.name,
                    postalCode: account.postalCode,
                    address: account.address,
                    phone: account.phone,
                    fax: account.fax,
                    licenseNumber: account.licenseNumber,
                    prefecture: account.prefecture,
                    latitude: account.latitude,
                    longitude: account.longitude,
                    isAdmin: false,
                    isActive: true,
                    isTestAccount: true,
                    testAccountPassword: account.password,
                    updatedAt: now,
                },
            });
            logger_1.logger.info(`Seeded test pharmacy account: ${account.email}`);
        }
    });
}
seedTestPharmacyAccounts()
    .then(() => {
    logger_1.logger.info('Test pharmacy account seeding complete.');
    process.exit(0);
})
    .catch((err) => {
    logger_1.logger.error('Test pharmacy account seed failed', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
});
//# sourceMappingURL=seed-test-pharmacy-accounts.js.map