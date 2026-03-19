"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResetToken = generateResetToken;
exports.createPasswordResetToken = createPasswordResetToken;
exports.resetPasswordWithToken = resetPasswordWithToken;
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const auth_service_1 = require("./auth-service");
const TOKEN_EXPIRY_MINUTES = 30;
const MAX_ACTIVE_TOKENS_PER_USER = 3;
const PASSWORD_RESET_LOCK_NAMESPACE = 24011;
async function acquirePasswordResetLock(tx, pharmacyId) {
    await tx.execute((0, drizzle_orm_1.sql) `SELECT pg_advisory_xact_lock(${PASSWORD_RESET_LOCK_NAMESPACE}, ${pharmacyId})`);
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function generateResetToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
async function createPasswordResetToken(email) {
    return database_1.db.transaction(async (tx) => {
        const [pharmacy] = await tx.select({ id: schema_1.pharmacies.id, name: schema_1.pharmacies.name, isActive: schema_1.pharmacies.isActive })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.email, email))
            .limit(1);
        if (!pharmacy || !pharmacy.isActive) {
            return null;
        }
        // Serialize token issue/reset flows per pharmacy to avoid lock-order deadlocks.
        await acquirePasswordResetLock(tx, pharmacy.id);
        const nowIso = new Date().toISOString();
        // Cleanup first so expired tokens do not count against the issuance cap.
        await tx.delete(schema_1.passwordResetTokens).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.passwordResetTokens.pharmacyId, pharmacy.id), (0, drizzle_orm_1.lt)(schema_1.passwordResetTokens.expiresAt, nowIso)));
        const activeTokenCountRows = await tx.execute((0, drizzle_orm_1.sql) `
      SELECT COUNT(*)::int AS count
      FROM password_reset_tokens
      WHERE pharmacy_id = ${pharmacy.id}
        AND used_at IS NULL
        AND expires_at > ${nowIso}
    `);
        const activeTokenCount = Number(activeTokenCountRows.rows[0]?.count ?? 0);
        if (activeTokenCount >= MAX_ACTIVE_TOKENS_PER_USER) {
            return null;
        }
        const token = generateResetToken();
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();
        await tx.insert(schema_1.passwordResetTokens).values({
            pharmacyId: pharmacy.id,
            token: tokenHash,
            expiresAt,
        });
        return { token, pharmacyName: pharmacy.name };
    });
}
async function resetPasswordWithToken(token, newPassword) {
    const now = new Date().toISOString();
    const tokenHash = hashToken(token);
    return database_1.db.transaction(async (tx) => {
        const [candidate] = await tx.select({
            pharmacyId: schema_1.passwordResetTokens.pharmacyId,
        })
            .from(schema_1.passwordResetTokens)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.passwordResetTokens.token, tokenHash), (0, drizzle_orm_1.isNull)(schema_1.passwordResetTokens.usedAt), (0, drizzle_orm_1.gt)(schema_1.passwordResetTokens.expiresAt, now)))
            .limit(1);
        if (!candidate) {
            return { success: false, pharmacyId: 0 };
        }
        // Always take advisory lock before mutating token rows to avoid lock-order deadlocks.
        await acquirePasswordResetLock(tx, candidate.pharmacyId);
        // Atomically consume the provided token to prevent race-condition reuse.
        const [consumed] = await tx.update(schema_1.passwordResetTokens)
            .set({ usedAt: now })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.passwordResetTokens.token, tokenHash), (0, drizzle_orm_1.eq)(schema_1.passwordResetTokens.pharmacyId, candidate.pharmacyId), (0, drizzle_orm_1.isNull)(schema_1.passwordResetTokens.usedAt), (0, drizzle_orm_1.gt)(schema_1.passwordResetTokens.expiresAt, now)))
            .returning({
            pharmacyId: schema_1.passwordResetTokens.pharmacyId,
        });
        if (!consumed) {
            return { success: false, pharmacyId: 0 };
        }
        // Hash password only after token is confirmed valid (avoid CPU waste on invalid tokens).
        const passwordHash = await (0, auth_service_1.hashPassword)(newPassword);
        const [targetPharmacy] = await tx.select({ isTestAccount: schema_1.pharmacies.isTestAccount })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, consumed.pharmacyId))
            .limit(1);
        // Invalidate ALL remaining unused tokens for this user.
        await tx.update(schema_1.passwordResetTokens)
            .set({ usedAt: now })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.passwordResetTokens.pharmacyId, consumed.pharmacyId), (0, drizzle_orm_1.isNull)(schema_1.passwordResetTokens.usedAt)));
        await tx.update(schema_1.pharmacies)
            .set({
            passwordHash,
            updatedAt: now,
            ...(targetPharmacy?.isTestAccount ? { testAccountPassword: newPassword } : {}),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, consumed.pharmacyId));
        return { success: true, pharmacyId: consumed.pharmacyId };
    });
}
//# sourceMappingURL=password-reset-service.js.map