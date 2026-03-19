"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDrugPackageScheduler = startDrugPackageScheduler;
exports.stopDrugPackageScheduler = stopDrugPackageScheduler;
exports.triggerManualPackageAutoSync = triggerManualPackageAutoSync;
const drug_master_service_1 = require("./drug-master-service");
const upload_service_1 = require("./upload-service");
const logger_1 = require("./logger");
const network_utils_1 = require("../utils/network-utils");
const number_utils_1 = require("../utils/number-utils");
const http_utils_1 = require("../utils/http-utils");
const error_handler_1 = require("../middleware/error-handler");
const crypto_utils_1 = require("../utils/crypto-utils");
const drug_master_source_state_service_1 = require("./drug-master-source-state-service");
const mhlw_source_fetch_1 = require("./mhlw-source-fetch");
const CHECK_INTERVAL_HOURS = (0, number_utils_1.parseBoundedInt)(process.env.DRUG_PACKAGE_CHECK_INTERVAL_HOURS, 24, 1, 24 * 30);
const CHECK_INTERVAL_MS = CHECK_INTERVAL_HOURS * 60 * 60 * 1000;
const AUTO_SYNC_ENABLED = process.env.DRUG_PACKAGE_AUTO_SYNC === 'true';
const SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'SCHEDULER_OPTIMIZED_LOOP_ENABLED';
const DRUG_PACKAGE_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'DRUG_PACKAGE_SCHEDULER_OPTIMIZED_LOOP_ENABLED';
const FETCH_RETRIES = (0, number_utils_1.parseBoundedInt)(process.env.DRUG_PACKAGE_FETCH_RETRIES, http_utils_1.MHLW_DEFAULT_FETCH_RETRIES, 0, 5);
function shouldAttachSourceCredentials(requestUrl) {
    const configuredSourceUrl = getConfiguredSourceUrl();
    if (!configuredSourceUrl) {
        return false;
    }
    try {
        const requested = new URL(requestUrl);
        const configured = new URL(configuredSourceUrl);
        return requested.origin === configured.origin && requested.pathname === configured.pathname;
    }
    catch {
        return false;
    }
}
function buildSourceRequestHeaders(requestUrl) {
    const headers = {
        'User-Agent': 'DeadStockSolution-DrugPackageSync/1.0',
    };
    if (!shouldAttachSourceCredentials(requestUrl)) {
        return headers;
    }
    const authorization = process.env.DRUG_PACKAGE_SOURCE_AUTHORIZATION?.trim();
    const cookie = process.env.DRUG_PACKAGE_SOURCE_COOKIE?.trim();
    if (authorization)
        headers.Authorization = authorization;
    if (cookie)
        headers.Cookie = cookie;
    return headers;
}
let schedulerTimer = null;
let schedulerInterval = null;
let schedulerActive = false;
let isRunning = false;
function getConfiguredSourceUrl() {
    return process.env.DRUG_PACKAGE_SOURCE_URL?.trim() || '';
}
async function persistHeaders(sourceUrl, headers, changed) {
    await (0, drug_master_source_state_service_1.persistSourceHeaders)(drug_master_source_state_service_1.SOURCE_KEY_PACKAGE, sourceUrl, headers, changed);
}
function isOptimizedLoopEnabledForDrugPackageScheduler() {
    const localFlag = process.env[DRUG_PACKAGE_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV];
    if (typeof localFlag === 'string' && localFlag.trim().length > 0) {
        return (0, number_utils_1.parseBooleanFlag)(localFlag, true);
    }
    return (0, number_utils_1.parseBooleanFlag)(process.env[SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV], true);
}
async function parseDownloadedPackageRows(sourceUrl, contentType, buffer) {
    const isCsv = contentType?.includes('csv')
        || contentType?.includes('text/plain')
        || sourceUrl.endsWith('.csv');
    const isXml = contentType?.includes('xml') || sourceUrl.endsWith('.xml');
    const isZip = contentType?.includes('zip') || sourceUrl.endsWith('.zip');
    if (isCsv) {
        const csvContent = (0, drug_master_service_1.decodeCsvBuffer)(buffer);
        return (0, drug_master_service_1.parsePackageCsvData)(csvContent);
    }
    if (isXml) {
        const xmlContent = buffer.toString('utf-8');
        return (0, drug_master_service_1.parsePackageXmlData)(xmlContent);
    }
    if (isZip) {
        return (0, drug_master_service_1.parsePackageZipData)(buffer);
    }
    const excelRows = await (0, upload_service_1.parseExcelBuffer)(buffer);
    return (0, drug_master_service_1.parsePackageExcelData)(excelRows);
}
function runPackageAutoSyncSafely(mode, sourceUrl) {
    const task = sourceUrl ? runPackageAutoSyncWithSource(sourceUrl) : runPackageAutoSync();
    return task.catch((err) => {
        const suffix = mode === 'manual' ? 'manual trigger' : `${mode} run`;
        logger_1.logger.error(`Drug package auto-sync: ${suffix} failed`, {
            error: (0, error_handler_1.getErrorMessage)(err),
        });
    });
}
async function runPackageAutoSync() {
    await runPackageAutoSyncWithSource(getConfiguredSourceUrl());
}
async function runPackageAutoSyncWithSource(sourceUrl) {
    if (isRunning) {
        logger_1.logger.info('Drug package auto-sync: already running, skipping');
        return;
    }
    if (!sourceUrl) {
        logger_1.logger.warn('Drug package auto-sync: DRUG_PACKAGE_SOURCE_URL is not configured');
        return;
    }
    isRunning = true;
    let pinnedAgent = null;
    try {
        const validated = await (0, network_utils_1.validateExternalHttpsUrl)(sourceUrl);
        if (!validated.ok) {
            logger_1.logger.error('Drug package auto-sync: source URL is invalid', {
                source: (0, http_utils_1.summarizeSourceUrl)(sourceUrl),
                reason: validated.reason,
            });
            return;
        }
        pinnedAgent = (0, network_utils_1.createPinnedDnsAgent)(validated.hostname ?? new URL(sourceUrl).hostname, validated.resolvedAddresses);
        const pinnedDispatcher = pinnedAgent;
        logger_1.logger.info('Drug package auto-sync: checking for updates', { source: (0, http_utils_1.summarizeSourceUrl)(sourceUrl) });
        const fetchOpts = { sourceKey: drug_master_source_state_service_1.SOURCE_KEY_PACKAGE, retries: FETCH_RETRIES, headers: buildSourceRequestHeaders(sourceUrl) };
        const updateCheck = await (0, mhlw_source_fetch_1.checkForUpdates)(sourceUrl, pinnedDispatcher, fetchOpts);
        if (!updateCheck.hasUpdate) {
            logger_1.logger.info('Drug package auto-sync: no updates detected');
            await persistHeaders(sourceUrl, updateCheck, false);
            return;
        }
        logger_1.logger.info('Drug package auto-sync: update detected, downloading file');
        const { buffer, contentType } = await (0, mhlw_source_fetch_1.downloadFile)(sourceUrl, pinnedDispatcher, fetchOpts);
        const contentHash = (0, crypto_utils_1.sha256)(buffer);
        if (updateCheck.compareByContentHash
            && updateCheck.previousContentHash
            && updateCheck.previousContentHash === contentHash) {
            logger_1.logger.info('Drug package auto-sync: no updates detected by content-hash fallback');
            await persistHeaders(sourceUrl, { ...updateCheck, contentHash }, false);
            return;
        }
        const syncLog = await (0, drug_master_service_1.createSyncLog)('package_auto', `包装単位自動取得: ${(0, http_utils_1.summarizeSourceUrl)(sourceUrl)}`, null);
        const emptyResult = { itemsProcessed: 0, itemsAdded: 0, itemsUpdated: 0, itemsDeleted: 0 };
        try {
            const parsedRows = await parseDownloadedPackageRows(sourceUrl, contentType, buffer);
            if (parsedRows.length === 0) {
                await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'failed', emptyResult, '有効な包装単位データが見つかりません');
                logger_1.logger.warn('Drug package auto-sync: no valid package rows found');
                return;
            }
            const result = await (0, drug_master_service_1.syncPackageData)(parsedRows);
            await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'success', {
                itemsProcessed: parsedRows.length,
                itemsAdded: result.added,
                itemsUpdated: result.updated,
                itemsDeleted: 0,
            });
            await persistHeaders(sourceUrl, { ...updateCheck, contentHash }, true);
            logger_1.logger.info('Drug package auto-sync: completed successfully', {
                processed: parsedRows.length,
                added: result.added,
                updated: result.updated,
            });
        }
        catch (syncErr) {
            const errorMsg = (0, error_handler_1.getErrorMessage)(syncErr);
            await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'failed', emptyResult, errorMsg);
            logger_1.logger.error('Drug package auto-sync: sync failed', { error: errorMsg });
        }
    }
    catch (err) {
        logger_1.logger.error('Drug package auto-sync: check/download failed', {
            error: (0, error_handler_1.getErrorMessage)(err),
        });
    }
    finally {
        if (pinnedAgent) {
            await pinnedAgent.close().catch(() => undefined);
        }
        isRunning = false;
    }
}
function scheduleNextDrugPackageRun(delayMs, mode) {
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
        void runPackageAutoSyncSafely(mode).finally(() => {
            if (!schedulerActive) {
                return;
            }
            scheduleNextDrugPackageRun(CHECK_INTERVAL_MS, 'scheduled');
        });
    }, delayMs);
    schedulerTimer.unref();
}
function startLegacyDrugPackageIntervalScheduler() {
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
        void runPackageAutoSyncSafely('initial');
    }, Math.min(60_000, CHECK_INTERVAL_MS));
    schedulerTimer.unref();
    schedulerInterval = setInterval(() => {
        if (!schedulerActive) {
            return;
        }
        void runPackageAutoSyncSafely('scheduled');
    }, CHECK_INTERVAL_MS);
    schedulerInterval.unref();
}
function clearDrugPackageSchedulerHandles() {
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
function startDrugPackageScheduler() {
    if (!AUTO_SYNC_ENABLED) {
        logger_1.logger.info('Drug package auto-sync: disabled (set DRUG_PACKAGE_AUTO_SYNC=true to enable)');
        return;
    }
    const sourceUrl = getConfiguredSourceUrl();
    if (!sourceUrl) {
        logger_1.logger.warn('Drug package auto-sync: DRUG_PACKAGE_SOURCE_URL is not set, scheduler will not start');
        return;
    }
    if (schedulerActive) {
        logger_1.logger.warn('Drug package auto-sync: scheduler already running');
        return;
    }
    const optimizedLoopEnabled = isOptimizedLoopEnabledForDrugPackageScheduler();
    logger_1.logger.info('Drug package auto-sync: starting scheduler', {
        intervalHours: CHECK_INTERVAL_HOURS,
        source: (0, http_utils_1.summarizeSourceUrl)(sourceUrl),
        loopMode: optimizedLoopEnabled ? 'timeout-chain' : 'legacy-interval',
    });
    schedulerActive = true;
    if (optimizedLoopEnabled) {
        scheduleNextDrugPackageRun(Math.min(60_000, CHECK_INTERVAL_MS), 'initial');
        return;
    }
    startLegacyDrugPackageIntervalScheduler();
}
function stopDrugPackageScheduler() {
    const wasActive = schedulerActive || schedulerTimer !== null || schedulerInterval !== null;
    schedulerActive = false;
    clearDrugPackageSchedulerHandles();
    if (wasActive) {
        logger_1.logger.info('Drug package auto-sync: scheduler stopped');
    }
}
async function triggerManualPackageAutoSync(options) {
    const sourceUrl = options?.sourceUrl?.trim() || getConfiguredSourceUrl();
    if (!sourceUrl) {
        return {
            triggered: false,
            message: 'DRUG_PACKAGE_SOURCE_URL が設定されていません。手動実行時は sourceUrl を指定してください',
        };
    }
    const validated = await (0, network_utils_1.validateExternalHttpsUrl)(sourceUrl);
    if (!validated.ok) {
        return {
            triggered: false,
            message: validated.reason ?? 'sourceUrl が不正です',
        };
    }
    if (isRunning) {
        return { triggered: false, message: '包装単位同期が既に実行中です' };
    }
    void runPackageAutoSyncSafely('manual', sourceUrl);
    return { triggered: true, message: '包装単位データの自動取得を開始しました。同期ログで進捗を確認してください。' };
}
//# sourceMappingURL=drug-package-scheduler.js.map