"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerManualMonthlyReport = triggerManualMonthlyReport;
exports.startMonthlyReportScheduler = startMonthlyReportScheduler;
exports.stopMonthlyReportScheduler = stopMonthlyReportScheduler;
const logger_1 = require("./logger");
const monthly_report_service_1 = require("./monthly-report-service");
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
let schedulerTimer = null;
let schedulerActive = false;
let lastGeneratedKey = null;
function keyOf(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}
async function runScheduledGeneration(now) {
    const day = now.getUTCDate();
    if (day > 3) {
        return;
    }
    const { year, month } = (0, monthly_report_service_1.resolveDefaultTargetMonth)(now);
    const key = keyOf(year, month);
    if (key === lastGeneratedKey) {
        return;
    }
    try {
        (0, monthly_report_service_1.validateYearMonth)(year, month);
        await (0, monthly_report_service_1.generateMonthlyReport)(year, month, null);
        lastGeneratedKey = key;
        logger_1.logger.info('Monthly report scheduler generated report', { year, month });
    }
    catch (err) {
        logger_1.logger.error('Monthly report scheduler failed', {
            year,
            month,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}
async function triggerManualMonthlyReport(year, month) {
    (0, monthly_report_service_1.validateYearMonth)(year, month);
    await (0, monthly_report_service_1.generateMonthlyReport)(year, month, null);
    lastGeneratedKey = keyOf(year, month);
}
function startMonthlyReportScheduler() {
    if (schedulerActive) {
        logger_1.logger.warn('Monthly report scheduler already running');
        return;
    }
    const enabledRaw = process.env.MONTHLY_REPORT_SCHEDULER_ENABLED?.trim().toLowerCase();
    const enabled = enabledRaw === 'true' || enabledRaw === '1';
    if (!enabled) {
        logger_1.logger.info('Monthly report scheduler is disabled');
        return;
    }
    schedulerActive = true;
    logger_1.logger.info('Monthly report scheduler started', { intervalMs: CHECK_INTERVAL_MS });
    void runScheduledGeneration(new Date());
    schedulerTimer = setInterval(() => {
        void runScheduledGeneration(new Date());
    }, CHECK_INTERVAL_MS);
    schedulerTimer.unref();
}
function stopMonthlyReportScheduler() {
    schedulerActive = false;
    if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
    }
    logger_1.logger.info('Monthly report scheduler stopped');
}
//# sourceMappingURL=monthly-report-scheduler.js.map