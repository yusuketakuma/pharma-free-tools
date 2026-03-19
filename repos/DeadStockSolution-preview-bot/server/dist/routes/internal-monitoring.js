"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../services/logger");
const monitoring_kpi_service_1 = require("../services/monitoring-kpi-service");
const internal_cron_auth_1 = require("./internal-cron-auth");
const number_utils_1 = require("../utils/number-utils");
const router = (0, express_1.Router)();
async function handleKpiSnapshot(req, res) {
    try {
        const authHeader = typeof req.headers.authorization === 'string'
            ? req.headers.authorization
            : undefined;
        const configuredSecret = process.env.MONITORING_CRON_SECRET?.trim();
        const secret = configuredSecret && configuredSecret.length > 0 ? configuredSecret : null;
        if (!secret) {
            logger_1.logger.error('Monitoring cron secret is not configured');
            res.status(503).json({ error: 'monitoring cron is not configured' });
            return;
        }
        if (!(0, internal_cron_auth_1.isAuthorizedCron)(authHeader, secret)) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        const minutesStr = typeof req.query.minutes === 'string' ? req.query.minutes : undefined;
        const minutes = (0, number_utils_1.parseBoundedInt)(minutesStr, 60, 5, 24 * 60);
        const snapshot = await (0, monitoring_kpi_service_1.getMonitoringKpiSnapshot)(minutes);
        res.json(snapshot);
    }
    catch (err) {
        logger_1.logger.error('Monitoring KPI snapshot failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'monitoring snapshot failed' });
    }
}
router.get('/kpis', handleKpiSnapshot);
router.post('/kpis', handleKpiSnapshot);
exports.default = router;
//# sourceMappingURL=internal-monitoring.js.map