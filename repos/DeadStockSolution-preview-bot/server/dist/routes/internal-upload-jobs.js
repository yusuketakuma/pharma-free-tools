"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_confirm_job_service_1 = require("../services/upload-confirm-job-service");
const logger_1 = require("../services/logger");
const internal_cron_auth_1 = require("./internal-cron-auth");
const number_utils_1 = require("../utils/number-utils");
const router = (0, express_1.Router)();
const DEFAULT_PROCESS_LIMIT = 1;
const DEFAULT_CLEANUP_LIMIT = 50;
async function handleRetry(req, res) {
    try {
        const authHeader = typeof req.headers.authorization === 'string'
            ? req.headers.authorization
            : undefined;
        const secret = (0, internal_cron_auth_1.resolveCronSecret)('UPLOAD_JOBS_CRON_SECRET');
        if (!secret) {
            logger_1.logger.error('Upload jobs cron secret is not configured');
            res.status(503).json({ error: 'upload jobs cron is not configured' });
            return;
        }
        if (!(0, internal_cron_auth_1.isAuthorizedCron)(authHeader, secret)) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        const limitStr = typeof req.query.limit === 'string' ? req.query.limit : undefined;
        const cleanupStr = typeof req.query.cleanupLimit === 'string' ? req.query.cleanupLimit : undefined;
        // Enforce strict sequential processing: exactly one job per cron tick.
        const processLimit = (0, number_utils_1.parseBoundedInt)(limitStr, DEFAULT_PROCESS_LIMIT, 1, 1);
        const cleanupLimit = (0, number_utils_1.parseBoundedInt)(cleanupStr, DEFAULT_CLEANUP_LIMIT, 1, 500);
        const processed = await (0, upload_confirm_job_service_1.processPendingUploadConfirmJobs)(processLimit);
        const cleaned = await (0, upload_confirm_job_service_1.cleanupUploadConfirmJobs)(cleanupLimit);
        logger_1.logger.info('Upload jobs cron retry completed', {
            processed,
            cleaned,
            processLimit,
            cleanupLimit,
            method: req.method,
        });
        res.json({ message: 'ok', processed, cleaned });
    }
    catch (err) {
        logger_1.logger.error('Upload jobs cron retry failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'upload jobs retry failed' });
    }
}
router.get('/retry', handleRetry);
router.post('/retry', handleRetry);
exports.default = router;
//# sourceMappingURL=internal-upload-jobs.js.map