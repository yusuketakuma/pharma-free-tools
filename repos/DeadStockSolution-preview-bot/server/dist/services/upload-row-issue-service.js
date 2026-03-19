"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceUploadRowIssuesForJob = replaceUploadRowIssuesForJob;
exports.clearUploadRowIssuesForJob = clearUploadRowIssuesForJob;
exports.getUploadRowIssueCountByJobIds = getUploadRowIssueCountByJobIds;
exports.getUploadRowIssueCountByJobId = getUploadRowIssueCountByJobId;
exports.getUploadRowIssuesForJob = getUploadRowIssuesForJob;
exports.getUploadRowIssueSummary = getUploadRowIssueSummary;
exports.getUploadRowIssueSummaryByJobIds = getUploadRowIssueSummaryByJobIds;
exports.buildUploadRowIssueCsv = buildUploadRowIssueCsv;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const ISSUE_INSERT_BATCH_SIZE = 500;
function safeStringifyRowData(rowData) {
    if (rowData === null)
        return null;
    try {
        return JSON.stringify(rowData);
    }
    catch {
        return null;
    }
}
function quoteCsvField(value) {
    const normalizedValue = /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
    if (/[",\n]/.test(normalizedValue)) {
        return `"${normalizedValue.replace(/"/g, '""')}"`;
    }
    return normalizedValue;
}
async function replaceUploadRowIssuesForJob(jobId, pharmacyId, uploadType, issues, executor = database_1.db) {
    await executor.delete(schema_1.uploadRowIssues).where((0, drizzle_orm_1.eq)(schema_1.uploadRowIssues.jobId, jobId));
    if (issues.length === 0) {
        return;
    }
    const nowIso = new Date().toISOString();
    for (let i = 0; i < issues.length; i += ISSUE_INSERT_BATCH_SIZE) {
        const batch = issues.slice(i, i + ISSUE_INSERT_BATCH_SIZE);
        await executor.insert(schema_1.uploadRowIssues).values(batch.map((issue) => ({
            jobId,
            pharmacyId,
            uploadType,
            rowNumber: issue.rowNumber,
            issueCode: issue.issueCode,
            issueMessage: issue.issueMessage,
            rowDataJson: safeStringifyRowData(issue.rowData),
            createdAt: nowIso,
        })));
    }
}
async function clearUploadRowIssuesForJob(jobId, executor = database_1.db) {
    await executor.delete(schema_1.uploadRowIssues).where((0, drizzle_orm_1.eq)(schema_1.uploadRowIssues.jobId, jobId));
}
async function getUploadRowIssueCountByJobIds(jobIds, executor = database_1.db) {
    if (jobIds.length === 0) {
        return new Map();
    }
    const rows = await executor.select({
        jobId: schema_1.uploadRowIssues.jobId,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.uploadRowIssues)
        .where((0, drizzle_orm_1.inArray)(schema_1.uploadRowIssues.jobId, jobIds))
        .groupBy(schema_1.uploadRowIssues.jobId);
    return new Map(rows.map((row) => [row.jobId, row.count]));
}
async function getUploadRowIssueCountByJobId(jobId, executor = database_1.db) {
    const [row] = await executor.select({
        count: db_utils_1.rowCount,
    })
        .from(schema_1.uploadRowIssues)
        .where((0, drizzle_orm_1.eq)(schema_1.uploadRowIssues.jobId, jobId));
    return row?.count ?? 0;
}
async function getUploadRowIssuesForJob(jobId, options = {}, executor = database_1.db) {
    const limit = Number.isInteger(options.limit) && Number(options.limit) > 0
        ? Number(options.limit)
        : 10000;
    const offset = Number.isInteger(options.offset) && Number(options.offset) >= 0
        ? Number(options.offset)
        : 0;
    return executor.select({
        id: schema_1.uploadRowIssues.id,
        jobId: schema_1.uploadRowIssues.jobId,
        pharmacyId: schema_1.uploadRowIssues.pharmacyId,
        uploadType: schema_1.uploadRowIssues.uploadType,
        rowNumber: schema_1.uploadRowIssues.rowNumber,
        issueCode: schema_1.uploadRowIssues.issueCode,
        issueMessage: schema_1.uploadRowIssues.issueMessage,
        rowDataJson: schema_1.uploadRowIssues.rowDataJson,
        createdAt: schema_1.uploadRowIssues.createdAt,
    })
        .from(schema_1.uploadRowIssues)
        .where((0, drizzle_orm_1.eq)(schema_1.uploadRowIssues.jobId, jobId))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.uploadRowIssues.rowNumber), (0, drizzle_orm_1.asc)(schema_1.uploadRowIssues.id))
        .limit(limit)
        .offset(offset);
}
async function getUploadRowIssueSummary(jobId, executor = database_1.db) {
    const rows = await executor.select({
        issueCode: schema_1.uploadRowIssues.issueCode,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.uploadRowIssues)
        .where((0, drizzle_orm_1.eq)(schema_1.uploadRowIssues.jobId, jobId))
        .groupBy(schema_1.uploadRowIssues.issueCode)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.uploadRowIssues.issueCode));
    const byCode = {};
    let totalIssues = 0;
    for (const row of rows) {
        byCode[row.issueCode] = row.count;
        totalIssues += row.count;
    }
    return {
        totalIssues,
        byCode,
    };
}
async function getUploadRowIssueSummaryByJobIds(jobIds, executor = database_1.db) {
    if (jobIds.length === 0) {
        return new Map();
    }
    const rows = await executor.select({
        jobId: schema_1.uploadRowIssues.jobId,
        issueCode: schema_1.uploadRowIssues.issueCode,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.uploadRowIssues)
        .where((0, drizzle_orm_1.inArray)(schema_1.uploadRowIssues.jobId, jobIds))
        .groupBy(schema_1.uploadRowIssues.jobId, schema_1.uploadRowIssues.issueCode);
    const summaryMap = new Map();
    for (const row of rows) {
        const current = summaryMap.get(row.jobId) ?? { totalIssues: 0, byCode: {} };
        current.byCode[row.issueCode] = row.count;
        current.totalIssues += row.count;
        summaryMap.set(row.jobId, current);
    }
    return summaryMap;
}
function buildUploadRowIssueCsv(issues) {
    const headers = ['rowNumber', 'issueCode', 'issueMessage', 'rowDataJson'];
    const lines = [headers.join(',')];
    for (const issue of issues) {
        lines.push([
            String(issue.rowNumber),
            quoteCsvField(issue.issueCode),
            quoteCsvField(issue.issueMessage),
            quoteCsvField(issue.rowDataJson ?? ''),
        ].join(','));
    }
    return lines.join('\n');
}
//# sourceMappingURL=upload-row-issue-service.js.map