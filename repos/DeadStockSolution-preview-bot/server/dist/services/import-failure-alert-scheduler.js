"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportFailureAlertConfig = getImportFailureAlertConfig;
exports.runImportFailureAlertCheck = runImportFailureAlertCheck;
exports.startImportFailureAlertScheduler = startImportFailureAlertScheduler;
exports.stopImportFailureAlertScheduler = stopImportFailureAlertScheduler;
exports.resetImportFailureAlertStateForTests = resetImportFailureAlertStateForTests;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const number_utils_1 = require("../utils/number-utils");
const logger_1 = require("./logger");
const openclaw_auto_handoff_service_1 = require("./openclaw-auto-handoff-service");
const DEFAULT_MONITORED_ACTIONS = ['upload', 'drug_master_sync', 'drug_master_package_upload'];
const DEFAULT_INTERVAL_MINUTES = 5;
const DEFAULT_WINDOW_MINUTES = 30;
const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MINUTES = 60;
const DEFAULT_WEBHOOK_TIMEOUT_MS = 10000;
const SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'SCHEDULER_OPTIMIZED_LOOP_ENABLED';
const IMPORT_FAILURE_ALERT_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'IMPORT_FAILURE_ALERT_SCHEDULER_OPTIMIZED_LOOP_ENABLED';
let schedulerTimer = null;
let schedulerInterval = null;
let schedulerActive = false;
let isRunning = false;
let lastAlertAtMs = 0;
let lastAlertFailureTotal = null;
function isLocalhostHost(hostname) {
    const normalized = hostname.toLowerCase();
    return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}
function normalizeWebhookUrl(webhookUrlRaw) {
    const trimmed = webhookUrlRaw.trim();
    if (!trimmed) {
        return { value: '', error: null };
    }
    let parsed;
    try {
        parsed = new URL(trimmed);
    }
    catch {
        return { value: '', error: 'invalid' };
    }
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:' || (protocol === 'http:' && isLocalhostHost(parsed.hostname))) {
        parsed.search = '';
        parsed.hash = '';
        return { value: parsed.toString(), error: null };
    }
    return { value: '', error: 'insecure' };
}
function parseMonitoredActions(raw) {
    const source = typeof raw === 'string' && raw.trim().length > 0
        ? raw
        : DEFAULT_MONITORED_ACTIONS.join(',');
    const values = source
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    return [...new Set(values)];
}
function formatErrorMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
function isOptimizedLoopEnabledForImportFailureAlertScheduler() {
    const localFlag = process.env[IMPORT_FAILURE_ALERT_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV];
    if (typeof localFlag === 'string' && localFlag.trim().length > 0) {
        return (0, number_utils_1.parseBooleanFlag)(localFlag, true);
    }
    return (0, number_utils_1.parseBooleanFlag)(process.env[SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV], true);
}
function buildFailureWhereClause(windowStartIso, monitoredActions) {
    return (0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.activityLogs.createdAt, windowStartIso), (0, drizzle_orm_1.like)(schema_1.activityLogs.detail, '失敗|%'), (0, drizzle_orm_1.inArray)(schema_1.activityLogs.action, monitoredActions));
}
async function fetchFailureTotal(whereClause) {
    const [failureTotalRow] = await database_1.db.select({ count: db_utils_1.rowCount })
        .from(schema_1.activityLogs)
        .where(whereClause);
    return failureTotalRow?.count ?? 0;
}
async function fetchFailureSummary(whereClause, totalFailures) {
    const failureByActionRows = await database_1.db.select({
        action: schema_1.activityLogs.action,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.activityLogs)
        .where(whereClause)
        .groupBy(schema_1.activityLogs.action);
    const failureReasonExpr = (0, drizzle_orm_1.sql) `coalesce(substring(${schema_1.activityLogs.detail} from 'reason=([^|]+)'), 'unknown')`;
    const failureByReasonRows = await database_1.db.select({
        reason: failureReasonExpr,
        count: db_utils_1.rowCount,
    })
        .from(schema_1.activityLogs)
        .where(whereClause)
        .groupBy(failureReasonExpr)
        .orderBy((0, drizzle_orm_1.sql) `count(*)::int desc`)
        .limit(10);
    const [latestFailure] = await database_1.db.select({
        createdAt: schema_1.activityLogs.createdAt,
    })
        .from(schema_1.activityLogs)
        .where(whereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.activityLogs.createdAt))
        .limit(1);
    return {
        totalFailures,
        latestFailureAt: latestFailure?.createdAt ?? null,
        failureByAction: failureByActionRows.map((row) => ({
            action: row.action,
            count: row.count,
        })),
        failureByReason: failureByReasonRows.map((row) => ({
            reason: row.reason,
            count: row.count,
        })),
    };
}
function buildAlertPayload(config, now, summary) {
    return {
        event: 'import_failure_alert',
        detectedAt: now.toISOString(),
        windowMinutes: config.windowMinutes,
        threshold: config.threshold,
        totalFailures: summary.totalFailures,
        monitoredActions: config.monitoredActions,
        latestFailureAt: summary.latestFailureAt,
        failureByAction: summary.failureByAction,
        failureByReason: summary.failureByReason,
    };
}
function getImportFailureAlertConfig() {
    const normalizedWebhookUrl = normalizeWebhookUrl(process.env.IMPORT_FAILURE_ALERT_WEBHOOK_URL ?? '');
    return {
        enabled: process.env.IMPORT_FAILURE_ALERT_ENABLED === 'true',
        intervalMinutes: (0, number_utils_1.parseBoundedInt)(process.env.IMPORT_FAILURE_ALERT_INTERVAL_MINUTES, DEFAULT_INTERVAL_MINUTES, 1, 24 * 60),
        windowMinutes: (0, number_utils_1.parseBoundedInt)(process.env.IMPORT_FAILURE_ALERT_WINDOW_MINUTES, DEFAULT_WINDOW_MINUTES, 1, 24 * 7),
        threshold: (0, number_utils_1.parseBoundedInt)(process.env.IMPORT_FAILURE_ALERT_THRESHOLD, DEFAULT_FAILURE_THRESHOLD, 1, 10000),
        cooldownMinutes: (0, number_utils_1.parseBoundedInt)(process.env.IMPORT_FAILURE_ALERT_COOLDOWN_MINUTES, DEFAULT_COOLDOWN_MINUTES, 1, 24 * 7),
        monitoredActions: parseMonitoredActions(process.env.IMPORT_FAILURE_ALERT_ACTIONS),
        webhookUrl: normalizedWebhookUrl.value,
        webhookUrlError: normalizedWebhookUrl.error,
        webhookToken: (process.env.IMPORT_FAILURE_ALERT_WEBHOOK_TOKEN ?? '').trim(),
        webhookTimeoutMs: (0, number_utils_1.parseBoundedInt)(process.env.IMPORT_FAILURE_ALERT_WEBHOOK_TIMEOUT_MS, DEFAULT_WEBHOOK_TIMEOUT_MS, 1000, 120000),
    };
}
async function sendAlertWebhook(config, payload) {
    if (!config.webhookUrl || config.webhookUrlError) {
        return false;
    }
    const headers = {
        'Content-Type': 'application/json',
    };
    if (config.webhookToken) {
        headers.Authorization = `Bearer ${config.webhookToken}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.webhookTimeoutMs);
    try {
        const response = await fetch(config.webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        if (!response.ok) {
            logger_1.logger.error('Import failure alert: webhook request failed', {
                status: response.status,
            });
            return false;
        }
        return true;
    }
    catch (err) {
        logger_1.logger.error('Import failure alert: webhook request error', {
            error: formatErrorMessage(err),
        });
        return false;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
async function runImportFailureAlertCheck(config = getImportFailureAlertConfig(), now = new Date()) {
    if (!config.enabled || config.monitoredActions.length === 0) {
        return {
            status: 'disabled',
            totalFailures: 0,
            threshold: config.threshold,
            webhookDelivered: false,
        };
    }
    const nowMs = now.getTime();
    const cooldownMs = config.cooldownMinutes * 60_000;
    if (lastAlertAtMs > 0 && nowMs - lastAlertAtMs < cooldownMs && lastAlertFailureTotal !== null) {
        return {
            status: 'cooldown',
            totalFailures: lastAlertFailureTotal,
            threshold: config.threshold,
            webhookDelivered: false,
        };
    }
    const windowStartIso = new Date(now.getTime() - config.windowMinutes * 60_000).toISOString();
    const whereClause = buildFailureWhereClause(windowStartIso, config.monitoredActions);
    const failureTotal = await fetchFailureTotal(whereClause);
    if (failureTotal < config.threshold) {
        return {
            status: 'below_threshold',
            totalFailures: failureTotal,
            threshold: config.threshold,
            webhookDelivered: false,
        };
    }
    if (lastAlertAtMs > 0 && nowMs - lastAlertAtMs < cooldownMs) {
        return {
            status: 'cooldown',
            totalFailures: failureTotal,
            threshold: config.threshold,
            webhookDelivered: false,
        };
    }
    const summary = await fetchFailureSummary(whereClause, failureTotal);
    const payload = buildAlertPayload(config, now, summary);
    lastAlertAtMs = nowMs;
    lastAlertFailureTotal = summary.totalFailures;
    const webhookDelivered = await sendAlertWebhook(config, payload);
    const autoHandoff = await (0, openclaw_auto_handoff_service_1.handoffImportFailureAlertToOpenClaw)(payload);
    logger_1.logger.warn('Import failure alert: threshold exceeded', {
        totalFailures: failureTotal,
        threshold: config.threshold,
        windowMinutes: config.windowMinutes,
        cooldownMinutes: config.cooldownMinutes,
        webhookDelivered,
        webhookConfigured: Boolean(config.webhookUrl && !config.webhookUrlError),
        openclawAutoHandoffTriggered: autoHandoff.triggered,
        openclawAutoHandoffAccepted: autoHandoff.accepted,
        openclawAutoHandoffRequestId: autoHandoff.requestId,
    });
    return {
        status: 'alerted',
        totalFailures: summary.totalFailures,
        threshold: config.threshold,
        webhookDelivered,
    };
}
async function runScheduledCheck() {
    if (isRunning) {
        logger_1.logger.info('Import failure alert: previous check still running, skipping');
        return;
    }
    isRunning = true;
    const config = getImportFailureAlertConfig();
    try {
        await runImportFailureAlertCheck(config);
    }
    catch (err) {
        logger_1.logger.error('Import failure alert: scheduled check failed', {
            error: formatErrorMessage(err),
        });
    }
    finally {
        isRunning = false;
    }
}
function scheduleNextImportFailureAlertCheck(intervalMs, delayMs) {
    if (!schedulerActive) {
        return;
    }
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
        void runScheduledCheck().finally(() => {
            if (!schedulerActive) {
                return;
            }
            scheduleNextImportFailureAlertCheck(intervalMs, intervalMs);
        });
    }, delayMs);
    schedulerTimer.unref();
}
function startLegacyImportFailureAlertIntervalScheduler(intervalMs) {
    if (!schedulerActive) {
        return;
    }
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
        if (!schedulerActive) {
            return;
        }
        void runScheduledCheck();
    }, Math.min(60_000, intervalMs));
    schedulerTimer.unref();
    schedulerInterval = setInterval(() => {
        if (!schedulerActive) {
            return;
        }
        void runScheduledCheck();
    }, intervalMs);
    schedulerInterval.unref();
}
function clearImportFailureAlertSchedulerHandles() {
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
function startImportFailureAlertScheduler() {
    const config = getImportFailureAlertConfig();
    if (!config.enabled) {
        logger_1.logger.info('Import failure alert: disabled (set IMPORT_FAILURE_ALERT_ENABLED=true to enable)');
        return;
    }
    if (config.monitoredActions.length === 0) {
        logger_1.logger.warn('Import failure alert: no actions configured; scheduler will not start');
        return;
    }
    if (schedulerActive) {
        logger_1.logger.warn('Import failure alert: scheduler already running');
        return;
    }
    if (config.webhookUrlError) {
        logger_1.logger.warn('Import failure alert: webhook URL is invalid; alert is log-only mode', {
            reason: config.webhookUrlError,
        });
    }
    const optimizedLoopEnabled = isOptimizedLoopEnabledForImportFailureAlertScheduler();
    logger_1.logger.info('Import failure alert: starting scheduler', {
        intervalMinutes: config.intervalMinutes,
        windowMinutes: config.windowMinutes,
        threshold: config.threshold,
        cooldownMinutes: config.cooldownMinutes,
        monitoredActions: config.monitoredActions,
        webhookConfigured: Boolean(config.webhookUrl && !config.webhookUrlError),
        loopMode: optimizedLoopEnabled ? 'timeout-chain' : 'legacy-interval',
    });
    const intervalMs = config.intervalMinutes * 60_000;
    schedulerActive = true;
    if (optimizedLoopEnabled) {
        scheduleNextImportFailureAlertCheck(intervalMs, Math.min(60_000, intervalMs));
        return;
    }
    startLegacyImportFailureAlertIntervalScheduler(intervalMs);
}
function stopImportFailureAlertScheduler() {
    const wasActive = schedulerActive || schedulerTimer !== null || schedulerInterval !== null;
    schedulerActive = false;
    clearImportFailureAlertSchedulerHandles();
    if (wasActive) {
        logger_1.logger.info('Import failure alert: scheduler stopped');
    }
}
function resetImportFailureAlertStateForTests() {
    schedulerActive = false;
    clearImportFailureAlertSchedulerHandles();
    lastAlertAtMs = 0;
    lastAlertFailureTotal = null;
    isRunning = false;
}
//# sourceMappingURL=import-failure-alert-scheduler.js.map