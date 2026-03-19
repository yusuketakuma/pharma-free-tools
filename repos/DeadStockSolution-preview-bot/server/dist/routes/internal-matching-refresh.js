"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matching_refresh_service_1 = require("../services/matching-refresh-service");
const logger_1 = require("../services/logger");
const internal_cron_auth_1 = require("./internal-cron-auth");
const router = (0, express_1.Router)();
router.get('/retry', async (req, res) => {
    try {
        const authHeader = typeof req.headers.authorization === 'string'
            ? req.headers.authorization
            : undefined;
        const secret = (0, internal_cron_auth_1.resolveCronSecret)('MATCHING_REFRESH_CRON_SECRET');
        if (!secret) {
            logger_1.logger.error('Matching refresh cron secret is not configured');
            res.status(503).json({ error: 'matching refresh cron is not configured' });
            return;
        }
        if (!(0, internal_cron_auth_1.isAuthorizedCron)(authHeader, secret)) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        const processed = await (0, matching_refresh_service_1.processPendingMatchingRefreshJobs)(20);
        res.json({ message: 'ok', processed });
    }
    catch (err) {
        logger_1.logger.error('Matching refresh cron retry failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'matching refresh retry failed' });
    }
});
exports.default = router;
//# sourceMappingURL=internal-matching-refresh.js.map