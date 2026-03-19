"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictive_alert_service_1 = require("../services/predictive-alert-service");
const logger_1 = require("../services/logger");
const internal_cron_auth_1 = require("./internal-cron-auth");
const number_utils_1 = require("../utils/number-utils");
const router = (0, express_1.Router)();
const DEFAULT_NEAR_EXPIRY_DAYS = 45;
const DEFAULT_EXCESS_STOCK_MONTHS = 3;
async function handleRun(req, res) {
    try {
        const authHeader = typeof req.headers.authorization === 'string'
            ? req.headers.authorization
            : undefined;
        const configuredSecret = process.env.PREDICTIVE_ALERTS_CRON_SECRET?.trim();
        const secret = configuredSecret && configuredSecret.length > 0 ? configuredSecret : null;
        if (!secret) {
            logger_1.logger.error('Predictive alerts cron secret is not configured');
            res.status(503).json({ error: 'predictive alerts cron is not configured' });
            return;
        }
        if (!(0, internal_cron_auth_1.isAuthorizedCron)(authHeader, secret)) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        const nearExpiryDaysRaw = typeof req.query.nearExpiryDays === 'string' ? req.query.nearExpiryDays : undefined;
        const excessStockMonthsRaw = typeof req.query.excessStockMonths === 'string' ? req.query.excessStockMonths : undefined;
        const nearExpiryDays = (0, number_utils_1.parseBoundedInt)(nearExpiryDaysRaw, DEFAULT_NEAR_EXPIRY_DAYS, 1, 180);
        const excessStockMonths = (0, number_utils_1.parseBoundedInt)(excessStockMonthsRaw, DEFAULT_EXCESS_STOCK_MONTHS, 1, 12);
        const result = await (0, predictive_alert_service_1.runPredictiveAlertsJob)({
            nearExpiryDays,
            excessStockMonths,
        });
        logger_1.logger.info('Predictive alerts job completed', {
            nearExpiryDays,
            excessStockMonths,
            ...result,
            method: req.method,
        });
        res.json({ message: 'ok', ...result });
    }
    catch (err) {
        logger_1.logger.error('Predictive alerts run failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'predictive alerts run failed' });
    }
}
router.get('/run', handleRun);
router.post('/run', handleRun);
exports.default = router;
//# sourceMappingURL=internal-predictive-alerts.js.map