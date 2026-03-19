"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_CONFIRM_RETRY_UNAVAILABLE_ERROR_CODE = exports.UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT_ERROR_CODE = exports.UPLOAD_CONFIRM_QUEUE_LIMIT_ERROR_CODE = void 0;
exports.isUploadConfirmQueueLimitError = isUploadConfirmQueueLimitError;
exports.isUploadConfirmIdempotencyConflictError = isUploadConfirmIdempotencyConflictError;
exports.isUploadConfirmRetryUnavailableError = isUploadConfirmRetryUnavailableError;
exports.enqueueUploadConfirmJob = enqueueUploadConfirmJob;
exports.ensureUploadConfirmQueueHasCapacity = ensureUploadConfirmQueueHasCapacity;
exports.processUploadConfirmJobById = processUploadConfirmJobById;
exports.processPendingUploadConfirmJobs = processPendingUploadConfirmJobs;
exports.cleanupUploadConfirmJobs = cleanupUploadConfirmJobs;
exports.getUploadConfirmJobById = getUploadConfirmJobById;
exports.getUploadConfirmJobForPharmacy = getUploadConfirmJobForPharmacy;
exports.cancelUploadConfirmJobByAdmin = cancelUploadConfirmJobByAdmin;
exports.cancelUploadConfirmJobForPharmacy = cancelUploadConfirmJobForPharmacy;
exports.retryUploadConfirmJobByAdmin = retryUploadConfirmJobByAdmin;
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const util_1 = require("util");
const zlib_1 = require("zlib");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const db_utils_1 = require("../utils/db-utils");
const job_retry_utils_1 = require("../utils/job-retry-utils");
const number_utils_1 = require("../utils/number-utils");
const logger_1 = require("./logger");
const upload_row_issue_service_1 = require("./upload-row-issue-service");
const upload_confirm_service_1 = require("./upload-confirm-service");
const upload_service_1 = require("./upload-service");
const MAX_JOB_ATTEMPTS = 5;
const RETRY_BATCH_SIZE = 3;
const JOB_STALE_TIMEOUT_MS = 15 * 60 * 1000;
const RETRY_BACKOFF_BASE_MS = 2 * 60 * 1000;
const CLAIM_CONTENTION_RETRY_LIMIT = 3;
const DEFAULT_MAX_ACTIVE_JOBS_PER_PHARMACY = 3;
const DEFAULT_MAX_ACTIVE_JOBS_GLOBAL = 60;
const UPLOAD_CONFIRM_QUEUE_LOCK_NAMESPACE = 9412;
const UPLOAD_CONFIRM_QUEUE_GLOBAL_LOCK_KEY = 1;
const DEFAULT_CLEANUP_RETENTION_DAYS = 7;
const DEFAULT_CLEANUP_BATCH_SIZE = 200;
const MAX_MAPPING_COLUMN_INDEX = 199;
const ACTIVE_JOB_STATUSES = ['pending', 'processing'];
const FINISHED_JOB_STATUSES = ['completed', 'failed'];
const IDEMPOTENT_DEDUP_JOB_STATUSES = ['pending', 'processing', 'completed', 'failed'];
const COMPRESSED_PAYLOAD_PREFIX = 'gz:';
const CLEARED_FILE_PAYLOAD = '';
const JOB_ERROR_CODE_PREFIX_PATTERN = /^\[([A-Z0-9_]+)]\s*/;
const CANCELLED_JOB_MESSAGE = '管理者によりジョブがキャンセルされました';
const gzipAsync = (0, util_1.promisify)(zlib_1.gzip);
const gunzipAsync = (0, util_1.promisify)(zlib_1.gunzip);
exports.UPLOAD_CONFIRM_QUEUE_LIMIT_ERROR_CODE = 'UPLOAD_CONFIRM_QUEUE_LIMIT';
exports.UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT_ERROR_CODE = 'UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT';
exports.UPLOAD_CONFIRM_RETRY_UNAVAILABLE_ERROR_CODE = 'UPLOAD_CONFIRM_RETRY_UNAVAILABLE';
class UploadConfirmJobProcessingError extends Error {
    code;
    retryable;
    constructor(code, message, retryable) {
        super(message);
        this.name = 'UploadConfirmJobProcessingError';
        this.code = code;
        this.retryable = retryable;
    }
}
function createUploadConfirmJobError(code, message, retryable) {
    return new UploadConfirmJobProcessingError(code, message, retryable);
}
function formatJobErrorMessage(code, message) {
    return `[${code}] ${message}`;
}
function stripJobErrorCodePrefix(rawMessage) {
    return rawMessage.replace(JOB_ERROR_CODE_PREFIX_PATTERN, '').trim();
}
function parseJobErrorCode(rawMessage) {
    const matched = rawMessage.match(JOB_ERROR_CODE_PREFIX_PATTERN);
    if (!matched?.[1])
        return null;
    return matched[1];
}
function toSafeCount(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'bigint') {
        return Number(value);
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}
function getMaxActiveJobsPerPharmacy() {
    return (0, number_utils_1.parseBoundedInt)(process.env.UPLOAD_CONFIRM_MAX_ACTIVE_JOBS_PER_PHARMACY, DEFAULT_MAX_ACTIVE_JOBS_PER_PHARMACY, 1, 20);
}
function getMaxActiveJobsGlobal() {
    return (0, number_utils_1.parseBoundedInt)(process.env.UPLOAD_CONFIRM_MAX_ACTIVE_JOBS_GLOBAL, DEFAULT_MAX_ACTIVE_JOBS_GLOBAL, 1, 500);
}
function getCleanupRetentionDays() {
    return (0, number_utils_1.parseBoundedInt)(process.env.UPLOAD_CONFIRM_JOB_RETENTION_DAYS, DEFAULT_CLEANUP_RETENTION_DAYS, 1, 365);
}
function getCleanupBatchSize() {
    return (0, number_utils_1.parseBoundedInt)(process.env.UPLOAD_CONFIRM_JOB_CLEANUP_BATCH_SIZE, DEFAULT_CLEANUP_BATCH_SIZE, 1, 1000);
}
function createQueueLimitError(limit, activeJobs) {
    const error = new Error(`現在アップロード処理が混み合っています（上限: ${limit}件）。進行中ジョブ完了後に再実行してください。`);
    error.name = 'UploadConfirmQueueLimitError';
    error.code = exports.UPLOAD_CONFIRM_QUEUE_LIMIT_ERROR_CODE;
    error.limit = limit;
    error.activeJobs = activeJobs;
    return error;
}
function createIdempotencyConflictError() {
    const error = new Error('同じ idempotencyKey で異なるアップロード要求が送信されました。新しい idempotencyKey で再実行してください。');
    error.name = 'UploadConfirmIdempotencyConflictError';
    error.code = exports.UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT_ERROR_CODE;
    return error;
}
function createRetryUnavailableError(message) {
    const error = new Error(message);
    error.name = 'UploadConfirmRetryUnavailableError';
    error.code = exports.UPLOAD_CONFIRM_RETRY_UNAVAILABLE_ERROR_CODE;
    return error;
}
function isUploadConfirmQueueLimitError(error) {
    return Boolean(error
        && typeof error === 'object'
        && 'code' in error
        && error.code === exports.UPLOAD_CONFIRM_QUEUE_LIMIT_ERROR_CODE);
}
function isUploadConfirmIdempotencyConflictError(error) {
    return Boolean(error
        && typeof error === 'object'
        && 'code' in error
        && error.code === exports.UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT_ERROR_CODE);
}
function isUploadConfirmRetryUnavailableError(error) {
    return Boolean(error
        && typeof error === 'object'
        && 'code' in error
        && error.code === exports.UPLOAD_CONFIRM_RETRY_UNAVAILABLE_ERROR_CODE);
}
function isCancelableStatus(status) {
    return status === 'pending' || status === 'processing';
}
function isJobCancelable(status, cancelRequestedAt, canceledAt) {
    return isCancelableStatus(status) && cancelRequestedAt === null && canceledAt === null;
}
function computeFileHash(fileBuffer) {
    return (0, crypto_1.createHash)('sha256').update(fileBuffer).digest('hex');
}
async function encodeUploadJobFilePayload(fileBuffer) {
    const compressed = await gzipAsync(fileBuffer);
    return `${COMPRESSED_PAYLOAD_PREFIX}${compressed.toString('base64')}`;
}
async function decodeUploadJobFilePayload(filePayload) {
    if (!filePayload) {
        throw createUploadConfirmJobError('FILE_PAYLOAD_MISSING', 'ジョブのアップロードファイルが見つかりません', false);
    }
    if (!filePayload.startsWith(COMPRESSED_PAYLOAD_PREFIX)) {
        return Buffer.from(filePayload, 'base64');
    }
    const compressedBase64 = filePayload.slice(COMPRESSED_PAYLOAD_PREFIX.length);
    if (!compressedBase64) {
        throw createUploadConfirmJobError('FILE_PAYLOAD_MISSING', 'ジョブのアップロードファイルが見つかりません', false);
    }
    try {
        const compressedBuffer = Buffer.from(compressedBase64, 'base64');
        return await gunzipAsync(compressedBuffer);
    }
    catch {
        throw createUploadConfirmJobError('FILE_PARSE_FAILED', 'アップロードファイルを解析できませんでした', false);
    }
}
async function countActiveJobsForPharmacy(pharmacyId, executor = database_1.db) {
    const [row] = await executor.select({
        count: db_utils_1.rowCount,
    })
        .from(schema_1.uploadConfirmJobs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.pharmacyId, pharmacyId), (0, drizzle_orm_1.inArray)(schema_1.uploadConfirmJobs.status, ACTIVE_JOB_STATUSES), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)));
    return toSafeCount(row?.count);
}
async function countActiveJobsGlobal(executor = database_1.db) {
    const [row] = await executor.select({
        count: db_utils_1.rowCount,
    })
        .from(schema_1.uploadConfirmJobs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.uploadConfirmJobs.status, ACTIVE_JOB_STATUSES), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)));
    return toSafeCount(row?.count);
}
async function lockUploadConfirmQueueCapacity(pharmacyId, executor) {
    await executor.execute((0, drizzle_orm_1.sql) `SELECT pg_advisory_xact_lock(${UPLOAD_CONFIRM_QUEUE_LOCK_NAMESPACE}, ${UPLOAD_CONFIRM_QUEUE_GLOBAL_LOCK_KEY})`);
    await executor.execute((0, drizzle_orm_1.sql) `SELECT pg_advisory_xact_lock(${pharmacyId})`);
}
async function assertUploadConfirmQueueCapacity(pharmacyId, executor) {
    const maxActiveJobs = getMaxActiveJobsPerPharmacy();
    const activeJobs = await countActiveJobsForPharmacy(pharmacyId, executor);
    if (activeJobs >= maxActiveJobs) {
        throw createQueueLimitError(maxActiveJobs, activeJobs);
    }
    const maxActiveJobsGlobal = getMaxActiveJobsGlobal();
    const globalActiveJobs = await countActiveJobsGlobal(executor);
    if (globalActiveJobs >= maxActiveJobsGlobal) {
        throw createQueueLimitError(maxActiveJobsGlobal, globalActiveJobs);
    }
}
async function assertUploadConfirmQueueCapacityWithLocks(pharmacyId, executor) {
    await lockUploadConfirmQueueCapacity(pharmacyId, executor);
    await assertUploadConfirmQueueCapacity(pharmacyId, executor);
}
function buildClaimableStatusCondition(staleBeforeIso) {
    return (0, drizzle_orm_1.and)((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'pending'), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'processing'), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.processingStartedAt), (0, drizzle_orm_1.lt)(schema_1.uploadConfirmJobs.processingStartedAt, staleBeforeIso)))));
}
async function finalizeCancelRequestedJob(jobId, nowIso) {
    await database_1.db.update(schema_1.uploadConfirmJobs)
        .set({
        status: 'failed',
        lastError: formatJobErrorMessage('JOB_CANCELED', CANCELLED_JOB_MESSAGE),
        nextRetryAt: null,
        processingStartedAt: null,
        fileBase64: CLEARED_FILE_PAYLOAD,
        canceledAt: (0, drizzle_orm_1.sql) `coalesce(${schema_1.uploadConfirmJobs.cancelRequestedAt}, ${nowIso})`,
        completedAt: nowIso,
        updatedAt: nowIso,
    })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, jobId), (0, drizzle_orm_1.isNotNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)));
}
function classifyUploadConfirmJobError(err) {
    if (err instanceof UploadConfirmJobProcessingError) {
        return {
            code: err.code,
            message: err.message,
            retryable: err.retryable,
            rawMessage: err.message,
        };
    }
    const rawMessage = err instanceof Error ? err.message : String(err);
    const prefixedCode = parseJobErrorCode(rawMessage);
    if (prefixedCode) {
        return {
            code: prefixedCode,
            message: stripJobErrorCodePrefix(rawMessage),
            retryable: false,
            rawMessage,
        };
    }
    if (/mapping/i.test(rawMessage)) {
        return {
            code: 'MAPPING_INVALID',
            message: 'カラム割り当ての設定が不正です',
            retryable: false,
            rawMessage,
        };
    }
    if (/ヘッダー行指定が不正/.test(rawMessage)) {
        return {
            code: 'HEADER_ROW_INVALID',
            message: 'ヘッダー行指定が不正です',
            retryable: false,
            rawMessage,
        };
    }
    if (/上限\(/.test(rawMessage)) {
        return {
            code: 'FILE_LIMIT_EXCEEDED',
            message: rawMessage,
            retryable: false,
            rawMessage,
        };
    }
    if (/ファイルの解析/i.test(rawMessage)
        || /read/i.test(rawMessage)
        || /xlsx/i.test(rawMessage)
        || /zip/i.test(rawMessage)
        || /corrupt/i.test(rawMessage)) {
        return {
            code: 'FILE_PARSE_FAILED',
            message: 'アップロードファイルを解析できませんでした',
            retryable: false,
            rawMessage,
        };
    }
    if (/applyMode/i.test(rawMessage)) {
        return {
            code: 'APPLY_MODE_INVALID',
            message: 'ジョブの適用モードが不正です',
            retryable: false,
            rawMessage,
        };
    }
    if (/uploadType/i.test(rawMessage)) {
        return {
            code: 'UPLOAD_TYPE_INVALID',
            message: 'ジョブのアップロード種別が不正です',
            retryable: false,
            rawMessage,
        };
    }
    if (/cancel/i.test(rawMessage)) {
        return {
            code: 'JOB_CANCELED',
            message: CANCELLED_JOB_MESSAGE,
            retryable: false,
            rawMessage,
        };
    }
    return {
        code: 'UPLOAD_CONFIRM_FAILED',
        message: rawMessage,
        retryable: true,
        rawMessage,
    };
}
function parseStoredMapping(mappingJson, uploadType) {
    let parsed;
    try {
        parsed = JSON.parse(mappingJson);
    }
    catch {
        throw createUploadConfirmJobError('MAPPING_INVALID', 'ジョブ内のmapping JSONが不正です', false);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw createUploadConfirmJobError('MAPPING_INVALID', 'ジョブ内のmapping形式が不正です', false);
    }
    const allowedFields = uploadType === 'dead_stock'
        ? new Set(types_1.DEAD_STOCK_FIELDS)
        : new Set(types_1.USED_MEDICATION_FIELDS);
    const mapping = Object.create(null);
    for (const field of allowedFields) {
        mapping[field] = null;
    }
    for (const [key, value] of Object.entries(parsed)) {
        if (!allowedFields.has(key))
            continue;
        if (value === null) {
            mapping[key] = null;
            continue;
        }
        if (typeof value === 'string' && /^\d{1,3}$/.test(value)) {
            const colIdx = Number(value);
            if (Number.isInteger(colIdx) && colIdx >= 0 && colIdx <= MAX_MAPPING_COLUMN_INDEX) {
                mapping[key] = value;
            }
        }
    }
    if (!mapping.drug_name) {
        throw createUploadConfirmJobError('MAPPING_INVALID', 'ジョブ内のmappingで薬剤名カラムの割り当てが不足しています', false);
    }
    if (uploadType === 'dead_stock' && !mapping.quantity) {
        throw createUploadConfirmJobError('MAPPING_INVALID', 'ジョブ内のmappingで数量カラムの割り当てが不足しています', false);
    }
    return mapping;
}
function normalizeApplyMode(value) {
    if (value === 'replace' || value === 'diff' || value === 'partial') {
        return value;
    }
    throw createUploadConfirmJobError('APPLY_MODE_INVALID', `ジョブ内のapplyModeが不正です: ${value}`, false);
}
function normalizeClaimableStatus(value) {
    if (value === 'pending' || value === 'processing') {
        return value;
    }
    throw createUploadConfirmJobError('JOB_STATUS_INVALID', `ジョブ内のstatusが不正です: ${value}`, false);
}
function normalizeJobStatus(value) {
    if (value === 'pending' || value === 'processing' || value === 'completed' || value === 'failed') {
        return value;
    }
    throw createUploadConfirmJobError('JOB_STATUS_INVALID', `ジョブ内のstatusが不正です: ${value}`, false);
}
const JOB_RECORD_COLUMNS = {
    id: schema_1.uploadConfirmJobs.id,
    pharmacyId: schema_1.uploadConfirmJobs.pharmacyId,
    uploadType: schema_1.uploadConfirmJobs.uploadType,
    originalFilename: schema_1.uploadConfirmJobs.originalFilename,
    idempotencyKey: schema_1.uploadConfirmJobs.idempotencyKey,
    fileHash: schema_1.uploadConfirmJobs.fileHash,
    headerRowIndex: schema_1.uploadConfirmJobs.headerRowIndex,
    mappingJson: schema_1.uploadConfirmJobs.mappingJson,
    status: schema_1.uploadConfirmJobs.status,
    applyMode: schema_1.uploadConfirmJobs.applyMode,
    deleteMissing: schema_1.uploadConfirmJobs.deleteMissing,
    deduplicated: schema_1.uploadConfirmJobs.deduplicated,
    fileBase64: schema_1.uploadConfirmJobs.fileBase64,
    attempts: schema_1.uploadConfirmJobs.attempts,
    lastError: schema_1.uploadConfirmJobs.lastError,
    resultJson: schema_1.uploadConfirmJobs.resultJson,
    cancelRequestedAt: schema_1.uploadConfirmJobs.cancelRequestedAt,
    canceledAt: schema_1.uploadConfirmJobs.canceledAt,
    canceledBy: schema_1.uploadConfirmJobs.canceledBy,
    processingStartedAt: schema_1.uploadConfirmJobs.processingStartedAt,
    nextRetryAt: schema_1.uploadConfirmJobs.nextRetryAt,
    completedAt: schema_1.uploadConfirmJobs.completedAt,
    createdAt: schema_1.uploadConfirmJobs.createdAt,
    updatedAt: schema_1.uploadConfirmJobs.updatedAt,
};
function mapJobRecord(row) {
    const status = normalizeJobStatus(row.status);
    const applyMode = normalizeApplyMode(row.applyMode);
    return {
        ...row,
        status,
        applyMode,
    };
}
async function fetchUploadConfirmJobById(jobId, executor = database_1.db) {
    const [row] = await executor.select(JOB_RECORD_COLUMNS)
        .from(schema_1.uploadConfirmJobs)
        .where((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, jobId))
        .limit(1);
    if (!row)
        return null;
    return mapJobRecord(row);
}
async function assertJobNotCancellationRequested(jobId) {
    const [row] = await database_1.db.select({
        cancelRequestedAt: schema_1.uploadConfirmJobs.cancelRequestedAt,
        canceledAt: schema_1.uploadConfirmJobs.canceledAt,
    })
        .from(schema_1.uploadConfirmJobs)
        .where((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, jobId))
        .limit(1);
    if (row?.canceledAt || row?.cancelRequestedAt) {
        throw createUploadConfirmJobError('JOB_CANCELED', CANCELLED_JOB_MESSAGE, false);
    }
}
function buildNoOtherActiveProcessingCondition(candidateId, staleBeforeIso) {
    return (0, drizzle_orm_1.notExists)(database_1.db.select({ id: schema_1.uploadConfirmJobs.id })
        .from(schema_1.uploadConfirmJobs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'processing'), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt), (0, drizzle_orm_1.gte)(schema_1.uploadConfirmJobs.processingStartedAt, staleBeforeIso), (0, drizzle_orm_1.ne)(schema_1.uploadConfirmJobs.id, candidateId))));
}
async function claimPendingUploadConfirmJob() {
    for (let attempt = 0; attempt < CLAIM_CONTENTION_RETRY_LIMIT; attempt += 1) {
        const nowIso = new Date().toISOString();
        const staleBeforeIso = (0, job_retry_utils_1.getStaleBeforeIso)(JOB_STALE_TIMEOUT_MS);
        const [candidate] = await database_1.db.select({
            id: schema_1.uploadConfirmJobs.id,
            pharmacyId: schema_1.uploadConfirmJobs.pharmacyId,
            uploadType: schema_1.uploadConfirmJobs.uploadType,
            originalFilename: schema_1.uploadConfirmJobs.originalFilename,
            headerRowIndex: schema_1.uploadConfirmJobs.headerRowIndex,
            mappingJson: schema_1.uploadConfirmJobs.mappingJson,
            status: schema_1.uploadConfirmJobs.status,
            applyMode: schema_1.uploadConfirmJobs.applyMode,
            deleteMissing: schema_1.uploadConfirmJobs.deleteMissing,
            fileBase64: schema_1.uploadConfirmJobs.fileBase64,
            attempts: schema_1.uploadConfirmJobs.attempts,
            createdAt: schema_1.uploadConfirmJobs.createdAt,
        })
            .from(schema_1.uploadConfirmJobs)
            .where((0, drizzle_orm_1.and)(buildClaimableStatusCondition(staleBeforeIso), (0, drizzle_orm_1.lt)(schema_1.uploadConfirmJobs.attempts, MAX_JOB_ATTEMPTS), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.nextRetryAt), (0, drizzle_orm_1.lte)(schema_1.uploadConfirmJobs.nextRetryAt, nowIso))))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.uploadConfirmJobs.createdAt), (0, drizzle_orm_1.asc)(schema_1.uploadConfirmJobs.id))
            .limit(1);
        if (!candidate)
            return null;
        const candidateStatus = normalizeClaimableStatus(candidate.status);
        const [claimed] = await database_1.db.update(schema_1.uploadConfirmJobs)
            .set({
            status: 'processing',
            processingStartedAt: nowIso,
            updatedAt: nowIso,
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, candidate.id), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt), (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, candidateStatus), (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.attempts, candidate.attempts), (0, drizzle_orm_1.lt)(schema_1.uploadConfirmJobs.attempts, MAX_JOB_ATTEMPTS), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.nextRetryAt), (0, drizzle_orm_1.lte)(schema_1.uploadConfirmJobs.nextRetryAt, nowIso)), buildNoOtherActiveProcessingCondition(candidate.id, staleBeforeIso), candidateStatus === 'processing'
            ? (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.processingStartedAt), (0, drizzle_orm_1.lt)(schema_1.uploadConfirmJobs.processingStartedAt, staleBeforeIso))
            : (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'pending')))
            .returning({
            id: schema_1.uploadConfirmJobs.id,
            pharmacyId: schema_1.uploadConfirmJobs.pharmacyId,
            uploadType: schema_1.uploadConfirmJobs.uploadType,
            originalFilename: schema_1.uploadConfirmJobs.originalFilename,
            headerRowIndex: schema_1.uploadConfirmJobs.headerRowIndex,
            mappingJson: schema_1.uploadConfirmJobs.mappingJson,
            status: schema_1.uploadConfirmJobs.status,
            applyMode: schema_1.uploadConfirmJobs.applyMode,
            deleteMissing: schema_1.uploadConfirmJobs.deleteMissing,
            fileBase64: schema_1.uploadConfirmJobs.fileBase64,
            attempts: schema_1.uploadConfirmJobs.attempts,
            createdAt: schema_1.uploadConfirmJobs.createdAt,
        });
        if (claimed) {
            return {
                ...claimed,
                status: normalizeClaimableStatus(claimed.status),
                applyMode: normalizeApplyMode(claimed.applyMode),
            };
        }
    }
    return null;
}
async function processClaimedUploadConfirmJob(job) {
    try {
        await (0, upload_row_issue_service_1.clearUploadRowIssuesForJob)(job.id);
        await assertJobNotCancellationRequested(job.id);
        const mapping = parseStoredMapping(job.mappingJson, job.uploadType);
        const payloadBuffer = await decodeUploadJobFilePayload(job.fileBase64);
        let allRows;
        try {
            allRows = await (0, upload_service_1.parseExcelBuffer)(payloadBuffer);
        }
        catch {
            throw createUploadConfirmJobError('FILE_PARSE_FAILED', 'アップロードファイルを解析できませんでした', false);
        }
        await assertJobNotCancellationRequested(job.id);
        const result = await (0, upload_confirm_service_1.runUploadConfirm)({
            pharmacyId: job.pharmacyId,
            uploadType: job.uploadType,
            originalFilename: job.originalFilename,
            jobId: job.id,
            headerRowIndex: job.headerRowIndex,
            mapping,
            allRows,
            applyMode: job.applyMode,
            deleteMissing: job.deleteMissing,
            staleGuardCreatedAt: job.createdAt,
        });
        const responsePayload = {
            uploadId: result.uploadId,
            rowCount: result.rowCount,
            applyMode: job.applyMode,
            deleteMissing: job.applyMode === 'diff' ? job.deleteMissing : undefined,
            diffSummary: job.applyMode === 'diff' ? result.diffSummary : undefined,
            partialSummary: job.applyMode === 'partial' ? result.partialSummary : undefined,
            errorReportAvailable: job.applyMode === 'partial'
                ? (result.partialSummary?.rejectedRows ?? 0) > 0
                : false,
        };
        const nowIso = new Date().toISOString();
        const [completed] = await database_1.db.update(schema_1.uploadConfirmJobs)
            .set({
            status: 'completed',
            lastError: null,
            resultJson: JSON.stringify(responsePayload),
            fileBase64: CLEARED_FILE_PAYLOAD,
            processingStartedAt: null,
            cancelRequestedAt: null,
            canceledAt: null,
            canceledBy: null,
            completedAt: nowIso,
            updatedAt: nowIso,
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, job.id), (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'processing'), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)))
            .returning({ id: schema_1.uploadConfirmJobs.id });
        if (!completed) {
            await finalizeCancelRequestedJob(job.id, nowIso);
        }
    }
    catch (err) {
        const nextAttempts = job.attempts + 1;
        const classified = classifyUploadConfirmJobError(err);
        const message = formatJobErrorMessage(classified.code, classified.message);
        const nowIso = new Date().toISOString();
        const retryable = classified.retryable;
        const terminal = !retryable || nextAttempts >= MAX_JOB_ATTEMPTS;
        const updatePayload = {
            status: terminal ? 'failed' : 'pending',
            attempts: nextAttempts,
            lastError: message,
            processingStartedAt: null,
            nextRetryAt: terminal ? null : (0, job_retry_utils_1.getNextRetryIso)(nextAttempts, MAX_JOB_ATTEMPTS, RETRY_BACKOFF_BASE_MS),
            updatedAt: nowIso,
        };
        if (terminal) {
            updatePayload.completedAt = nowIso;
            if (classified.code === 'JOB_CANCELED') {
                updatePayload.cancelRequestedAt = nowIso;
                updatePayload.canceledAt = nowIso;
            }
        }
        const [updated] = await database_1.db.update(schema_1.uploadConfirmJobs)
            .set(updatePayload)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, job.id), (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'processing'), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)))
            .returning({ id: schema_1.uploadConfirmJobs.id });
        if (!updated) {
            await finalizeCancelRequestedJob(job.id, nowIso);
            const latest = await fetchUploadConfirmJobById(job.id);
            if (!latest || latest.canceledAt || latest.cancelRequestedAt || latest.status === 'completed') {
                return;
            }
        }
        if (!retryable) {
            logger_1.logger.warn('Upload confirm job failed as non-retryable', {
                jobId: job.id,
                pharmacyId: job.pharmacyId,
                attempts: nextAttempts,
                error: classified.rawMessage,
                code: classified.code,
            });
        }
        else if (terminal) {
            logger_1.logger.error('Upload confirm job reached max attempts', {
                jobId: job.id,
                pharmacyId: job.pharmacyId,
                attempts: nextAttempts,
                error: classified.rawMessage,
                code: classified.code,
            });
        }
        else {
            logger_1.logger.warn('Upload confirm job failed and will retry', {
                jobId: job.id,
                pharmacyId: job.pharmacyId,
                attempts: nextAttempts,
                error: classified.rawMessage,
                code: classified.code,
            });
        }
    }
}
async function findJobByIdempotencyKey(pharmacyId, idempotencyKey, executor) {
    const [row] = await executor.select(JOB_RECORD_COLUMNS)
        .from(schema_1.uploadConfirmJobs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.idempotencyKey, idempotencyKey), (0, drizzle_orm_1.inArray)(schema_1.uploadConfirmJobs.status, IDEMPOTENT_DEDUP_JOB_STATUSES), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.uploadConfirmJobs.id))
        .limit(1);
    if (!row)
        return null;
    return mapJobRecord(row);
}
function ensureIdempotentPayloadMatch(existing, input) {
    const matched = existing.uploadType === input.uploadType
        && existing.fileHash === input.fileHash
        && existing.headerRowIndex === input.headerRowIndex
        && existing.mappingJson === input.mappingJson
        && existing.applyMode === input.applyMode
        && existing.deleteMissing === input.deleteMissing;
    if (!matched) {
        throw createIdempotencyConflictError();
    }
}
async function enqueueUploadConfirmJob(params) {
    const fileHash = computeFileHash(params.fileBuffer);
    const mappingJson = JSON.stringify(params.mapping);
    return database_1.db.transaction(async (tx) => {
        await lockUploadConfirmQueueCapacity(params.pharmacyId, tx);
        if (params.idempotencyKey) {
            const existing = await findJobByIdempotencyKey(params.pharmacyId, params.idempotencyKey, tx);
            if (existing) {
                ensureIdempotentPayloadMatch(existing, {
                    uploadType: params.uploadType,
                    fileHash,
                    headerRowIndex: params.headerRowIndex,
                    mappingJson,
                    applyMode: params.applyMode,
                    deleteMissing: params.deleteMissing,
                });
                if (!existing.deduplicated) {
                    await tx.update(schema_1.uploadConfirmJobs)
                        .set({
                        deduplicated: true,
                        updatedAt: new Date().toISOString(),
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, existing.id));
                }
                return {
                    jobId: existing.id,
                    status: existing.status,
                    deduplicated: true,
                    cancelable: isJobCancelable(existing.status, existing.cancelRequestedAt, existing.canceledAt),
                    canceledAt: existing.canceledAt,
                };
            }
        }
        await assertUploadConfirmQueueCapacity(params.pharmacyId, tx);
        const encodedPayload = await encodeUploadJobFilePayload(params.fileBuffer);
        const nowIso = new Date().toISOString();
        const requestedAtIso = params.requestedAtIso ?? nowIso;
        const [job] = await tx.insert(schema_1.uploadConfirmJobs).values({
            pharmacyId: params.pharmacyId,
            uploadType: params.uploadType,
            originalFilename: params.originalFilename,
            idempotencyKey: params.idempotencyKey ?? null,
            fileHash,
            headerRowIndex: params.headerRowIndex,
            mappingJson,
            applyMode: params.applyMode,
            deleteMissing: params.deleteMissing,
            deduplicated: false,
            fileBase64: encodedPayload,
            status: 'pending',
            attempts: 0,
            lastError: null,
            resultJson: null,
            cancelRequestedAt: null,
            canceledAt: null,
            canceledBy: null,
            processingStartedAt: null,
            nextRetryAt: null,
            completedAt: null,
            createdAt: requestedAtIso,
            updatedAt: nowIso,
        }).returning({
            id: schema_1.uploadConfirmJobs.id,
            status: schema_1.uploadConfirmJobs.status,
            canceledAt: schema_1.uploadConfirmJobs.canceledAt,
            cancelRequestedAt: schema_1.uploadConfirmJobs.cancelRequestedAt,
        });
        return {
            jobId: job.id,
            status: job.status,
            deduplicated: false,
            cancelable: isJobCancelable(job.status, job.cancelRequestedAt, job.canceledAt),
            canceledAt: job.canceledAt,
        };
    });
}
async function ensureUploadConfirmQueueHasCapacity(pharmacyId) {
    await database_1.db.transaction(async (tx) => {
        await assertUploadConfirmQueueCapacityWithLocks(pharmacyId, tx);
    });
}
async function processUploadConfirmJobById(jobId) {
    const nowIso = new Date().toISOString();
    const staleBeforeIso = (0, job_retry_utils_1.getStaleBeforeIso)(JOB_STALE_TIMEOUT_MS);
    const [claimed] = await database_1.db.update(schema_1.uploadConfirmJobs)
        .set({
        status: 'processing',
        processingStartedAt: nowIso,
        updatedAt: nowIso,
    })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, jobId), (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'pending'), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt), (0, drizzle_orm_1.lt)(schema_1.uploadConfirmJobs.attempts, MAX_JOB_ATTEMPTS), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.nextRetryAt), (0, drizzle_orm_1.lte)(schema_1.uploadConfirmJobs.nextRetryAt, nowIso)), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.processingStartedAt), (0, drizzle_orm_1.lt)(schema_1.uploadConfirmJobs.processingStartedAt, staleBeforeIso))))
        .returning({
        id: schema_1.uploadConfirmJobs.id,
        pharmacyId: schema_1.uploadConfirmJobs.pharmacyId,
        uploadType: schema_1.uploadConfirmJobs.uploadType,
        originalFilename: schema_1.uploadConfirmJobs.originalFilename,
        headerRowIndex: schema_1.uploadConfirmJobs.headerRowIndex,
        mappingJson: schema_1.uploadConfirmJobs.mappingJson,
        status: schema_1.uploadConfirmJobs.status,
        applyMode: schema_1.uploadConfirmJobs.applyMode,
        deleteMissing: schema_1.uploadConfirmJobs.deleteMissing,
        fileBase64: schema_1.uploadConfirmJobs.fileBase64,
        attempts: schema_1.uploadConfirmJobs.attempts,
        createdAt: schema_1.uploadConfirmJobs.createdAt,
    });
    if (!claimed)
        return false;
    await processClaimedUploadConfirmJob({
        ...claimed,
        status: normalizeClaimableStatus(claimed.status),
        applyMode: normalizeApplyMode(claimed.applyMode),
    });
    return true;
}
async function processPendingUploadConfirmJobs(limit = RETRY_BATCH_SIZE) {
    const normalizedLimit = Math.min(Math.max(Math.trunc(limit) || 1, 1), RETRY_BATCH_SIZE);
    let processed = 0;
    for (let i = 0; i < normalizedLimit; i += 1) {
        const job = await claimPendingUploadConfirmJob();
        if (!job)
            break;
        await processClaimedUploadConfirmJob(job);
        processed += 1;
    }
    return processed;
}
async function cleanupUploadConfirmJobs(limit = getCleanupBatchSize()) {
    if (!Number.isInteger(limit) || limit <= 0) {
        return 0;
    }
    const retentionDays = getCleanupRetentionDays();
    const cutoffIso = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const staleRows = await database_1.db.select({
        id: schema_1.uploadConfirmJobs.id,
    })
        .from(schema_1.uploadConfirmJobs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.uploadConfirmJobs.status, FINISHED_JOB_STATUSES), (0, drizzle_orm_1.lte)(schema_1.uploadConfirmJobs.updatedAt, cutoffIso)))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.uploadConfirmJobs.updatedAt), (0, drizzle_orm_1.asc)(schema_1.uploadConfirmJobs.id))
        .limit(limit);
    if (staleRows.length === 0) {
        return 0;
    }
    const staleIds = staleRows.map((row) => row.id);
    await database_1.db.delete(schema_1.uploadConfirmJobs).where((0, drizzle_orm_1.inArray)(schema_1.uploadConfirmJobs.id, staleIds));
    return staleIds.length;
}
async function getUploadConfirmJobById(jobId) {
    const row = await fetchUploadConfirmJobById(jobId);
    if (!row) {
        return null;
    }
    const issueCount = await (0, upload_row_issue_service_1.getUploadRowIssueCountByJobId)(row.id);
    return {
        id: row.id,
        pharmacyId: row.pharmacyId,
        uploadType: row.uploadType,
        originalFilename: row.originalFilename,
        idempotencyKey: row.idempotencyKey,
        fileHash: row.fileHash,
        status: row.status,
        applyMode: row.applyMode,
        deleteMissing: row.deleteMissing,
        attempts: row.attempts,
        lastError: row.lastError,
        resultJson: row.resultJson,
        deduplicated: row.deduplicated,
        cancelRequestedAt: row.cancelRequestedAt,
        canceledAt: row.canceledAt,
        canceledBy: row.canceledBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
        issueCount,
        cancelable: isJobCancelable(row.status, row.cancelRequestedAt, row.canceledAt),
    };
}
async function getUploadConfirmJobForPharmacy(jobId, pharmacyId) {
    const row = await getUploadConfirmJobById(jobId);
    if (!row)
        return null;
    if (row.pharmacyId !== pharmacyId)
        return null;
    return row;
}
function toCancelResult(row) {
    return {
        id: row.id,
        status: normalizeJobStatus(row.status),
        canceledAt: row.canceledAt,
        cancelRequestedAt: row.cancelRequestedAt,
        cancelable: isJobCancelable(normalizeJobStatus(row.status), row.cancelRequestedAt, row.canceledAt),
    };
}
const CANCEL_RETURNING_COLUMNS = {
    id: schema_1.uploadConfirmJobs.id,
    status: schema_1.uploadConfirmJobs.status,
    canceledAt: schema_1.uploadConfirmJobs.canceledAt,
    cancelRequestedAt: schema_1.uploadConfirmJobs.cancelRequestedAt,
};
async function cancelJobCore(jobId, canceledBy, options) {
    return database_1.db.transaction(async (tx) => {
        const existing = await fetchUploadConfirmJobById(jobId, tx);
        if (!existing)
            return null;
        if (options.requirePharmacyId !== undefined && existing.pharmacyId !== options.requirePharmacyId) {
            return null;
        }
        if (!isCancelableStatus(existing.status)) {
            return toCancelResult(existing);
        }
        const nowIso = new Date().toISOString();
        const ownerConditions = options.requirePharmacyId !== undefined
            ? [(0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.pharmacyId, options.requirePharmacyId)]
            : [];
        const [updated] = await tx.update(schema_1.uploadConfirmJobs)
            .set(existing.status === 'pending'
            ? {
                status: 'failed',
                cancelRequestedAt: existing.cancelRequestedAt ?? nowIso,
                canceledAt: nowIso,
                canceledBy,
                lastError: formatJobErrorMessage('JOB_CANCELED', CANCELLED_JOB_MESSAGE),
                nextRetryAt: null,
                processingStartedAt: null,
                completedAt: nowIso,
                updatedAt: nowIso,
            }
            : {
                cancelRequestedAt: existing.cancelRequestedAt ?? nowIso,
                canceledBy,
                updatedAt: nowIso,
            })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, existing.id), ...ownerConditions, (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, existing.status), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)))
            .returning(CANCEL_RETURNING_COLUMNS);
        if (!updated) {
            const latest = await fetchUploadConfirmJobById(jobId, tx);
            if (!latest)
                return null;
            if (options.requirePharmacyId !== undefined && latest.pharmacyId !== options.requirePharmacyId) {
                return null;
            }
            if (isJobCancelable(latest.status, latest.cancelRequestedAt, latest.canceledAt)) {
                const [retryRequested] = await tx.update(schema_1.uploadConfirmJobs)
                    .set({
                    cancelRequestedAt: nowIso,
                    canceledBy,
                    updatedAt: nowIso,
                })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, latest.id), ...ownerConditions, (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, latest.status), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt)))
                    .returning(CANCEL_RETURNING_COLUMNS);
                if (retryRequested) {
                    return toCancelResult(retryRequested);
                }
            }
            return toCancelResult(latest);
        }
        return toCancelResult(updated);
    });
}
async function cancelUploadConfirmJobByAdmin(jobId, adminPharmacyId) {
    return cancelJobCore(jobId, adminPharmacyId, {});
}
async function cancelUploadConfirmJobForPharmacy(jobId, pharmacyId) {
    return cancelJobCore(jobId, pharmacyId, { requirePharmacyId: pharmacyId });
}
async function retryUploadConfirmJobByAdmin(jobId) {
    return database_1.db.transaction(async (tx) => {
        const existing = await fetchUploadConfirmJobById(jobId, tx);
        if (!existing) {
            return null;
        }
        if (!(existing.status === 'failed' || existing.status === 'completed')) {
            throw createRetryUnavailableError('再試行できるのは completed / failed 状態のジョブのみです');
        }
        if (!existing.fileBase64) {
            throw createRetryUnavailableError('元ファイルが保持されていないため再試行できません');
        }
        if (existing.idempotencyKey) {
            const [activeWithSameKey] = await tx.select({
                id: schema_1.uploadConfirmJobs.id,
            })
                .from(schema_1.uploadConfirmJobs)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.pharmacyId, existing.pharmacyId), (0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.idempotencyKey, existing.idempotencyKey), (0, drizzle_orm_1.ne)(schema_1.uploadConfirmJobs.id, existing.id), (0, drizzle_orm_1.inArray)(schema_1.uploadConfirmJobs.status, ACTIVE_JOB_STATUSES)))
                .limit(1);
            if (activeWithSameKey) {
                throw createRetryUnavailableError('同じ idempotencyKey の進行中ジョブがあるため再試行できません');
            }
        }
        await assertUploadConfirmQueueCapacityWithLocks(existing.pharmacyId, tx);
        const nowIso = new Date().toISOString();
        await (0, upload_row_issue_service_1.clearUploadRowIssuesForJob)(existing.id, tx);
        const [updated] = await tx.update(schema_1.uploadConfirmJobs)
            .set({
            status: 'pending',
            attempts: 0,
            lastError: null,
            resultJson: null,
            deduplicated: false,
            cancelRequestedAt: null,
            canceledAt: null,
            canceledBy: null,
            processingStartedAt: null,
            nextRetryAt: null,
            completedAt: null,
            updatedAt: nowIso,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.id, existing.id))
            .returning({
            id: schema_1.uploadConfirmJobs.id,
            status: schema_1.uploadConfirmJobs.status,
            canceledAt: schema_1.uploadConfirmJobs.canceledAt,
            cancelRequestedAt: schema_1.uploadConfirmJobs.cancelRequestedAt,
        });
        if (!updated) {
            return null;
        }
        return {
            id: updated.id,
            status: updated.status,
            cancelable: isJobCancelable(updated.status, updated.cancelRequestedAt, updated.canceledAt),
            canceledAt: updated.canceledAt,
        };
    });
}
//# sourceMappingURL=upload-confirm-job-service.js.map