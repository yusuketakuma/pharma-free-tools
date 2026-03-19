"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReverificationTriggerError = exports.PHARMACY_REVERIFICATION_REQUEST_TYPE = exports.PHARMACY_VERIFICATION_REQUEST_TYPE = void 0;
exports.isVerificationRequestType = isVerificationRequestType;
exports.isVerified = isVerified;
exports.isPendingVerification = isPendingVerification;
exports.canLogin = canLogin;
exports.detectChangedReverificationFields = detectChangedReverificationFields;
exports.sendReverificationTriggerErrorResponse = sendReverificationTriggerErrorResponse;
exports.triggerReverification = triggerReverification;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const openclaw_service_1 = require("./openclaw-service");
const logger_1 = require("./logger");
const request_utils_1 = require("../utils/request-utils");
const error_handler_1 = require("../middleware/error-handler");
exports.PHARMACY_VERIFICATION_REQUEST_TYPE = 'pharmacy_verification';
exports.PHARMACY_REVERIFICATION_REQUEST_TYPE = 'pharmacy_reverification';
const VERIFICATION_REQUEST_TYPES = new Set([
    exports.PHARMACY_VERIFICATION_REQUEST_TYPE,
    exports.PHARMACY_REVERIFICATION_REQUEST_TYPE,
]);
function isVerificationRequestType(value) {
    return typeof value === 'string' && VERIFICATION_REQUEST_TYPES.has(value);
}
const REVERIFICATION_FIELD_LIST = [
    'email', 'name', 'postalCode', 'address', 'phone', 'fax', 'licenseNumber', 'prefecture',
];
function isVerified(status) {
    return status === 'verified';
}
function isPendingVerification(status) {
    return status === 'pending_verification';
}
function canLogin(_status, isActive) {
    return isActive;
}
function detectChangedReverificationFields(currentValues, updates) {
    const changed = [];
    for (const field of REVERIFICATION_FIELD_LIST) {
        if (!(field in updates))
            continue;
        if (!Object.is(currentValues[field], updates[field])) {
            changed.push(field);
        }
    }
    return changed;
}
class ReverificationTriggerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ReverificationTriggerError';
    }
}
exports.ReverificationTriggerError = ReverificationTriggerError;
function sendReverificationTriggerErrorResponse(res, errorMessage, latestVersion) {
    res.status(503).json({
        error: errorMessage,
        partialSuccess: true,
        verificationStatus: 'pending_verification',
        ...(latestVersion !== null ? { version: latestVersion } : {}),
    });
}
/**
 * プロフィール変更時の再認証トリガー。
 * - user_requests にリクエスト投入
 * - pharmacies.verificationStatus を pending_verification に更新
 * - OpenClaw へのハンドオフは非同期で実行（API応答をブロックしない）
 */
async function triggerReverification(pharmacyId, changedFields, options = {}) {
    const { triggeredBy } = options;
    const requestPayload = {
        type: exports.PHARMACY_REVERIFICATION_REQUEST_TYPE,
        changedFields,
        ...(triggeredBy ? { triggeredBy } : {}),
    };
    const requestText = JSON.stringify(requestPayload);
    try {
        let requestId = null;
        let reusedExistingRequest = false;
        const currentReqId = options.currentVerificationRequestId;
        if ((0, request_utils_1.isPositiveSafeInteger)(currentReqId)) {
            const [existingRequest] = await database_1.db.select({
                id: schema_1.userRequests.id,
                requestText: schema_1.userRequests.requestText,
                openclawStatus: schema_1.userRequests.openclawStatus,
            })
                .from(schema_1.userRequests)
                .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, currentReqId))
                .limit(1);
            if (existingRequest
                && existingRequest.requestText === requestText
                && existingRequest.openclawStatus !== 'completed') {
                requestId = existingRequest.id;
                reusedExistingRequest = true;
            }
        }
        if (requestId === null) {
            const [verificationRequest] = await database_1.db.insert(schema_1.userRequests).values({
                pharmacyId,
                requestText,
            }).returning({ id: schema_1.userRequests.id });
            if (!verificationRequest?.id) {
                throw new ReverificationTriggerError('再審査リクエストの作成に失敗しました');
            }
            requestId = verificationRequest.id;
        }
        await database_1.db.update(schema_1.pharmacies)
            .set({
            verificationStatus: 'pending_verification',
            verificationRequestId: requestId,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId));
        void (0, openclaw_service_1.handoffToOpenClaw)({
            requestId,
            pharmacyId,
            requestText,
        }).then((handoffResult) => {
            if (!handoffResult.accepted) {
                logger_1.logger.warn('Re-verification handoff was not accepted', {
                    pharmacyId,
                    requestId,
                    note: handoffResult.note,
                    reusedExistingRequest,
                });
            }
        }).catch((handoffErr) => {
            logger_1.logger.error('Re-verification handoff failed', {
                pharmacyId,
                requestId,
                error: (0, error_handler_1.getErrorMessage)(handoffErr),
            });
        });
        return {
            requestId,
            reusedExistingRequest,
        };
    }
    catch (err) {
        // DB層で失敗した場合でも fail-open を避けるため pending 状態へ寄せる。
        try {
            await database_1.db.update(schema_1.pharmacies)
                .set({ verificationStatus: 'pending_verification' })
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId));
        }
        catch (fallbackErr) {
            logger_1.logger.error('Failed to enforce pending_verification fallback', {
                pharmacyId,
                error: (0, error_handler_1.getErrorMessage)(fallbackErr),
            });
        }
        logger_1.logger.error('Re-verification trigger failed', {
            pharmacyId,
            error: (0, error_handler_1.getErrorMessage)(err),
            changedFields,
        });
        if (err instanceof ReverificationTriggerError) {
            throw err;
        }
        throw new ReverificationTriggerError('再審査依頼の登録に失敗しました');
    }
}
//# sourceMappingURL=pharmacy-verification-service.js.map