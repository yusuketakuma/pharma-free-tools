"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("./schema");
const auth_service_1 = require("../services/auth-service");
const logger_1 = require("../services/logger");
const ADMIN_LOGIN_ID = 'admin@admin.com';
const LEGACY_ADMIN_LOGIN_ID = 'admin';
function requireAdminSeedPassword() {
    const password = process.env.ADMIN_SEED_PASSWORD?.trim();
    if (!password) {
        logger_1.logger.error('ADMIN_SEED_PASSWORD is not set. Refusing to seed admin account without explicit password.');
        process.exit(1);
    }
    return password;
}
const ADMIN_PASSWORD = requireAdminSeedPassword();
async function findByEmail(email) {
    const [row] = await database_1.db.select({
        id: schema_1.pharmacies.id,
    })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.email, email))
        .limit(1);
    return row ?? null;
}
async function seedAdminAccount() {
    const passwordHash = await (0, auth_service_1.hashPassword)(ADMIN_PASSWORD);
    const existing = await findByEmail(ADMIN_LOGIN_ID) ?? await findByEmail(LEGACY_ADMIN_LOGIN_ID);
    if (existing) {
        await database_1.db.update(schema_1.pharmacies)
            .set({
            email: ADMIN_LOGIN_ID,
            passwordHash,
            isAdmin: true,
            isActive: true,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, existing.id));
        logger_1.logger.info(`Updated admin account: ${ADMIN_LOGIN_ID}`);
        return;
    }
    await database_1.db.insert(schema_1.pharmacies).values({
        email: ADMIN_LOGIN_ID,
        passwordHash,
        name: '管理者',
        postalCode: '1000001',
        address: '東京都千代田区千代田1-1',
        phone: '03-0000-0000',
        fax: '03-0000-0001',
        licenseNumber: 'ADMIN-LOCAL-001',
        prefecture: '東京都',
        latitude: 35.6762,
        longitude: 139.6503,
        isAdmin: true,
        isActive: true,
    });
    logger_1.logger.info(`Created admin account: ${ADMIN_LOGIN_ID}`);
}
seedAdminAccount()
    .then(() => {
    logger_1.logger.info('Done.');
    process.exit(0);
})
    .catch((err) => {
    logger_1.logger.error('Admin account seed failed', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
});
//# sourceMappingURL=seed-admin-account.js.map