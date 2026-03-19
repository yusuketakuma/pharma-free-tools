"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMultiFileSync = runMultiFileSync;
const mhlw_index_scraper_1 = require("./mhlw-index-scraper");
const drug_master_source_state_service_1 = require("./drug-master-source-state-service");
const drug_master_service_1 = require("./drug-master-service");
const drug_master_parser_service_1 = require("./drug-master-parser-service");
const logger_1 = require("./logger");
const network_utils_1 = require("../utils/network-utils");
const http_utils_1 = require("../utils/http-utils");
const error_handler_1 = require("../middleware/error-handler");
const crypto_utils_1 = require("../utils/crypto-utils");
const FETCH_RETRIES = http_utils_1.MHLW_DEFAULT_FETCH_RETRIES;
function allowPartialIndexSync() {
    return process.env.DRUG_MASTER_ALLOW_PARTIAL_INDEX_SYNC === 'true';
}
/**
 * 1ファイルをダウンロード → ハッシュ比較まで実行
 * 実データのパースは「変更あり判定後」にまとめて行う
 */
async function downloadFileForSync(file, dispatcher, existingStates) {
    const sourceKey = (0, drug_master_source_state_service_1.sourceKeyForFile)(file.category);
    const existingState = existingStates.get(sourceKey) ?? null;
    const response = await (0, http_utils_1.fetchWithTimeout)(file.url, {
        timeoutMs: http_utils_1.MHLW_FETCH_TIMEOUT_MS,
        retry: { retries: FETCH_RETRIES },
        redirect: 'manual',
        dispatcher,
        headers: {
            'User-Agent': 'DeadStockSolution-DrugMasterSync/1.0',
        },
    });
    if (response.status >= 300 && response.status < 400) {
        throw new Error(`リダイレクト応答は許可されていません (${file.category}): ${response.status}`);
    }
    if (!response.ok) {
        throw new Error(`ダウンロード失敗 (${file.category}): ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    const buffer = await (0, http_utils_1.downloadResponseBuffer)(response, http_utils_1.MHLW_MAX_DOWNLOAD_SIZE);
    const contentHash = (0, crypto_utils_1.sha256)(buffer);
    const changed = !existingState?.contentHash || existingState.contentHash !== contentHash;
    return {
        category: file.category,
        url: file.url,
        contentHash,
        changed,
        contentType,
        buffer,
    };
}
async function validateDiscoveredFileUrl(file) {
    const validated = await (0, network_utils_1.validateExternalHttpsUrl)(file.url);
    if (!validated.ok) {
        throw new Error(`MHLW URL 検証失敗 (${file.category}): ${validated.reason}`);
    }
    return {
        hostname: validated.hostname ?? new URL(file.url).hostname,
        resolvedAddresses: validated.resolvedAddresses,
    };
}
/**
 * MHLW マルチファイル同期を実行する
 *
 * 1. インデックスページから Excel URL 4件を発見
 * 2. 各ファイルの content_hash を DB と比較
 * 3. 全件 unchanged なら同期不要で終了
 * 4. 1件でも changed があれば全ファイルをパースして行データをマージ
 * 5. マージした全行を syncDrugMaster() に渡す
 * 6. 成功時に各ファイルの content_hash を DB 更新
 */
async function runMultiFileSync() {
    // Step 1: Excel URL を発見
    const indexResult = await (0, mhlw_index_scraper_1.discoverMhlwExcelUrls)();
    // インデックスページの状態を記録
    await (0, drug_master_source_state_service_1.upsertSourceState)(drug_master_source_state_service_1.SOURCE_KEY_INDEX, {
        url: indexResult.indexUrl,
        lastCheckedAt: new Date().toISOString(),
    });
    if (indexResult.files.length === 0) {
        throw new Error('インデックスページから Excel ファイルが見つかりません');
    }
    // カテゴリの検証（4カテゴリ全てが揃っているか警告）
    const foundCategories = new Set(indexResult.files.map((f) => f.category));
    const missingCategories = mhlw_index_scraper_1.DRUG_CATEGORIES.filter((c) => !foundCategories.has(c));
    if (missingCategories.length > 0) {
        if (!allowPartialIndexSync()) {
            throw new Error(`MHLW必須カテゴリが不足しています: ${missingCategories.join(', ')} ` +
                '(必要であれば DRUG_MASTER_ALLOW_PARTIAL_INDEX_SYNC=true で一時的に許可)');
        }
        logger_1.logger.warn('MHLW multi-file sync: some categories not found', {
            missing: missingCategories,
            found: Array.from(foundCategories),
            allowPartialIndexSync: true,
        });
    }
    // 既存のソース状態を一括取得（N+1 → 1 クエリ）
    const existingStates = new Map();
    const allFileStates = await (0, drug_master_source_state_service_1.getSourceStatesByPrefix)('drug:file:');
    for (const state of allFileStates) {
        existingStates.set(state.sourceKey, state);
    }
    // 全ファイルを HTTPS + DNS ピンニング対象として検証
    const validatedFiles = await Promise.all(indexResult.files.map((file) => validateDiscoveredFileUrl(file)));
    const representative = validatedFiles[0];
    const allSameHost = validatedFiles.every((entry) => entry.hostname === representative.hostname);
    if (!allSameHost) {
        throw new Error('MHLW マルチファイル同期エラー: 取得対象ファイルのホストが一致しません');
    }
    // 共有 DNS agent を作成（全ファイル同一ホストのみ許可）
    const sharedAgent = (0, network_utils_1.createPinnedDnsAgent)(representative.hostname, representative.resolvedAddresses);
    const dispatcher = sharedAgent;
    try {
        // Step 2-4: 各ファイルをダウンロード & パースを統合実行
        logger_1.logger.info('MHLW multi-file sync: downloading and parsing files', {
            fileCount: indexResult.files.length,
        });
        const results = await Promise.allSettled(indexResult.files.map((file) => downloadFileForSync(file, dispatcher, existingStates)));
        // 全体中止チェック: 1つでも失敗したら中止
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
            const errorMessages = failures.map((f) => (0, error_handler_1.getErrorMessage)(f.reason));
            throw new Error(`ファイル処理に失敗 (${failures.length}/${indexResult.files.length}件): ${errorMessages.join('; ')}`);
        }
        const successResults = results.map((r) => r.value);
        // 全て変更なしなら同期不要
        const hasAnyChange = successResults.some((r) => r.changed);
        if (!hasAnyChange) {
            logger_1.logger.info('MHLW multi-file sync: all files unchanged, skipping sync');
            // lastCheckedAt だけ更新
            const now = new Date().toISOString();
            await Promise.all(successResults.map((r) => (0, drug_master_source_state_service_1.upsertSourceState)((0, drug_master_source_state_service_1.sourceKeyForFile)(r.category), {
                url: r.url,
                contentHash: r.contentHash,
                lastCheckedAt: now,
            })));
            return {
                indexUrl: indexResult.indexUrl,
                discoveredFiles: indexResult.files,
                allUnchanged: true,
            };
        }
        // 1件でも変更がある場合は、未変更カテゴリも含めて全量をパースして同期する
        const parsedResults = [];
        for (const fileResult of successResults) {
            const rows = await (0, drug_master_parser_service_1.parseMhlwDrugFile)(fileResult.url, fileResult.contentType, fileResult.buffer);
            parsedResults.push({
                category: fileResult.category,
                url: fileResult.url,
                contentHash: fileResult.contentHash,
                changed: fileResult.changed,
                rows,
            });
        }
        // マージ
        const mergedRows = [];
        for (const { rows } of parsedResults) {
            mergedRows.push(...rows);
        }
        if (mergedRows.length === 0) {
            throw new Error('全ファイルから有効なデータが見つかりません');
        }
        logger_1.logger.info('MHLW multi-file sync: merged rows', {
            totalRows: mergedRows.length,
            perCategory: parsedResults.map((p) => ({ category: p.category, count: p.rows.length })),
        });
        // Step 5: 同期実行
        const syncLog = await (0, drug_master_service_1.createSyncLog)('auto', `MHLW自動取得(${indexResult.files.length}ファイル): ${indexResult.indexUrl}`, null);
        const revisionDate = new Date().toISOString().slice(0, 10);
        try {
            const syncResult = await (0, drug_master_service_1.syncDrugMaster)(mergedRows, syncLog.id, revisionDate);
            await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'success', syncResult);
            // Step 6: 成功時に状態を更新
            const now = new Date().toISOString();
            await Promise.all(parsedResults.map((r) => (0, drug_master_source_state_service_1.upsertSourceState)((0, drug_master_source_state_service_1.sourceKeyForFile)(r.category), {
                url: r.url,
                contentHash: r.contentHash,
                lastCheckedAt: now,
                lastChangedAt: r.changed ? now : undefined,
                metadataJson: JSON.stringify({ fileCategory: r.category }),
            })));
            logger_1.logger.info('MHLW multi-file sync: completed successfully', {
                processed: syncResult.itemsProcessed,
                added: syncResult.itemsAdded,
                updated: syncResult.itemsUpdated,
                deleted: syncResult.itemsDeleted,
            });
            return {
                indexUrl: indexResult.indexUrl,
                discoveredFiles: indexResult.files,
                allUnchanged: false,
                syncResult,
            };
        }
        catch (syncErr) {
            await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'failed', {
                itemsProcessed: 0,
                itemsAdded: 0,
                itemsUpdated: 0,
                itemsDeleted: 0,
            }, (0, error_handler_1.getErrorMessage)(syncErr));
            throw syncErr;
        }
    }
    finally {
        await sharedAgent.close().catch(() => undefined);
    }
}
//# sourceMappingURL=mhlw-multi-file-fetcher.js.map