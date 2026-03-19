"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_utils_1 = require("./admin-utils");
const admin_upload_job_service_1 = require("../services/admin-upload-job-service");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
const VALID_UPLOAD_JOB_STATUSES = ['pending', 'processing', 'completed', 'failed', 'canceled'];
const VALID_UPLOAD_TYPES = ['dead_stock', 'used_medication'];
const VALID_APPLY_MODES = ['replace', 'diff', 'partial'];
function parseOptionalPositiveInt(value) {
    if (typeof value !== 'string')
        return undefined;
    if (!/^\d+$/.test(value.trim()))
        return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0)
        return undefined;
    return parsed;
}
function parseUploadJobFilters(req) {
    const { page, limit } = (0, admin_utils_1.parseListPagination)(req, 50);
    const statusRaw = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const uploadTypeRaw = typeof req.query.uploadType === 'string' ? req.query.uploadType.trim() : '';
    const applyModeRaw = typeof req.query.applyMode === 'string' ? req.query.applyMode.trim() : '';
    const keywordRaw = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
    const normalizedStatusRaw = statusRaw === 'cancelled' ? 'canceled' : statusRaw;
    const filters = {
        page,
        limit,
    };
    if (VALID_UPLOAD_JOB_STATUSES.includes(normalizedStatusRaw)) {
        filters.status = normalizedStatusRaw;
    }
    if (VALID_UPLOAD_TYPES.includes(uploadTypeRaw)) {
        filters.uploadType = uploadTypeRaw;
    }
    if (VALID_APPLY_MODES.includes(applyModeRaw)) {
        filters.applyMode = applyModeRaw;
    }
    const pharmacyId = parseOptionalPositiveInt(req.query.pharmacyId);
    if (pharmacyId) {
        filters.pharmacyId = pharmacyId;
    }
    if (keywordRaw.length > 0) {
        filters.keyword = keywordRaw.slice(0, 100);
    }
    return filters;
}
router.get('/upload-jobs', async (req, res) => {
    try {
        const filters = parseUploadJobFilters(req);
        const { data, total } = await (0, admin_upload_job_service_1.listAdminUploadJobs)(filters);
        (0, admin_utils_1.sendPaginated)(res, data, filters.page, filters.limit, total, {
            filters: {
                status: filters.status ?? null,
                uploadType: filters.uploadType ?? null,
                applyMode: filters.applyMode ?? null,
                pharmacyId: filters.pharmacyId ?? null,
                keyword: filters.keyword ?? null,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('Admin upload jobs list error', { error: (0, admin_utils_1.getErrorMessage)(err) });
        res.status(500).json({ error: 'アップロードジョブ一覧の取得に失敗しました' });
    }
});
router.get('/upload-jobs/:id', async (req, res) => {
    try {
        const jobId = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.id);
        if (!jobId)
            return;
        const detail = await (0, admin_upload_job_service_1.getAdminUploadJobDetail)(jobId);
        if (!detail) {
            res.status(404).json({ error: 'ジョブが見つかりません' });
            return;
        }
        res.json(detail);
    }
    catch (err) {
        logger_1.logger.error('Admin upload job detail error', { error: (0, admin_utils_1.getErrorMessage)(err) });
        res.status(500).json({ error: 'アップロードジョブ詳細の取得に失敗しました' });
    }
});
router.patch('/upload-jobs/:id/cancel', async (req, res) => {
    try {
        const jobId = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.id);
        if (!jobId)
            return;
        const result = await (0, admin_upload_job_service_1.cancelAdminUploadJob)(jobId, req.user.id);
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
            message: result.canceledAt
                ? 'ジョブをキャンセルしました'
                : 'ジョブのキャンセルを受け付けました',
            job: result,
        });
    }
    catch (err) {
        logger_1.logger.error('Admin upload job cancel error', { error: (0, admin_utils_1.getErrorMessage)(err) });
        res.status(500).json({ error: 'アップロードジョブのキャンセルに失敗しました' });
    }
});
router.post('/upload-jobs/:id/retry', async (req, res) => {
    try {
        const jobId = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.id);
        if (!jobId)
            return;
        const retried = await (0, admin_upload_job_service_1.retryAdminUploadJob)(jobId);
        if (!retried) {
            res.status(404).json({ error: 'ジョブが見つかりません' });
            return;
        }
        res.json({
            message: 'ジョブを再試行キューへ戻しました',
            job: retried,
        });
    }
    catch (err) {
        if ((0, admin_upload_job_service_1.isUploadConfirmRetryUnavailableError)(err)) {
            res.status(409).json({ error: err.message, code: err.code });
            return;
        }
        logger_1.logger.error('Admin upload job retry error', { error: (0, admin_utils_1.getErrorMessage)(err) });
        res.status(500).json({ error: 'アップロードジョブの再試行に失敗しました' });
    }
});
router.get('/upload-jobs/:id/error-report', async (req, res) => {
    try {
        const jobId = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.id);
        if (!jobId)
            return;
        const format = req.query.format === 'json' ? 'json' : 'csv';
        const report = await (0, admin_upload_job_service_1.getAdminUploadJobErrorReport)(jobId, format);
        if (!report) {
            res.status(404).json({ error: 'エラーレポートがありません' });
            return;
        }
        res.setHeader('Content-Type', report.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
        res.status(200).send(report.body);
    }
    catch (err) {
        logger_1.logger.error('Admin upload job error report error', { error: (0, admin_utils_1.getErrorMessage)(err) });
        res.status(500).json({ error: 'エラーレポートの生成に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=admin-upload-jobs.js.map