"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const drug_master_scheduler_1 = require("./services/drug-master-scheduler");
const drug_package_scheduler_1 = require("./services/drug-package-scheduler");
const import_failure_alert_scheduler_1 = require("./services/import-failure-alert-scheduler");
const matching_refresh_scheduler_1 = require("./services/matching-refresh-scheduler");
const monthly_report_scheduler_1 = require("./services/monthly-report-scheduler");
const monitoring_kpi_alert_scheduler_1 = require("./services/monitoring-kpi-alert-scheduler");
const logger_1 = require("./services/logger");
const system_event_service_1 = require("./services/system-event-service");
function resolvePort() {
    const parsed = Number(process.env.PORT);
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
        return parsed;
    }
    return 3001;
}
const PORT = resolvePort();
const SHUTDOWN_TIMEOUT_MS = 10000;
const server = app_1.default.listen(PORT, () => {
    logger_1.logger.info('Server started', { port: PORT });
    // 医薬品マスター自動同期スケジューラを開始
    (0, drug_master_scheduler_1.startDrugMasterScheduler)();
    (0, drug_package_scheduler_1.startDrugPackageScheduler)();
    (0, import_failure_alert_scheduler_1.startImportFailureAlertScheduler)();
    (0, matching_refresh_scheduler_1.startMatchingRefreshScheduler)();
    (0, monthly_report_scheduler_1.startMonthlyReportScheduler)();
    (0, monitoring_kpi_alert_scheduler_1.startMonitoringKpiAlertScheduler)();
});
function gracefulShutdown(signal) {
    logger_1.logger.info('Graceful shutdown started', { signal });
    // 医薬品マスター自動同期スケジューラを停止
    (0, drug_master_scheduler_1.stopDrugMasterScheduler)();
    (0, drug_package_scheduler_1.stopDrugPackageScheduler)();
    (0, import_failure_alert_scheduler_1.stopImportFailureAlertScheduler)();
    (0, matching_refresh_scheduler_1.stopMatchingRefreshScheduler)();
    (0, monthly_report_scheduler_1.stopMonthlyReportScheduler)();
    (0, monitoring_kpi_alert_scheduler_1.stopMonitoringKpiAlertScheduler)();
    const forceCloseTimer = setTimeout(() => {
        logger_1.logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceCloseTimer.unref();
    server.close((err) => {
        clearTimeout(forceCloseTimer);
        if (err) {
            logger_1.logger.error('Error during server close', {
                error: err instanceof Error ? err.message : String(err),
            });
            process.exit(1);
            return;
        }
        logger_1.logger.info('Server stopped');
        process.exit(0);
    });
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
    });
    void (0, system_event_service_1.recordUnhandledRejection)(reason);
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Uncaught exception', {
        error: err instanceof Error ? err.message : String(err),
        stack: err.stack,
    });
    void (0, system_event_service_1.recordUncaughtException)(err);
    gracefulShutdown('SIGTERM');
});
//# sourceMappingURL=server.js.map