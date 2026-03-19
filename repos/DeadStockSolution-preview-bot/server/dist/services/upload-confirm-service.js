"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUploadConfirm = runUploadConfirm;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const column_mapper_1 = require("./column-mapper");
const data_extractor_1 = require("./data-extractor");
const drug_master_enrichment_1 = require("./drug-master-enrichment");
const expiry_risk_service_1 = require("./expiry-risk-service");
const matching_refresh_service_1 = require("./matching-refresh-service");
const upload_diff_service_1 = require("./upload-diff-service");
const upload_row_issue_service_1 = require("./upload-row-issue-service");
const INSERT_BATCH_SIZE = 500;
function toNumericText(value) {
    return value !== null ? String(value) : null;
}
function normalizeExpirationDateIso(expirationDate) {
    if (typeof expirationDate !== 'string')
        return null;
    const normalized = expirationDate.replace(/\//g, '-').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}
function extractDrugMasterLinkFields(item) {
    return {
        drugMasterId: item.drugMasterId ?? null,
        drugMasterPackageId: item.drugMasterPackageId ?? null,
        packageLabel: item.packageLabel ?? null,
    };
}
function toTimestampMs(value) {
    if (!value)
        return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function resolveUploadTypeLockKey(uploadType) {
    return uploadType === 'dead_stock' ? 1 : 2;
}
function toDeadStockInsertRow(pharmacyId, uploadId, item) {
    return {
        pharmacyId,
        uploadId,
        drugCode: item.drugCode,
        drugName: item.drugName,
        ...extractDrugMasterLinkFields(item),
        quantity: item.quantity,
        unit: item.unit,
        yakkaUnitPrice: toNumericText(item.yakkaUnitPrice),
        yakkaTotal: toNumericText(item.yakkaTotal),
        expirationDate: item.expirationDate,
        expirationDateIso: normalizeExpirationDateIso(item.expirationDate),
        lotNumber: item.lotNumber,
    };
}
function toUsedMedicationInsertRow(pharmacyId, uploadId, item) {
    return {
        pharmacyId,
        uploadId,
        drugCode: item.drugCode,
        drugName: item.drugName,
        ...extractDrugMasterLinkFields(item),
        monthlyUsage: item.monthlyUsage,
        unit: item.unit,
        yakkaUnitPrice: toNumericText(item.yakkaUnitPrice),
    };
}
async function insertInBatches(totalCount, insertBatch) {
    for (let i = 0; i < totalCount; i += INSERT_BATCH_SIZE) {
        await insertBatch(i, i + INSERT_BATCH_SIZE);
    }
}
function toUploadRowIssueInputs(issues) {
    return issues.map((issue) => ({
        rowNumber: issue.rowNumber,
        issueCode: issue.issueCode,
        issueMessage: issue.issueMessage,
        rowData: issue.rowData,
    }));
}
function buildPartialSummary(inspectedRows, acceptedRows, issues) {
    const issueCounts = {};
    for (const issue of issues) {
        issueCounts[issue.issueCode] = (issueCounts[issue.issueCode] ?? 0) + 1;
    }
    const rejectedRows = issues.length;
    return {
        inspectedRows,
        acceptedRows,
        rejectedRows,
        issueCounts,
    };
}
async function runUploadConfirm(params) {
    const { pharmacyId, uploadType, originalFilename, jobId, headerRowIndex, mapping, allRows, applyMode, deleteMissing, staleGuardCreatedAt = null, } = params;
    if (!Number.isInteger(headerRowIndex) || headerRowIndex < 0 || headerRowIndex >= allRows.length) {
        throw new Error('ヘッダー行指定が不正です');
    }
    const headerRow = allRows[headerRowIndex];
    const dataStartIndex = headerRowIndex + 1;
    const headerHash = (0, column_mapper_1.computeHeaderHash)(headerRow);
    const deadStockExtraction = uploadType === 'dead_stock'
        ? (0, data_extractor_1.extractDeadStockRowsWithIssues)(allRows, mapping, dataStartIndex)
        : null;
    const usedMedicationExtraction = uploadType === 'used_medication'
        ? (0, data_extractor_1.extractUsedMedicationRowsWithIssues)(allRows, mapping, dataStartIndex)
        : null;
    const parsedRowCount = deadStockExtraction?.rows.length ?? usedMedicationExtraction?.rows.length ?? 0;
    const extractedIssues = deadStockExtraction?.issues ?? usedMedicationExtraction?.issues ?? [];
    const inspectedRows = deadStockExtraction?.inspectedRowCount ?? usedMedicationExtraction?.inspectedRowCount ?? 0;
    const partialSummary = applyMode === 'partial'
        ? buildPartialSummary(inspectedRows, parsedRowCount, extractedIssues)
        : null;
    const enrichedDeadStock = deadStockExtraction
        ? await (0, drug_master_enrichment_1.enrichWithDrugMaster)(deadStockExtraction.rows, 'dead_stock')
        : null;
    const enrichedUsedMedication = usedMedicationExtraction
        ? await (0, drug_master_enrichment_1.enrichWithDrugMaster)(usedMedicationExtraction.rows, 'used_medication')
        : null;
    const requestedAtIso = staleGuardCreatedAt ?? new Date().toISOString();
    const mappingJson = JSON.stringify(mapping);
    return database_1.db.transaction(async (tx) => {
        await tx.execute((0, drizzle_orm_1.sql) `SELECT pg_advisory_xact_lock(${pharmacyId}, ${resolveUploadTypeLockKey(uploadType)})`);
        if (staleGuardCreatedAt) {
            const staleGuardMs = toTimestampMs(staleGuardCreatedAt);
            if (staleGuardMs !== null) {
                const [latestUpload] = await tx.select({
                    id: schema_1.uploads.id,
                    requestedAt: schema_1.uploads.requestedAt,
                })
                    .from(schema_1.uploads)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.uploads.uploadType, uploadType)))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.uploads.requestedAt), (0, drizzle_orm_1.desc)(schema_1.uploads.id))
                    .limit(1);
                const latestUploadMs = toTimestampMs(latestUpload?.requestedAt ?? null);
                if (latestUploadMs !== null && latestUploadMs >= staleGuardMs) {
                    throw new Error('[STALE_JOB_SKIPPED] より新しいアップロードが既に反映されているため、このジョブはスキップされました');
                }
            }
        }
        if (jobId) {
            if (applyMode === 'partial') {
                await (0, upload_row_issue_service_1.replaceUploadRowIssuesForJob)(jobId, pharmacyId, uploadType, toUploadRowIssueInputs(extractedIssues), tx);
            }
            else {
                await (0, upload_row_issue_service_1.clearUploadRowIssuesForJob)(jobId, tx);
            }
        }
        const [uploadRecord] = await tx.insert(schema_1.uploads).values({
            pharmacyId,
            uploadType,
            originalFilename,
            columnMapping: mappingJson,
            rowCount: 0,
            requestedAt: requestedAtIso,
        }).returning({ id: schema_1.uploads.id });
        let diffSummary = null;
        if (uploadType === 'dead_stock') {
            const sourceRows = (enrichedDeadStock ?? deadStockExtraction?.rows) ?? [];
            if (applyMode === 'replace' || applyMode === 'partial') {
                await tx.delete(schema_1.deadStockItems).where((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, pharmacyId));
                if (sourceRows.length > 0) {
                    const insertRows = sourceRows.map((item) => toDeadStockInsertRow(pharmacyId, uploadRecord.id, item));
                    await insertInBatches(insertRows.length, async (start, end) => tx.insert(schema_1.deadStockItems).values(insertRows.slice(start, end)));
                }
            }
            else {
                diffSummary = await (0, upload_diff_service_1.applyDeadStockDiff)(tx, pharmacyId, uploadRecord.id, sourceRows, { deleteMissing });
            }
        }
        else {
            const sourceRows = (enrichedUsedMedication ?? usedMedicationExtraction?.rows) ?? [];
            if (applyMode === 'replace' || applyMode === 'partial') {
                await tx.delete(schema_1.usedMedicationItems).where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, pharmacyId));
                if (sourceRows.length > 0) {
                    const insertRows = sourceRows.map((item) => toUsedMedicationInsertRow(pharmacyId, uploadRecord.id, item));
                    await insertInBatches(insertRows.length, async (start, end) => tx.insert(schema_1.usedMedicationItems).values(insertRows.slice(start, end)));
                }
            }
            else {
                diffSummary = await (0, upload_diff_service_1.applyUsedMedicationDiff)(tx, pharmacyId, uploadRecord.id, sourceRows, { deleteMissing });
            }
        }
        const persistedRowCount = applyMode === 'diff'
            ? diffSummary?.totalIncoming ?? parsedRowCount
            : parsedRowCount;
        await tx.update(schema_1.uploads)
            .set({ rowCount: persistedRowCount })
            .where((0, drizzle_orm_1.eq)(schema_1.uploads.id, uploadRecord.id));
        await tx.insert(schema_1.columnMappingTemplates).values({
            pharmacyId,
            uploadType,
            headerHash,
            mapping: mappingJson,
        }).onConflictDoUpdate({
            target: [
                schema_1.columnMappingTemplates.pharmacyId,
                schema_1.columnMappingTemplates.uploadType,
                schema_1.columnMappingTemplates.headerHash,
            ],
            set: {
                mapping: mappingJson,
                createdAt: (0, drizzle_orm_1.sql) `now()`,
            },
        });
        await (0, matching_refresh_service_1.triggerMatchingRefreshOnUpload)({
            triggerPharmacyId: pharmacyId,
            uploadType,
        }, tx);
        (0, expiry_risk_service_1.invalidateAdminRiskSnapshotCache)();
        return {
            uploadId: uploadRecord.id,
            rowCount: persistedRowCount,
            diffSummary,
            partialSummary,
        };
    });
}
//# sourceMappingURL=upload-confirm-service.js.map