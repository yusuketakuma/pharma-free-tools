"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../services/logger");
const monthly_report_scheduler_1 = require("../services/monthly-report-scheduler");
const monthly_report_service_1 = require("../services/monthly-report-service");
const internal_cron_auth_1 = require("./internal-cron-auth");
const router = (0, express_1.Router)();
router.get('/run', async (req, res) => {
    try {
        const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
        const secret = (0, internal_cron_auth_1.resolveCronSecret)('MONTHLY_REPORT_CRON_SECRET');
        if (!secret) {
            logger_1.logger.error('Monthly report cron secret is not configured');
            res.status(503).json({ error: 'monthly report cron is not configured' });
            return;
        }
        if (!(0, internal_cron_auth_1.isAuthorizedCron)(authHeader, secret)) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        const defaultTarget = (0, monthly_report_service_1.resolveDefaultTargetMonth)();
        const year = Number(req.query.year ?? defaultTarget.year);
        const month = Number(req.query.month ?? defaultTarget.month);
        (0, monthly_report_service_1.validateYearMonth)(year, month);
        await (0, monthly_report_scheduler_1.triggerManualMonthlyReport)(year, month);
        res.json({ message: 'ok', year, month });
    }
    catch (err) {
        if (err instanceof Error && err.message.includes('不正')) {
            res.status(400).json({ error: '年月パラメータが不正です' });
            return;
        }
        logger_1.logger.error('Monthly report cron run failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'monthly report run failed' });
    }
});
exports.default = router;
//# sourceMappingURL=internal-monthly-reports.js.map