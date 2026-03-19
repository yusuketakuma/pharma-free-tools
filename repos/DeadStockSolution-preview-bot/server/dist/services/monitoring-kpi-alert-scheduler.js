"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMonitoringKpiAlertCheck = runMonitoringKpiAlertCheck;
exports.startMonitoringKpiAlertScheduler = startMonitoringKpiAlertScheduler;
exports.stopMonitoringKpiAlertScheduler = stopMonitoringKpiAlertScheduler;
exports.resetMonitoringKpiAlertSchedulerForTests = resetMonitoringKpiAlertSchedulerForTests;
const child_process_1 = require("child_process");
const util_1 = require("util");
const number_utils_1 = require("../utils/number-utils");
const monitoring_kpi_service_1 = require("./monitoring-kpi-service");
const logger_1 = require("./logger");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const DEFAULT_INTERVAL_MINUTES = 10;
const DEFAULT_WINDOW_MINUTES = 60;
const DEFAULT_COOLDOWN_MINUTES = 30;
const DEFAULT_OPENCLAW_CLI_PATH = 'openclaw';
const DEFAULT_ALERT_CHANNEL = 'telegram';
const DEFAULT_ALERT_TARGET = '';
const SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'SCHEDULER_OPTIMIZED_LOOP_ENABLED';
const MONITORING_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'MONITORING_KPI_ALERT_SCHEDULER_OPTIMIZED_LOOP_ENABLED';
let schedulerTimer = null;
let schedulerInterval = null;
let schedulerActive = false;
let checkRunning = false;
let lastAlertAtMs = 0;
let lastAlertFingerprint = '';
function buildAlertFingerprint(snapshot) {
    return JSON.stringify(snapshot.breaches);
}
function isOptimizedLoopEnabledForMonitoringScheduler() {
    const localFlag = process.env[MONITORING_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV];
    if (typeof localFlag === 'string' && localFlag.trim().length > 0) {
        return (0, number_utils_1.parseBooleanFlag)(localFlag, true);
    }
    return (0, number_utils_1.parseBooleanFlag)(process.env[SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV], true);
}
function readConfig() {
    return {
        enabled: process.env.MONITORING_KPI_ALERT_ENABLED === 'true',
        intervalMinutes: (0, number_utils_1.parseBoundedInt)(process.env.MONITORING_KPI_ALERT_INTERVAL_MINUTES, DEFAULT_INTERVAL_MINUTES, 1, 24 * 60),
        windowMinutes: (0, number_utils_1.parseBoundedInt)(process.env.MONITORING_KPI_ALERT_WINDOW_MINUTES, DEFAULT_WINDOW_MINUTES, 5, 24 * 60),
        cooldownMinutes: (0, number_utils_1.parseBoundedInt)(process.env.MONITORING_KPI_ALERT_COOLDOWN_MINUTES, DEFAULT_COOLDOWN_MINUTES, 1, 24 * 7),
        openclawCliPath: (process.env.MONITORING_KPI_ALERT_OPENCLAW_CLI_PATH ?? DEFAULT_OPENCLAW_CLI_PATH).trim() || DEFAULT_OPENCLAW_CLI_PATH,
        alertChannel: (process.env.MONITORING_KPI_ALERT_CHANNEL ?? DEFAULT_ALERT_CHANNEL).trim() || DEFAULT_ALERT_CHANNEL,
        alertTarget: (process.env.MONITORING_KPI_ALERT_TARGET ?? DEFAULT_ALERT_TARGET).trim() || DEFAULT_ALERT_TARGET,
    };
}
function shouldNotify(config, snapshot, nowMs) {
    if (snapshot.status !== 'warning')
        return false;
    const fingerprint = buildAlertFingerprint(snapshot);
    const cooldownMs = config.cooldownMinutes * 60 * 1000;
    const cooldownActive = nowMs - lastAlertAtMs < cooldownMs;
    if (cooldownActive && lastAlertFingerprint === fingerprint) {
        return false;
    }
    return true;
}
function buildAlertMessage(snapshot) {
    const reasons = [];
    if (snapshot.breaches.errorRate5xx) {
        reasons.push(`5xx率 ${snapshot.metrics.errorRate5xx}% (閾値 ${snapshot.thresholds.errorRate5xx}%)`);
    }
    if (snapshot.breaches.uploadFailureRate) {
        reasons.push(`取込失敗率 ${snapshot.metrics.uploadFailureRate}% (閾値 ${snapshot.thresholds.uploadFailureRate}%)`);
    }
    if (snapshot.breaches.pendingStaleCount) {
        reasons.push(`滞留ジョブ ${snapshot.metrics.pendingUploadStaleCount}件 (閾値 ${snapshot.thresholds.pendingStaleCount}件)`);
    }
    const reasonText = reasons.length > 0 ? reasons.join(' / ') : '異常指標は検出されました';
    return [
        '⚠️ DeadStockSolution 監視アラート',
        reasonText,
        `ウィンドウ: ${snapshot.context.windowMinutes}分`,
        '対応: /admin ダッシュボードの運用KPIを確認',
    ].join('\n');
}
async function sendAlertMessage(config, snapshot) {
    try {
        const message = buildAlertMessage(snapshot);
        await execFileAsync(config.openclawCliPath, [
            'message',
            'send',
            '--channel',
            config.alertChannel,
            '--target',
            config.alertTarget,
            '--message',
            message,
        ], {
            timeout: 15000,
            maxBuffer: 1024 * 1024,
            env: process.env,
        });
        return true;
    }
    catch (err) {
        logger_1.logger.error('Monitoring KPI alert: failed to send alert message', {
            error: err instanceof Error ? err.message : String(err),
            channel: config.alertChannel,
            target: config.alertTarget,
        });
        return false;
    }
}
async function runMonitoringKpiAlertCheck() {
    const config = readConfig();
    if (!config.enabled) {
        return { status: 'disabled', notified: false, snapshot: null };
    }
    try {
        const snapshot = await (0, monitoring_kpi_service_1.getMonitoringKpiSnapshot)(config.windowMinutes);
        const nowMs = Date.now();
        if (snapshot.status !== 'warning') {
            return { status: 'healthy', notified: false, snapshot };
        }
        if (!shouldNotify(config, snapshot, nowMs)) {
            return { status: 'cooldown', notified: false, snapshot };
        }
        const notified = await sendAlertMessage(config, snapshot);
        if (notified) {
            lastAlertAtMs = nowMs;
            lastAlertFingerprint = buildAlertFingerprint(snapshot);
            logger_1.logger.warn('Monitoring KPI alert triggered', {
                status: snapshot.status,
                metrics: snapshot.metrics,
            });
            return { status: 'alerted', notified: true, snapshot };
        }
        return { status: 'failed', notified: false, snapshot };
    }
    catch (err) {
        logger_1.logger.error('Monitoring KPI alert check failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        return { status: 'failed', notified: false, snapshot: null };
    }
}
async function runScheduledCheck() {
    if (checkRunning) {
        logger_1.logger.info('Monitoring KPI alert: previous check still running, skipping');
        return;
    }
    checkRunning = true;
    try {
        await runMonitoringKpiAlertCheck();
    }
    finally {
        checkRunning = false;
    }
}
function scheduleWithTimeoutThenInterval(intervalMs) {
    if (!schedulerActive)
        return;
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    schedulerTimer = setTimeout(() => {
        schedulerTimer = null;
        void runScheduledCheck();
    }, 1500);
    schedulerTimer.unref();
    schedulerInterval = setInterval(() => {
        if (!schedulerActive)
            return;
        void runScheduledCheck();
    }, intervalMs);
    schedulerInterval.unref();
}
function scheduleWithImmediateLoop(intervalMs) {
    if (!schedulerActive)
        return;
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    schedulerTimer = setTimeout(() => {
        schedulerTimer = null;
        if (!schedulerActive)
            return;
        void runScheduledCheck();
    }, 1500);
    schedulerTimer.unref();
    schedulerInterval = setInterval(() => {
        if (!schedulerActive)
            return;
        void runScheduledCheck();
    }, intervalMs);
    schedulerInterval.unref();
}
function startMonitoringKpiAlertScheduler() {
    const config = readConfig();
    if (!config.enabled) {
        logger_1.logger.info('Monitoring KPI alert: disabled (set MONITORING_KPI_ALERT_ENABLED=true to enable)');
        return;
    }
    if (!config.alertTarget) {
        logger_1.logger.warn('Monitoring KPI alert: MONITORING_KPI_ALERT_TARGET is empty; scheduler will not start');
        return;
    }
    if (schedulerActive) {
        logger_1.logger.warn('Monitoring KPI alert: scheduler already running');
        return;
    }
    const intervalMs = config.intervalMinutes * 60 * 1000;
    schedulerActive = true;
    logger_1.logger.info('Monitoring KPI alert: starting scheduler', {
        intervalMinutes: config.intervalMinutes,
        windowMinutes: config.windowMinutes,
        cooldownMinutes: config.cooldownMinutes,
        alertChannel: config.alertChannel,
        alertTarget: config.alertTarget,
    });
    if (isOptimizedLoopEnabledForMonitoringScheduler()) {
        scheduleWithImmediateLoop(intervalMs);
    }
    else {
        scheduleWithTimeoutThenInterval(intervalMs);
    }
}
function stopMonitoringKpiAlertScheduler() {
    const wasActive = schedulerActive || schedulerTimer !== null || schedulerInterval !== null;
    schedulerActive = false;
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    if (wasActive) {
        logger_1.logger.info('Monitoring KPI alert: scheduler stopped');
    }
}
function resetMonitoringKpiAlertSchedulerForTests() {
    schedulerActive = false;
    checkRunning = false;
    lastAlertAtMs = 0;
    lastAlertFingerprint = '';
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
//# sourceMappingURL=monitoring-kpi-alert-scheduler.js.map