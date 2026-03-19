"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const column_mapper_1 = require("../services/column-mapper");
const upload_service_1 = require("../services/upload-service");
const data_extractor_1 = require("../services/data-extractor");
const drug_master_enrichment_1 = require("../services/drug-master-enrichment");
const logger_1 = require("../services/logger");
const upload_diff_service_1 = require("../services/upload-diff-service");
const upload_confirm_job_service_1 = require("../services/upload-confirm-job-service");
const upload_row_issue_service_1 = require("../services/upload-row-issue-service");
const request_utils_1 = require("../utils/request-utils");
const upload_validation_1 = require("./upload-validation");
const router = (0, express_1.Router)();
function parseApplyMode(raw) {
    if (raw === undefined || raw === null || raw === '')
        return 'replace';
    if (raw === 'replace')
        return 'replace';
    if (raw === 'diff')
        return 'diff';
    if (raw === 'partial')
        return 'partial';
    return null;
}
function parseDeleteMissing(raw) {
    if (typeof raw === 'boolean')
        return raw;
    if (typeof raw === 'string')
        return raw === 'true' || raw === '1';
    return false;
}
function resolvePrefixedJobErrorCode(rawMessage) {
    if (!rawMessage)
        return null;
    const matched = rawMessage.match(/^\[([A-Z0-9_]+)]/);
    if (!matched?.[1])
        return null;
    return matched[1];
}
function mapUploadJobErrorCode(rawMessage) {
    if (!rawMessage)
        return null;
    const prefixedCode = resolvePrefixedJobErrorCode(rawMessage);
    if (prefixedCode)
        return prefixedCode;
    if (/mapping/i.test(rawMessage))
        return 'MAPPING_INVALID';
    if (/ヘッダー行指定が不正/.test(rawMessage))
        return 'HEADER_ROW_INVALID';
    if (/上限\(/.test(rawMessage))
        return 'FILE_LIMIT_EXCEEDED';
    if (/ファイルの解析/.test(rawMessage))
        return 'FILE_PARSE_FAILED';
    if (/キャンセル/.test(rawMessage))
        return 'JOB_CANCELED';
    return 'UPLOAD_CONFIRM_FAILED';
}
function toPublicUploadJobError(rawMessage) {
    const code = mapUploadJobErrorCode(rawMessage);
    if (!code) {
        return { code: null, message: null };
    }
    if (code === 'MAPPING_INVALID') {
        return { code, message: 'カラム割り当ての設定が不正です。設定を見直して再実行してください。' };
    }
    if (code === 'HEADER_ROW_INVALID') {
        return { code, message: 'ヘッダー行の指定が不正です。設定を見直して再実行してください。' };
    }
    if (code === 'FILE_LIMIT_EXCEEDED' || code === 'FILE_PARSE_FAILED') {
        return { code, message: 'アップロードファイルを解析できませんでした。ファイル形式と内容を確認してください。' };
    }
    if (code === 'STALE_JOB_SKIPPED') {
        return { code, message: 'より新しいアップロードが既に反映されているため、この処理はスキップされました。' };
    }
    if (code === 'JOB_CANCELED') {
        return { code, message: 'このジョブは管理者によりキャンセルされました。' };
    }
    return { code, message: 'アップロード処理に失敗しました。時間をおいて再実行してください。' };
}
const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9:_.-]{8,120}$/;
function parseIdempotencyKey(raw) {
    if (raw === undefined || raw === null || raw === '')
        return null;
    if (typeof raw !== 'string')
        return undefined;
    const normalized = raw.trim();
    if (!IDEMPOTENCY_KEY_PATTERN.test(normalized))
        return undefined;
    return normalized;
}
async function loadMappingTemplatesByHeaderHash(pharmacyId, headerHash) {
    return database_1.db.select({
        uploadType: schema_1.columnMappingTemplates.uploadType,
        mapping: schema_1.columnMappingTemplates.mapping,
        createdAt: schema_1.columnMappingTemplates.createdAt,
    })
        .from(schema_1.columnMappingTemplates)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.columnMappingTemplates.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.columnMappingTemplates.headerHash, headerHash)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.columnMappingTemplates.createdAt), (0, drizzle_orm_1.desc)(schema_1.columnMappingTemplates.id));
}
function findTemplateByUploadType(templates, uploadType) {
    return templates.find((template) => template.uploadType === uploadType);
}
function resolveMappingFromRequestOrAuto(rawMapping, uploadType, headerRow, savedMappingRaw) {
    if (typeof rawMapping === 'string' && rawMapping.trim() !== '') {
        return (0, upload_validation_1.parseMapping)(rawMapping, uploadType);
    }
    const suggestedMapping = (0, upload_validation_1.resolveMappingFromTemplate)(savedMappingRaw, headerRow, uploadType);
    try {
        return (0, upload_validation_1.parseMapping)(JSON.stringify(suggestedMapping), uploadType);
    }
    catch {
        throw new Error('医薬品列の自動判定に失敗しました。ファイルの見出しを確認してください。');
    }
}
async function resolveAndValidateMappingOrReject(req, res, allRows, headerRowIndex, uploadType, failureContext) {
    const headerRow = allRows[headerRowIndex];
    try {
        let mapping;
        const hasExplicitMapping = typeof req.body.mapping === 'string' && req.body.mapping.trim() !== '';
        if (hasExplicitMapping) {
            mapping = (0, upload_validation_1.parseMapping)(req.body.mapping, uploadType);
        }
        else {
            const headerHash = (0, column_mapper_1.computeHeaderHash)(headerRow);
            const templates = await loadMappingTemplatesByHeaderHash(req.user.id, headerHash);
            const templateForUploadType = findTemplateByUploadType(templates, uploadType);
            mapping = resolveMappingFromRequestOrAuto(req.body.mapping, uploadType, headerRow, templateForUploadType?.mapping);
        }
        (0, upload_validation_1.validateMappingAgainstHeader)(mapping, headerRow);
        return mapping;
    }
    catch (err) {
        if (failureContext) {
            (0, upload_validation_1.logUploadFailure)(req, failureContext, 'invalid_mapping', { error: (0, upload_validation_1.getErrorMessage)(err) });
        }
        res.status(400).json({ error: err instanceof Error ? err.message : 'mapping形式が不正です' });
        return null;
    }
}
// Preview: parse file and return headers + first 5 rows + suggested mapping
router.post('/preview', upload_validation_1.uploadSingleFile, async (req, res) => {
    try {
        const uploadFile = (0, upload_validation_1.getUploadFileOrReject)(req, res);
        if (!uploadFile)
            return;
        const requestedUploadTypeRaw = req.body.uploadType;
        const requestedUploadType = (0, upload_validation_1.parseUploadType)(requestedUploadTypeRaw);
        if (typeof requestedUploadTypeRaw === 'string'
            && requestedUploadTypeRaw.trim() !== ''
            && requestedUploadType === null) {
            res.status(400).json({ error: 'アップロードタイプを指定してください' });
            return;
        }
        const allRows = await (0, upload_validation_1.parseExcelRowsOrReject)(req, res, 'preview', uploadFile.buffer);
        if (!allRows)
            return;
        if (allRows.length === 0) {
            (0, upload_validation_1.logUploadFailure)(req, 'preview', 'empty_file');
            res.status(400).json({ error: 'ファイルにデータがありません' });
            return;
        }
        const headerRowIndex = (0, column_mapper_1.detectHeaderRow)(allRows);
        const headerRow = allRows[headerRowIndex];
        const previewRows = (0, upload_service_1.getPreviewRows)(allRows, headerRowIndex);
        const headerHash = (0, column_mapper_1.computeHeaderHash)(headerRow);
        const templates = await loadMappingTemplatesByHeaderHash(req.user.id, headerHash);
        const detected = (0, column_mapper_1.detectUploadType)(allRows, headerRowIndex);
        const rememberedUploadType = templates[0]?.uploadType ?? null;
        const templateByType = {
            dead_stock: findTemplateByUploadType(templates, 'dead_stock'),
            used_medication: findTemplateByUploadType(templates, 'used_medication'),
        };
        const suggestedByType = {
            dead_stock: (0, upload_validation_1.resolveMappingFromTemplateWithSource)(templateByType.dead_stock?.mapping, headerRow, 'dead_stock'),
            used_medication: (0, upload_validation_1.resolveMappingFromTemplateWithSource)(templateByType.used_medication?.mapping, headerRow, 'used_medication'),
        };
        const validatedByType = {
            dead_stock: (() => {
                try {
                    const parsed = (0, upload_validation_1.parseMapping)(JSON.stringify(suggestedByType.dead_stock.mapping), 'dead_stock');
                    (0, upload_validation_1.validateMappingAgainstHeader)(parsed, headerRow);
                    return parsed;
                }
                catch {
                    return null;
                }
            })(),
            used_medication: (() => {
                try {
                    const parsed = (0, upload_validation_1.parseMapping)(JSON.stringify(suggestedByType.used_medication.mapping), 'used_medication');
                    (0, upload_validation_1.validateMappingAgainstHeader)(parsed, headerRow);
                    return parsed;
                }
                catch {
                    return null;
                }
            })(),
        };
        const preferRemembered = rememberedUploadType !== null
            && (detected.confidence === 'low' || rememberedUploadType === detected.detectedType);
        const autoPrimaryType = preferRemembered ? rememberedUploadType : detected.detectedType;
        const autoFallbackType = autoPrimaryType === 'dead_stock' ? 'used_medication' : 'dead_stock';
        const resolvedUploadType = requestedUploadType
            ?? (validatedByType[autoPrimaryType] ? autoPrimaryType : autoFallbackType);
        const mapping = validatedByType[resolvedUploadType];
        if (!mapping) {
            (0, upload_validation_1.logUploadFailure)(req, 'preview', 'auto_mapping_failed', {
                resolvedUploadType,
                detectedUploadType: detected.detectedType,
                rememberedUploadType,
            });
            res.status(400).json({ error: '医薬品列の自動判定に失敗しました。ファイルの見出しを確認してください。' });
            return;
        }
        const templateUsedForResolvedType = suggestedByType[resolvedUploadType].fromSavedTemplate;
        res.json({
            headers: headerRow.map((h) => String(h || '')),
            rows: previewRows.map((row) => row.map((cell) => String(cell ?? ''))),
            suggestedMapping: mapping,
            suggestedMappingByType: validatedByType,
            headerRowIndex,
            hasSavedMapping: templateUsedForResolvedType,
            detectedUploadType: detected.detectedType,
            resolvedUploadType,
            rememberedUploadType,
            uploadTypeConfidence: detected.confidence,
            uploadTypeScores: detected.scores,
        });
    }
    catch (err) {
        logger_1.logger.error('Upload preview error', () => ({
            ...(0, upload_validation_1.getBaseContext)(req),
            error: (0, upload_validation_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        (0, upload_validation_1.logUploadFailure)(req, 'preview', 'unexpected_error', { error: (0, upload_validation_1.getErrorMessage)(err) });
        res.status(500).json({ error: 'ファイルの解析に失敗しました' });
    }
});
// Diff preview: compare incoming rows with current rows without writing DB.
router.post('/diff-preview', upload_validation_1.uploadSingleFile, async (req, res) => {
    try {
        const uploadFile = (0, upload_validation_1.getUploadFileOrReject)(req, res);
        if (!uploadFile)
            return;
        const uploadType = (0, upload_validation_1.getUploadTypeOrReject)(req, res);
        if (!uploadType)
            return;
        const applyMode = parseApplyMode(req.body.applyMode);
        if (!applyMode) {
            res.status(400).json({ error: 'applyMode は replace / diff / partial を指定してください' });
            return;
        }
        if (applyMode !== 'diff') {
            res.status(400).json({ error: '差分プレビューは applyMode=diff のときのみ利用できます' });
            return;
        }
        const headerRowIndex = (0, upload_validation_1.parseHeaderRowIndexOrReject)(req, res);
        if (headerRowIndex === null)
            return;
        const allRows = await (0, upload_validation_1.parseExcelRowsOrReject)(req, res, 'preview', uploadFile.buffer);
        if (!allRows)
            return;
        if (headerRowIndex >= allRows.length) {
            res.status(400).json({ error: 'ヘッダー行指定が不正です' });
            return;
        }
        const mapping = await resolveAndValidateMappingOrReject(req, res, allRows, headerRowIndex, uploadType);
        if (!mapping)
            return;
        const dataStartIndex = headerRowIndex + 1;
        const deleteMissing = parseDeleteMissing(req.body.deleteMissing);
        const pharmacyId = req.user.id;
        const deadStockExtracted = uploadType === 'dead_stock'
            ? (0, data_extractor_1.extractDeadStockRows)(allRows, mapping, dataStartIndex)
            : null;
        const usedMedicationExtracted = uploadType === 'used_medication'
            ? (0, data_extractor_1.extractUsedMedicationRows)(allRows, mapping, dataStartIndex)
            : null;
        const enrichedDeadStock = deadStockExtracted
            ? await (0, drug_master_enrichment_1.enrichWithDrugMaster)(deadStockExtracted, 'dead_stock')
            : null;
        const enrichedUsedMedication = usedMedicationExtracted
            ? await (0, drug_master_enrichment_1.enrichWithDrugMaster)(usedMedicationExtracted, 'used_medication')
            : null;
        const summary = uploadType === 'dead_stock'
            ? await (0, upload_diff_service_1.previewDeadStockDiff)(pharmacyId, (enrichedDeadStock ?? deadStockExtracted) ?? [], { deleteMissing })
            : await (0, upload_diff_service_1.previewUsedMedicationDiff)(pharmacyId, (enrichedUsedMedication ?? usedMedicationExtracted) ?? [], { deleteMissing });
        res.json({
            applyMode: 'diff',
            uploadType,
            deleteMissing,
            summary,
        });
    }
    catch (err) {
        logger_1.logger.error('Upload diff preview error', () => ({
            ...(0, upload_validation_1.getBaseContext)(req),
            error: (0, upload_validation_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        res.status(500).json({ error: '差分プレビューの生成に失敗しました' });
    }
});
async function handleConfirmAsyncEnqueue(req, res, routeKind) {
    const confirmRequestedAt = new Date().toISOString();
    const failureContext = routeKind === 'confirm' ? 'confirm_legacy' : 'confirm_async';
    try {
        const uploadFile = (0, upload_validation_1.getUploadFileOrReject)(req, res);
        if (!uploadFile)
            return;
        const uploadType = (0, upload_validation_1.getUploadTypeOrReject)(req, res);
        if (!uploadType)
            return;
        const applyMode = parseApplyMode(req.body.applyMode);
        if (!applyMode) {
            (0, upload_validation_1.logUploadFailure)(req, failureContext, 'invalid_apply_mode', {
                applyMode: String(req.body.applyMode ?? ''),
            });
            res.status(400).json({ error: 'applyMode は replace / diff / partial を指定してください' });
            return;
        }
        const idempotencyKey = parseIdempotencyKey(req.body.idempotencyKey);
        if (idempotencyKey === undefined) {
            res.status(400).json({ error: 'idempotencyKey は 8-120文字の英数字記号（: _ - .）で指定してください' });
            return;
        }
        const headerRowIndex = (0, upload_validation_1.parseHeaderRowIndexOrReject)(req, res);
        if (headerRowIndex === null)
            return;
        const allRows = await (0, upload_validation_1.parseExcelRowsOrReject)(req, res, 'confirm', uploadFile.buffer);
        if (!allRows)
            return;
        if (headerRowIndex >= allRows.length) {
            (0, upload_validation_1.logUploadFailure)(req, failureContext, 'header_row_out_of_range', {
                headerRowIndex,
                rowCount: allRows.length,
            });
            res.status(400).json({ error: 'ヘッダー行指定が不正です' });
            return;
        }
        const mapping = await resolveAndValidateMappingOrReject(req, res, allRows, headerRowIndex, uploadType, failureContext);
        if (!mapping)
            return;
        const deleteMissing = parseDeleteMissing(req.body.deleteMissing);
        const pharmacyId = req.user.id;
        const enqueueResult = await (0, upload_confirm_job_service_1.enqueueUploadConfirmJob)({
            pharmacyId,
            uploadType,
            originalFilename: uploadFile.originalname,
            idempotencyKey,
            headerRowIndex,
            mapping,
            applyMode,
            deleteMissing,
            fileBuffer: uploadFile.buffer,
            requestedAtIso: confirmRequestedAt,
        });
        res.status(202).json({
            message: 'アップロード処理を受け付けました',
            jobId: enqueueResult.jobId,
            status: enqueueResult.status,
            deduplicated: enqueueResult.deduplicated,
            cancelable: enqueueResult.cancelable,
            canceledAt: enqueueResult.canceledAt,
            partialSummary: null,
            errorReportAvailable: false,
            ...(routeKind === 'confirm'
                ? {
                    deprecatedEndpoint: true,
                    deprecationNotice: 'このエンドポイントは将来廃止予定です。/api/upload/confirm-async をご利用ください。',
                }
                : {}),
        });
    }
    catch (err) {
        if ((0, upload_confirm_job_service_1.isUploadConfirmIdempotencyConflictError)(err)) {
            res.status(409).json({
                error: err.message,
                code: err.code,
            });
            return;
        }
        if ((0, upload_confirm_job_service_1.isUploadConfirmQueueLimitError)(err)) {
            (0, upload_validation_1.logUploadFailure)(req, failureContext, 'queue_limit', {
                code: err.code,
                limit: err.limit,
                activeJobs: err.activeJobs,
            });
            res.status(429).json({
                error: err.message,
                code: err.code,
                limit: err.limit,
                activeJobs: err.activeJobs,
            });
            return;
        }
        logger_1.logger.error('Upload confirm async enqueue error', () => ({
            ...(0, upload_validation_1.getBaseContext)(req),
            error: (0, upload_validation_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        (0, upload_validation_1.logUploadFailure)(req, failureContext, 'unexpected_error', { error: (0, upload_validation_1.getErrorMessage)(err) });
        res.status(500).json({ error: '非同期アップロード処理の受付に失敗しました' });
    }
}
// Confirm (legacy compatibility): now delegates to async queue processing.
router.post('/confirm', upload_validation_1.uploadSingleFile, async (req, res) => {
    res.set('Deprecation', 'true');
    res.set('Link', '</api/upload/confirm-async>; rel="successor-version"');
    await handleConfirmAsyncEnqueue(req, res, 'confirm');
});
// Confirm (async): enqueue background upload processing job.
router.post('/confirm-async', upload_validation_1.uploadSingleFile, async (req, res) => {
    await handleConfirmAsyncEnqueue(req, res, 'confirm_async');
});
router.get('/jobs/:jobId', async (req, res) => {
    try {
        const jobId = (0, request_utils_1.parsePositiveInt)(req.params.jobId);
        if (jobId === null) {
            res.status(400).json({ error: 'jobIdが不正です' });
            return;
        }
        const row = await (0, upload_confirm_job_service_1.getUploadConfirmJobForPharmacy)(jobId, req.user.id);
        if (!row) {
            res.status(404).json({ error: 'ジョブが見つかりません' });
            return;
        }
        let result = null;
        if (row.resultJson) {
            try {
                result = JSON.parse(row.resultJson);
            }
            catch {
                result = null;
            }
        }
        const publicError = toPublicUploadJobError(row.lastError);
        const parsedResult = result && typeof result === 'object' ? result : null;
        const partialSummary = parsedResult?.partialSummary ?? null;
        const errorReportAvailable = row.issueCount > 0
            || parsedResult?.errorReportAvailable === true
            || (partialSummary !== null
                && typeof partialSummary === 'object'
                && Number(partialSummary.rejectedRows ?? 0) > 0);
        res.json({
            id: row.id,
            status: (row.canceledAt || row.cancelRequestedAt) ? 'canceled' : row.status,
            attempts: row.attempts,
            lastError: publicError.message,
            lastErrorCode: publicError.code,
            result,
            deduplicated: row.deduplicated,
            cancelable: row.cancelable,
            canceledAt: row.canceledAt,
            partialSummary,
            errorReportAvailable,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            completedAt: row.completedAt,
        });
    }
    catch (err) {
        logger_1.logger.error('Upload confirm job status error', () => ({
            ...(0, upload_validation_1.getBaseContext)(req),
            error: (0, upload_validation_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        res.status(500).json({ error: 'ジョブ状態の取得に失敗しました' });
    }
});
router.post('/jobs/:jobId/cancel', async (req, res) => {
    try {
        const jobId = (0, request_utils_1.parsePositiveInt)(req.params.jobId);
        if (jobId === null) {
            res.status(400).json({ error: 'jobIdが不正です' });
            return;
        }
        const result = await (0, upload_confirm_job_service_1.cancelUploadConfirmJobForPharmacy)(jobId, req.user.id);
        if (!result) {
            res.status(404).json({ error: 'ジョブが見つかりません' });
            return;
        }
        if (!result.canceledAt && !result.cancelRequestedAt) {
            res.status(409).json({
                error: result.cancelable
                    ? 'キャンセル要求の反映で競合しました。再度お試しください'
                    : 'このジョブはキャンセルできません',
            });
            return;
        }
        res.json({
            message: result.canceledAt ? 'ジョブをキャンセルしました' : 'ジョブのキャンセルを受け付けました',
            status: result.canceledAt ? 'canceled' : result.status,
            canceledAt: result.canceledAt,
            cancelRequestedAt: result.cancelRequestedAt,
            cancelable: result.cancelable,
        });
    }
    catch (err) {
        logger_1.logger.error('Upload confirm job cancel error', () => ({
            ...(0, upload_validation_1.getBaseContext)(req),
            error: (0, upload_validation_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        res.status(500).json({ error: 'ジョブのキャンセルに失敗しました' });
    }
});
router.get('/jobs/:jobId/error-report', async (req, res) => {
    try {
        const jobId = (0, request_utils_1.parsePositiveInt)(req.params.jobId);
        if (jobId === null) {
            res.status(400).json({ error: 'jobIdが不正です' });
            return;
        }
        const row = await (0, upload_confirm_job_service_1.getUploadConfirmJobForPharmacy)(jobId, req.user.id);
        if (!row) {
            res.status(404).json({ error: 'ジョブが見つかりません' });
            return;
        }
        const issues = await (0, upload_row_issue_service_1.getUploadRowIssuesForJob)(jobId);
        if (issues.length === 0) {
            res.status(404).json({ error: 'エラーレポートがありません' });
            return;
        }
        const format = req.query.format === 'json' ? 'json' : 'csv';
        if (format === 'json') {
            const summary = await (0, upload_row_issue_service_1.getUploadRowIssueSummary)(jobId);
            res.json({
                data: issues,
                summary,
            });
            return;
        }
        const body = (0, upload_row_issue_service_1.buildUploadRowIssueCsv)(issues);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="upload-job-${jobId}-error-report.csv"`);
        res.status(200).send(body);
    }
    catch (err) {
        logger_1.logger.error('Upload confirm job error report error', () => ({
            ...(0, upload_validation_1.getBaseContext)(req),
            error: (0, upload_validation_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        res.status(500).json({ error: 'エラーレポートの取得に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=upload-parser.js.map