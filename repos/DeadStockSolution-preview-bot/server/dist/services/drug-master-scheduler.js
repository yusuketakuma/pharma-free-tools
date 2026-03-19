"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDrugMasterScheduler = startDrugMasterScheduler;
exports.stopDrugMasterScheduler = stopDrugMasterScheduler;
exports.triggerManualAutoSync = triggerManualAutoSync;
exports.getConfiguredSourceMode = getConfiguredSourceMode;
const drug_master_service_1 = require("./drug-master-service");
const drug_master_parser_service_1 = require("./drug-master-parser-service");
const logger_1 = require("./logger");
const network_utils_1 = require("../utils/network-utils");
const number_utils_1 = require("../utils/number-utils");
const http_utils_1 = require("../utils/http-utils");
const error_handler_1 = require("../middleware/error-handler");
const crypto_utils_1 = require("../utils/crypto-utils");
const drug_master_source_state_service_1 = require("./drug-master-source-state-service");
const mhlw_multi_file_fetcher_1 = require("./mhlw-multi-file-fetcher");
const mhlw_source_fetch_1 = require("./mhlw-source-fetch");
// チェック間隔: デフォルト24時間（環境変数で変更可能）
const CHECK_INTERVAL_HOURS = (0, number_utils_1.parseBoundedInt)(process.env.DRUG_MASTER_CHECK_INTERVAL_HOURS, 24, 1, 24 * 30);
const CHECK_INTERVAL_MS = CHECK_INTERVAL_HOURS * 60 * 60 * 1000;
// 自動同期の有効/無効
const AUTO_SYNC_ENABLED = process.env.DRUG_MASTER_AUTO_SYNC === 'true';
const SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'SCHEDULER_OPTIMIZED_LOOP_ENABLED';
const DRUG_MASTER_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV = 'DRUG_MASTER_SCHEDULER_OPTIMIZED_LOOP_ENABLED';
// ソースモード: 'index'（MHLW ポータル自動探索）or 'single'（従来の単一URL）
function getConfiguredSourceMode() {
    const mode = process.env.DRUG_MASTER_SOURCE_MODE?.trim().toLowerCase();
    if (mode === 'single')
        return 'single';
    return 'index'; // デフォルト
}
// HTTP リトライ（環境変数でオーバーライド可能）
const FETCH_RETRIES = (0, number_utils_1.parseBoundedInt)(process.env.DRUG_MASTER_FETCH_RETRIES, http_utils_1.MHLW_DEFAULT_FETCH_RETRIES, 0, 5);
// ── 状態管理 ──────────────────────────────────────
let schedulerTimer = null;
let schedulerInterval = null;
let schedulerActive = false;
let isRunning = false;
function getConfiguredSourceUrl() {
    return process.env.DRUG_MASTER_SOURCE_URL?.trim() || '';
}
function isOptimizedLoopEnabledForDrugMasterScheduler() {
    const localFlag = process.env[DRUG_MASTER_SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV];
    if (typeof localFlag === 'string' && localFlag.trim().length > 0) {
        return (0, number_utils_1.parseBooleanFlag)(localFlag, true);
    }
    return (0, number_utils_1.parseBooleanFlag)(process.env[SCHEDULER_OPTIMIZED_LOOP_ENABLED_ENV], true);
}
async function persistSingleSourceState(sourceUrl, data, changed) {
    await (0, drug_master_source_state_service_1.persistSourceHeaders)(drug_master_source_state_service_1.SOURCE_KEY_SINGLE, sourceUrl, data, changed);
}
function runAutoSyncSafely(mode, sourceUrl) {
    const sourceMode = getConfiguredSourceMode();
    const task = sourceMode === 'index' && !sourceUrl
        ? runAutoSyncIndex()
        : (sourceUrl ? runAutoSyncWithSource(sourceUrl) : runAutoSync());
    return task.catch((err) => {
        const suffix = mode === 'manual' ? 'manual trigger' : `${mode} run`;
        logger_1.logger.error(`Drug master auto-sync: ${suffix} failed`, {
            error: (0, error_handler_1.getErrorMessage)(err),
        });
    });
}
/**
 * インデックスモード: MHLW ポータルから自動探索 → 4ファイルマージ同期
 */
async function runAutoSyncIndex() {
    if (isRunning) {
        logger_1.logger.info('Drug master auto-sync (index): already running, skipping');
        return;
    }
    isRunning = true;
    try {
        logger_1.logger.info('Drug master auto-sync (index): starting multi-file sync');
        await (0, mhlw_multi_file_fetcher_1.runMultiFileSync)();
    }
    finally {
        isRunning = false;
    }
}
// ── サイト更新検知 ──────────────────────────────────
const DRUG_MASTER_HEADERS = {
    'User-Agent': 'DeadStockSolution-DrugMasterSync/1.0',
};
/**
 * 自動同期の実行
 */
async function runAutoSync() {
    await runAutoSyncWithSource(getConfiguredSourceUrl());
}
async function runAutoSyncWithSource(sourceUrl) {
    if (isRunning) {
        logger_1.logger.info('Drug master auto-sync: already running, skipping');
        return;
    }
    if (!sourceUrl) {
        logger_1.logger.warn('Drug master auto-sync: DRUG_MASTER_SOURCE_URL is not configured');
        return;
    }
    isRunning = true;
    let pinnedAgent = null;
    try {
        const validated = await (0, network_utils_1.validateExternalHttpsUrl)(sourceUrl);
        if (!validated.ok) {
            logger_1.logger.error('Drug master auto-sync: source URL is invalid', {
                source: (0, http_utils_1.summarizeSourceUrl)(sourceUrl),
                reason: validated.reason,
            });
            return;
        }
        pinnedAgent = (0, network_utils_1.createPinnedDnsAgent)(validated.hostname ?? new URL(sourceUrl).hostname, validated.resolvedAddresses);
        const pinnedDispatcher = pinnedAgent;
        logger_1.logger.info('Drug master auto-sync: checking for updates', { source: (0, http_utils_1.summarizeSourceUrl)(sourceUrl) });
        // 1. 更新チェック
        const fetchOpts = { sourceKey: drug_master_source_state_service_1.SOURCE_KEY_SINGLE, retries: FETCH_RETRIES, headers: DRUG_MASTER_HEADERS };
        const updateCheck = await (0, mhlw_source_fetch_1.checkForUpdates)(sourceUrl, pinnedDispatcher, fetchOpts);
        if (!updateCheck.hasUpdate) {
            logger_1.logger.info('Drug master auto-sync: no updates detected');
            await persistSingleSourceState(sourceUrl, updateCheck, false);
            return;
        }
        logger_1.logger.info('Drug master auto-sync: update detected, downloading file');
        // 2. ファイルダウンロード
        const { buffer, contentType } = await (0, mhlw_source_fetch_1.downloadFile)(sourceUrl, pinnedDispatcher, fetchOpts);
        const contentHash = (0, crypto_utils_1.sha256)(buffer);
        if (updateCheck.compareByContentHash
            && updateCheck.previousContentHash
            && updateCheck.previousContentHash === contentHash) {
            logger_1.logger.info('Drug master auto-sync: no updates detected by content-hash fallback');
            await persistSingleSourceState(sourceUrl, { ...updateCheck, contentHash }, false);
            return;
        }
        // 3. 同期ログ作成
        const syncLog = await (0, drug_master_service_1.createSyncLog)('auto', `自動取得: ${(0, http_utils_1.summarizeSourceUrl)(sourceUrl)}`, null);
        const revisionDate = new Date().toISOString().slice(0, 10);
        try {
            const parsedRows = await (0, drug_master_parser_service_1.parseMhlwDrugFile)(sourceUrl, contentType, buffer);
            if (parsedRows.length === 0) {
                await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'failed', { itemsProcessed: 0, itemsAdded: 0, itemsUpdated: 0, itemsDeleted: 0 }, 'ダウンロードしたファイルから有効なデータが見つかりません');
                logger_1.logger.warn('Drug master auto-sync: no valid data rows found in downloaded file');
                return;
            }
            logger_1.logger.info('Drug master auto-sync: parsed rows', { count: parsedRows.length });
            // 5. 同期実行
            const result = await (0, drug_master_service_1.syncDrugMaster)(parsedRows, syncLog.id, revisionDate);
            await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'success', result);
            // 6. ヘッダー情報を DB に永続化（成功時のみ）
            await persistSingleSourceState(sourceUrl, { ...updateCheck, contentHash }, true);
            logger_1.logger.info('Drug master auto-sync: completed successfully', {
                processed: result.itemsProcessed,
                added: result.itemsAdded,
                updated: result.itemsUpdated,
                deleted: result.itemsDeleted,
            });
        }
        catch (syncErr) {
            const errorMsg = (0, error_handler_1.getErrorMessage)(syncErr);
            await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'failed', { itemsProcessed: 0, itemsAdded: 0, itemsUpdated: 0, itemsDeleted: 0 }, errorMsg);
            logger_1.logger.error('Drug master auto-sync: sync failed', { error: errorMsg });
        }
    }
    catch (err) {
        logger_1.logger.error('Drug master auto-sync: check/download failed', {
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
// ── スケジューラ制御 ─────────────────────────────────
function scheduleNextDrugMasterRun(delayMs, mode) {
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
        void runAutoSyncSafely(mode).finally(() => {
            if (!schedulerActive) {
                return;
            }
            scheduleNextDrugMasterRun(CHECK_INTERVAL_MS, 'scheduled');
        });
    }, delayMs);
    schedulerTimer.unref();
}
function startLegacyDrugMasterIntervalScheduler() {
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
        void runAutoSyncSafely('initial');
    }, Math.min(60_000, CHECK_INTERVAL_MS));
    schedulerTimer.unref();
    schedulerInterval = setInterval(() => {
        if (!schedulerActive) {
            return;
        }
        void runAutoSyncSafely('scheduled');
    }, CHECK_INTERVAL_MS);
    schedulerInterval.unref();
}
function clearDrugMasterSchedulerHandles() {
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
/**
 * 自動同期スケジューラを開始する
 * サーバー起動時に呼び出す
 */
function startDrugMasterScheduler() {
    if (!AUTO_SYNC_ENABLED) {
        logger_1.logger.info('Drug master auto-sync: disabled (set DRUG_MASTER_AUTO_SYNC=true to enable)');
        return;
    }
    const sourceMode = getConfiguredSourceMode();
    const sourceUrl = getConfiguredSourceUrl();
    // index モードでは SOURCE_URL 不要（ポータルから自動探索）
    if (sourceMode === 'single' && !sourceUrl) {
        logger_1.logger.warn('Drug master auto-sync: DRUG_MASTER_SOURCE_URL is not set, scheduler will not start');
        return;
    }
    if (schedulerActive) {
        logger_1.logger.warn('Drug master auto-sync: scheduler already running');
        return;
    }
    const optimizedLoopEnabled = isOptimizedLoopEnabledForDrugMasterScheduler();
    logger_1.logger.info('Drug master auto-sync: starting scheduler', {
        intervalHours: CHECK_INTERVAL_HOURS,
        sourceMode,
        source: sourceMode === 'single' ? (0, http_utils_1.summarizeSourceUrl)(sourceUrl) : 'MHLW portal auto-discovery',
        loopMode: optimizedLoopEnabled ? 'timeout-chain' : 'legacy-interval',
    });
    schedulerActive = true;
    if (optimizedLoopEnabled) {
        scheduleNextDrugMasterRun(Math.min(60_000, CHECK_INTERVAL_MS), 'initial');
        return;
    }
    startLegacyDrugMasterIntervalScheduler();
}
/**
 * スケジューラを停止する
 */
function stopDrugMasterScheduler() {
    const wasActive = schedulerActive || schedulerTimer !== null || schedulerInterval !== null;
    schedulerActive = false;
    clearDrugMasterSchedulerHandles();
    if (wasActive) {
        logger_1.logger.info('Drug master auto-sync: scheduler stopped');
    }
}
/**
 * 手動で即時チェック＆同期をトリガーする（管理者API用）
 */
async function triggerManualAutoSync(options) {
    const requestedMode = options?.sourceMode ?? getConfiguredSourceMode();
    // index モード: ポータル自動探索（sourceUrl 不要）
    if (requestedMode === 'index' && !options?.sourceUrl?.trim()) {
        if (isRunning) {
            return { triggered: false, message: '同期が既に実行中です' };
        }
        void runAutoSyncIndex().catch((err) => {
            logger_1.logger.error('Drug master auto-sync: manual index trigger failed', {
                error: (0, error_handler_1.getErrorMessage)(err),
            });
        });
        return { triggered: true, message: 'MHLW ポータルから自動探索を開始しました。同期ログで進捗を確認してください。' };
    }
    // single モード or sourceUrl 指定
    const sourceUrl = options?.sourceUrl?.trim() || getConfiguredSourceUrl();
    if (!sourceUrl) {
        return {
            triggered: false,
            message: 'DRUG_MASTER_SOURCE_URL が設定されていません。手動実行時は sourceUrl を指定してください',
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
        return { triggered: false, message: '同期が既に実行中です' };
    }
    // バックグラウンドで実行（レスポンスは即時返す）
    void runAutoSyncSafely('manual', sourceUrl);
    return { triggered: true, message: '自動取得を開始しました。同期ログで進捗を確認してください。' };
}
//# sourceMappingURL=drug-master-scheduler.js.map