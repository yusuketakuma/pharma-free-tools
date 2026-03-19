"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUploadConfirmRetryUnavailableError = void 0;
exports.listAdminUploadJobs = listAdminUploadJobs;
exports.getAdminUploadJobDetail = getAdminUploadJobDetail;
exports.cancelAdminUploadJob = cancelAdminUploadJob;
exports.retryAdminUploadJob = retryAdminUploadJob;
exports.getAdminUploadJobErrorReport = getAdminUploadJobErrorReport;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const upload_row_issue_service_1 = require("./upload-row-issue-service");
const upload_confirm_job_service_1 = require("./upload-confirm-job-service");
Object.defineProperty(exports, "isUploadConfirmRetryUnavailableError", { enumerable: true, get: function () { return upload_confirm_job_service_1.isUploadConfirmRetryUnavailableError; } });
function resolveUploadJobStatus(status, cancelRequestedAt, canceledAt) {
    if (cancelRequestedAt || canceledAt) {
        return 'canceled';
    }
    return status;
}
function parseResultJson(raw) {
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function extractPartialSummary(result) {
    if (!result || typeof result !== 'object') {
        return null;
    }
    return result.partialSummary ?? null;
}
function resolveErrorReportAvailable(issueCount, result) {
    if (issueCount > 0)
        return true;
    if (!result || typeof result !== 'object')
        return false;
    const resultObject = result;
    if (resultObject.errorReportAvailable === true) {
        return true;
    }
    const partialSummary = resultObject.partialSummary;
    if (!partialSummary || typeof partialSummary !== 'object') {
        return false;
    }
    const rejectedRows = Number(partialSummary.rejectedRows ?? 0);
    return Number.isFinite(rejectedRows) && rejectedRows > 0;
}
function createWhereConditions(filters) {
    const conditions = [];
    if (filters.pharmacyId) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.pharmacyId, filters.pharmacyId));
    }
    if (filters.status) {
        if (filters.status === 'canceled') {
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.isNotNull)(schema_1.uploadConfirmJobs.cancelRequestedAt), (0, drizzle_orm_1.isNotNull)(schema_1.uploadConfirmJobs.canceledAt)));
        }
        else {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, filters.status));
            conditions.push((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.cancelRequestedAt));
            conditions.push((0, drizzle_orm_1.isNull)(schema_1.uploadConfirmJobs.canceledAt));
        }
    }
    if (filters.uploadType) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.uploadType, filters.uploadType));
    }
    if (filters.applyMode) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.applyMode, filters.applyMode));
    }
    if (filters.keyword) {
        const keywordLike = `%${filters.keyword}%`;
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.uploadConfirmJobs.originalFilename, keywordLike), (0, drizzle_orm_1.ilike)(schema_1.uploadConfirmJobs.lastError, keywordLike), (0, drizzle_orm_1.sql) `exists (
        select 1
        from ${schema_1.pharmacies}
        where ${schema_1.pharmacies.id} = ${schema_1.uploadConfirmJobs.pharmacyId}
          and ${schema_1.pharmacies.name} ilike ${keywordLike}
      )`));
    }
    return conditions;
}
async function listAdminUploadJobs(filters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereConditions = createWhereConditions(filters);
    const whereClause = whereConditions.length > 0 ? (0, drizzle_orm_1.and)(...whereConditions) : undefined;
    const rows = await database_1.db.select({
        id: schema_1.uploadConfirmJobs.id,
        pharmacyId: schema_1.uploadConfirmJobs.pharmacyId,
        uploadType: schema_1.uploadConfirmJobs.uploadType,
        originalFilename: schema_1.uploadConfirmJobs.originalFilename,
        status: schema_1.uploadConfirmJobs.status,
        applyMode: schema_1.uploadConfirmJobs.applyMode,
        attempts: schema_1.uploadConfirmJobs.attempts,
        deduplicated: schema_1.uploadConfirmJobs.deduplicated,
        cancelRequestedAt: schema_1.uploadConfirmJobs.cancelRequestedAt,
        canceledAt: schema_1.uploadConfirmJobs.canceledAt,
        resultJson: schema_1.uploadConfirmJobs.resultJson,
        createdAt: schema_1.uploadConfirmJobs.createdAt,
        updatedAt: schema_1.uploadConfirmJobs.updatedAt,
        completedAt: schema_1.uploadConfirmJobs.completedAt,
    })
        .from(schema_1.uploadConfirmJobs)
        .where(whereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.uploadConfirmJobs.createdAt), (0, drizzle_orm_1.desc)(schema_1.uploadConfirmJobs.id))
        .limit(filters.limit)
        .offset(offset);
    const [totalRow] = await database_1.db.select({
        count: db_utils_1.rowCount,
    })
        .from(schema_1.uploadConfirmJobs)
        .where(whereClause);
    const pharmacyIds = [...new Set(rows.map((row) => row.pharmacyId))];
    const pharmacyRows = pharmacyIds.length > 0
        ? await database_1.db.select({
            id: schema_1.pharmacies.id,
            name: schema_1.pharmacies.name,
        })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, pharmacyIds))
        : [];
    const pharmacyMap = new Map(pharmacyRows.map((row) => [row.id, row.name]));
    const issueCountMap = await (0, upload_row_issue_service_1.getUploadRowIssueCountByJobIds)(rows.map((row) => row.id));
    const data = rows.map((row) => {
        const result = parseResultJson(row.resultJson);
        const partialSummary = extractPartialSummary(result);
        const issueCount = issueCountMap.get(row.id) ?? 0;
        const resolvedStatus = resolveUploadJobStatus(row.status, row.cancelRequestedAt, row.canceledAt);
        const cancelable = (row.status === 'pending' || row.status === 'processing')
            && !row.cancelRequestedAt
            && !row.canceledAt;
        return {
            id: row.id,
            pharmacyId: row.pharmacyId,
            pharmacyName: pharmacyMap.get(row.pharmacyId) ?? null,
            uploadType: row.uploadType,
            originalFilename: row.originalFilename,
            status: resolvedStatus,
            applyMode: row.applyMode,
            attempts: row.attempts,
            deduplicated: row.deduplicated,
            cancelable,
            canceledAt: row.canceledAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            completedAt: row.completedAt,
            partialSummary,
            errorReportAvailable: resolveErrorReportAvailable(issueCount, result),
        };
    });
    return {
        data,
        total: totalRow?.count ?? 0,
    };
}
async function getAdminUploadJobDetail(jobId) {
    const job = await (0, upload_confirm_job_service_1.getUploadConfirmJobById)(jobId);
    if (!job)
        return null;
    const [pharmacy] = await database_1.db.select({
        name: schema_1.pharmacies.name,
    })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, job.pharmacyId))
        .limit(1);
    const result = parseResultJson(job.resultJson);
    const partialSummary = extractPartialSummary(result);
    const resolvedStatus = resolveUploadJobStatus(job.status, job.cancelRequestedAt, job.canceledAt);
    return {
        id: job.id,
        pharmacyId: job.pharmacyId,
        pharmacyName: pharmacy?.name ?? null,
        uploadType: job.uploadType,
        originalFilename: job.originalFilename,
        status: resolvedStatus,
        applyMode: job.applyMode,
        attempts: job.attempts,
        deduplicated: job.deduplicated,
        cancelable: job.cancelable,
        canceledAt: job.canceledAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        partialSummary,
        errorReportAvailable: resolveErrorReportAvailable(job.issueCount, result),
        idempotencyKey: job.idempotencyKey,
        fileHash: job.fileHash,
        deleteMissing: job.deleteMissing,
        lastError: job.lastError,
        result,
        issueCount: job.issueCount,
    };
}
async function cancelAdminUploadJob(jobId, adminPharmacyId) {
    return (0, upload_confirm_job_service_1.cancelUploadConfirmJobByAdmin)(jobId, adminPharmacyId);
}
async function retryAdminUploadJob(jobId) {
    return (0, upload_confirm_job_service_1.retryUploadConfirmJobByAdmin)(jobId);
}
async function getAdminUploadJobErrorReport(jobId, format) {
    const issues = await (0, upload_row_issue_service_1.getUploadRowIssuesForJob)(jobId);
    if (issues.length === 0) {
        return null;
    }
    const summary = await (0, upload_row_issue_service_1.getUploadRowIssueSummary)(jobId);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    if (format === 'json') {
        return {
            filename: `upload-job-${jobId}-error-report-${timestamp}.json`,
            contentType: 'application/json; charset=utf-8',
            body: JSON.stringify({
                jobId,
                issueCount: issues.length,
                summary,
                issues,
            }, null, 2),
            issueCount: issues.length,
        };
    }
    return {
        filename: `upload-job-${jobId}-error-report-${timestamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        body: (0, upload_row_issue_service_1.buildUploadRowIssueCsv)(issues),
        issueCount: issues.length,
    };
}
//# sourceMappingURL=admin-upload-job-service.js.map