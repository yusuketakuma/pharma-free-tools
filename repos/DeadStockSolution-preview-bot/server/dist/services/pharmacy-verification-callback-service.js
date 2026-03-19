"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVerificationCallback = processVerificationCallback;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const logger_1 = require("./logger");
const request_utils_1 = require("../utils/request-utils");
async function processVerificationCallback(input) {
    const { pharmacyId, requestId, approved, reason } = input;
    const now = new Date().toISOString();
    const verificationStatus = approved ? 'verified' : 'rejected';
    const useRequestIdGuard = (0, request_utils_1.isPositiveSafeInteger)(requestId);
    const updatedRows = await database_1.db.update(schema_1.pharmacies)
        .set({
        verificationStatus,
        isActive: approved,
        verifiedAt: approved ? now : null,
        rejectionReason: approved ? null : reason,
        updatedAt: now,
    })
        .where(useRequestIdGuard
        ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacies.verificationRequestId, requestId))
        : (0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId))
        .returning({ id: schema_1.pharmacies.id });
    if (updatedRows.length === 0) {
        logger_1.logger.warn('Skipped stale pharmacy verification callback', () => ({
            pharmacyId,
            requestId,
            verificationStatus,
            reason,
        }));
        return { verificationStatus, pharmacyId, applied: false };
    }
    logger_1.logger.info('Pharmacy verification callback processed', () => ({
        pharmacyId,
        verificationStatus,
        approved,
        requestId,
    }));
    return { verificationStatus, pharmacyId, applied: true };
}
//# sourceMappingURL=pharmacy-verification-callback-service.js.map