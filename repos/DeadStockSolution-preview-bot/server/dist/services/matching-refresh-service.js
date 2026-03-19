"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__testables = void 0;
exports.processPendingMatchingRefreshJobs = processPendingMatchingRefreshJobs;
exports.triggerMatchingRefreshOnUpload = triggerMatchingRefreshOnUpload;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const array_utils_1 = require("../utils/array-utils");
const job_retry_utils_1 = require("../utils/job-retry-utils");
const number_utils_1 = require("../utils/number-utils");
const matching_service_1 = require("./matching-service");
const logger_1 = require("./logger");
const matching_snapshot_service_1 = require("./matching-snapshot-service");
const AUTO_RECOMPUTE_ENABLED = (0, number_utils_1.parseBooleanFlag)(process.env.MATCHING_AUTO_RECOMPUTE_ENABLED, true);
const MAX_JOB_ATTEMPTS = 5;
const RETRY_BATCH_SIZE = 3;
const JOB_STALE_TIMEOUT_MS = 15 * 60 * 1000;
const RETRY_BACKOFF_BASE_MS = 2 * 60 * 1000;
const CLAIM_CONTENTION_RETRY_LIMIT = 3;
const MATCHING_REFRESH_TRIGGER_LOCK_NAMESPACE = 9413;
const MATCHING_REFRESH_DEBOUNCE_MS = resolveMatchingRefreshDebounceMs(process.env.MATCHING_REFRESH_DEBOUNCE_MS);
const REFRESH_MATCH_BATCH_SIZE = resolveRefreshMatchBatchSize(process.env.MATCHING_REFRESH_BATCH_SIZE);
function resolveRefreshMatchBatchSize(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return 200;
    }
    return parsed;
}
function resolveMatchingRefreshDebounceMs(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        return 120_000;
    }
    return Math.min(parsed, 10 * 60 * 1000);
}
function getCurrentMonthStartIso() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
async function resolveImpactedPharmacyIds(triggerPharmacyId) {
    const firstOfMonth = getCurrentMonthStartIso();
    const rows = await database_1.db.select({ id: schema_1.pharmacies.id })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true), (0, drizzle_orm_1.eq)(schema_1.pharmacies.isAdmin, false), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.deadStockItems.id })
        .from(schema_1.deadStockItems)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true)))), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.usedMedicationItems.id })
        .from(schema_1.usedMedicationItems)
        .where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, schema_1.pharmacies.id))), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.uploads.id })
        .from(schema_1.uploads)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.uploads.uploadType, 'used_medication'), (0, drizzle_orm_1.gte)(schema_1.uploads.createdAt, firstOfMonth))))));
    const ids = new Set(rows.map((row) => row.id));
    ids.add(triggerPharmacyId);
    return [...ids];
}
async function runSingleRefresh(triggerPharmacyId, uploadType) {
    const impactedIds = await resolveImpactedPharmacyIds(triggerPharmacyId);
    let changedCount = 0;
    const failedPharmacyIds = [];
    // 通知設定をバルクフェッチ（N+1 防止）
    const notifyRows = await database_1.db.select({ id: schema_1.pharmacies.id, matchingAutoNotifyEnabled: schema_1.pharmacies.matchingAutoNotifyEnabled })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, impactedIds));
    const notifyEnabledMap = new Map(notifyRows.map((r) => [r.id, r.matchingAutoNotifyEnabled !== false]));
    for (const pharmacyIdChunk of (0, array_utils_1.splitIntoChunks)(impactedIds, REFRESH_MATCH_BATCH_SIZE)) {
        let matchesByPharmacy = null;
        try {
            matchesByPharmacy = await (0, matching_service_1.findMatchesBatch)(pharmacyIdChunk);
        }
        catch (batchErr) {
            logger_1.logger.warn('Matching auto refresh batch lookup failed. Falling back to per-pharmacy matching', {
                triggerPharmacyId,
                uploadType,
                impactedCount: pharmacyIdChunk.length,
                error: batchErr instanceof Error ? batchErr.message : String(batchErr),
            });
        }
        for (const pharmacyId of pharmacyIdChunk) {
            try {
                const candidates = matchesByPharmacy && matchesByPharmacy.has(pharmacyId)
                    ? matchesByPharmacy.get(pharmacyId) ?? []
                    : await (0, matching_service_1.findMatches)(pharmacyId);
                const result = await (0, matching_snapshot_service_1.saveMatchSnapshotAndNotifyOnChange)({
                    pharmacyId,
                    triggerPharmacyId,
                    triggerUploadType: uploadType,
                    candidates,
                    notifyEnabled: notifyEnabledMap.get(pharmacyId) ?? true,
                });
                if (result.changed)
                    changedCount += 1;
            }
            catch (err) {
                failedPharmacyIds.push(pharmacyId);
                logger_1.logger.error('Matching auto refresh failed for pharmacy', {
                    pharmacyId,
                    triggerPharmacyId,
                    uploadType,
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }
    }
    if (failedPharmacyIds.length > 0) {
        throw new Error(`Matching auto refresh failed for pharmacies: ${failedPharmacyIds.join(',')}`);
    }
    logger_1.logger.info('Matching auto refresh completed', {
        triggerPharmacyId,
        uploadType,
        impactedCount: impactedIds.length,
        changedCount,
    });
}
async function claimNextRefreshJob(excludedJobIds = []) {
    for (let attempt = 0; attempt < CLAIM_CONTENTION_RETRY_LIMIT; attempt += 1) {
        const nowIso = new Date().toISOString();
        const staleBeforeIso = (0, job_retry_utils_1.getStaleBeforeIso)(JOB_STALE_TIMEOUT_MS);
        const conditions = [
            (0, drizzle_orm_1.lt)(schema_1.matchingRefreshJobs.attempts, MAX_JOB_ATTEMPTS),
            (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.matchingRefreshJobs.nextRetryAt), (0, drizzle_orm_1.lte)(schema_1.matchingRefreshJobs.nextRetryAt, nowIso)),
            (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.matchingRefreshJobs.processingStartedAt), (0, drizzle_orm_1.lt)(schema_1.matchingRefreshJobs.processingStartedAt, staleBeforeIso)),
        ];
        if (excludedJobIds.length > 0) {
            conditions.push((0, drizzle_orm_1.notInArray)(schema_1.matchingRefreshJobs.id, excludedJobIds));
        }
        const [candidate] = await database_1.db.select({
            id: schema_1.matchingRefreshJobs.id,
            triggerPharmacyId: schema_1.matchingRefreshJobs.triggerPharmacyId,
            uploadType: schema_1.matchingRefreshJobs.uploadType,
            attempts: schema_1.matchingRefreshJobs.attempts,
        })
            .from(schema_1.matchingRefreshJobs)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.matchingRefreshJobs.createdAt), (0, drizzle_orm_1.asc)(schema_1.matchingRefreshJobs.id))
            .limit(1);
        if (!candidate)
            return null;
        const [claimed] = await database_1.db.update(schema_1.matchingRefreshJobs)
            .set({
            processingStartedAt: nowIso,
            updatedAt: nowIso,
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.matchingRefreshJobs.id, candidate.id), (0, drizzle_orm_1.lt)(schema_1.matchingRefreshJobs.attempts, MAX_JOB_ATTEMPTS), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.matchingRefreshJobs.nextRetryAt), (0, drizzle_orm_1.lte)(schema_1.matchingRefreshJobs.nextRetryAt, nowIso)), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.matchingRefreshJobs.processingStartedAt), (0, drizzle_orm_1.lt)(schema_1.matchingRefreshJobs.processingStartedAt, staleBeforeIso))))
            .returning({
            id: schema_1.matchingRefreshJobs.id,
            triggerPharmacyId: schema_1.matchingRefreshJobs.triggerPharmacyId,
            uploadType: schema_1.matchingRefreshJobs.uploadType,
            attempts: schema_1.matchingRefreshJobs.attempts,
        });
        if (claimed)
            return claimed;
    }
    return null;
}
async function processOneRefreshJob(job) {
    try {
        await runSingleRefresh(job.triggerPharmacyId, job.uploadType);
        await database_1.db.delete(schema_1.matchingRefreshJobs).where((0, drizzle_orm_1.eq)(schema_1.matchingRefreshJobs.id, job.id));
        return true;
    }
    catch (err) {
        const nextAttempts = job.attempts + 1;
        const errorMessage = err instanceof Error ? err.message : String(err);
        const nowIso = new Date().toISOString();
        await database_1.db.update(schema_1.matchingRefreshJobs)
            .set({
            attempts: nextAttempts,
            lastError: errorMessage,
            processingStartedAt: null,
            nextRetryAt: (0, job_retry_utils_1.getNextRetryIso)(nextAttempts, MAX_JOB_ATTEMPTS, RETRY_BACKOFF_BASE_MS),
            updatedAt: nowIso,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.matchingRefreshJobs.id, job.id));
        if (nextAttempts >= MAX_JOB_ATTEMPTS) {
            logger_1.logger.error('Matching refresh job reached max attempts', {
                jobId: job.id,
                triggerPharmacyId: job.triggerPharmacyId,
                uploadType: job.uploadType,
                attempts: nextAttempts,
                error: errorMessage,
            });
        }
        else {
            logger_1.logger.warn('Matching refresh job attempt failed and will retry later', {
                jobId: job.id,
                triggerPharmacyId: job.triggerPharmacyId,
                uploadType: job.uploadType,
                attempts: nextAttempts,
                error: errorMessage,
            });
        }
        return false;
    }
}
async function processPendingRefreshJobs(limit) {
    let processed = 0;
    const failedInThisRun = [];
    for (let i = 0; i < limit; i += 1) {
        const job = await claimNextRefreshJob(failedInThisRun);
        if (!job)
            break;
        const success = await processOneRefreshJob(job);
        if (success) {
            processed += 1;
        }
        else {
            failedInThisRun.push(job.id);
        }
    }
    return processed;
}
async function processPendingMatchingRefreshJobs(limit = RETRY_BATCH_SIZE) {
    if (!AUTO_RECOMPUTE_ENABLED)
        return 0;
    return processPendingRefreshJobs(limit);
}
async function triggerMatchingRefreshOnUpload(params, executor = database_1.db) {
    if (!AUTO_RECOMPUTE_ENABLED)
        return;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const scheduledAtIso = new Date(now + MATCHING_REFRESH_DEBOUNCE_MS).toISOString();
    const staleBeforeIso = (0, job_retry_utils_1.getStaleBeforeIso)(JOB_STALE_TIMEOUT_MS);
    await executor.execute((0, drizzle_orm_1.sql) `SELECT pg_advisory_xact_lock(${MATCHING_REFRESH_TRIGGER_LOCK_NAMESPACE}, ${params.triggerPharmacyId})`);
    const existingRows = await executor.select({
        id: schema_1.matchingRefreshJobs.id,
        processingStartedAt: schema_1.matchingRefreshJobs.processingStartedAt,
        attempts: schema_1.matchingRefreshJobs.attempts,
    })
        .from(schema_1.matchingRefreshJobs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.matchingRefreshJobs.triggerPharmacyId, params.triggerPharmacyId), (0, drizzle_orm_1.lt)(schema_1.matchingRefreshJobs.attempts, MAX_JOB_ATTEMPTS)))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.matchingRefreshJobs.createdAt), (0, drizzle_orm_1.asc)(schema_1.matchingRefreshJobs.id));
    const waitingRows = existingRows.filter((row) => (row.processingStartedAt === null || row.processingStartedAt < staleBeforeIso));
    const keeper = waitingRows[0];
    if (keeper) {
        await executor.update(schema_1.matchingRefreshJobs)
            .set({
            uploadType: params.uploadType,
            attempts: 0,
            processingStartedAt: null,
            nextRetryAt: scheduledAtIso,
            lastError: null,
            updatedAt: nowIso,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.matchingRefreshJobs.id, keeper.id));
        const redundantIds = waitingRows
            .slice(1)
            .map((row) => row.id);
        if (redundantIds.length > 0) {
            await executor.delete(schema_1.matchingRefreshJobs)
                .where((0, drizzle_orm_1.inArray)(schema_1.matchingRefreshJobs.id, redundantIds));
        }
        return;
    }
    await executor.insert(schema_1.matchingRefreshJobs).values({
        triggerPharmacyId: params.triggerPharmacyId,
        uploadType: params.uploadType,
        attempts: 0,
        processingStartedAt: null,
        nextRetryAt: scheduledAtIso,
        lastError: null,
        updatedAt: nowIso,
    });
}
exports.__testables = {
    claimNextRefreshJob,
    runSingleRefresh,
    splitIntoChunks: array_utils_1.splitIntoChunks,
};
//# sourceMappingURL=matching-refresh-service.js.map