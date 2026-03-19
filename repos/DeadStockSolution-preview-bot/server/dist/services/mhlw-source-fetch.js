"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForUpdates = checkForUpdates;
exports.downloadFile = downloadFile;
/**
 * MHLW ソースファイルの更新チェック・ダウンロード共通ロジック
 *
 * drug-master-scheduler / drug-package-scheduler が共有する
 * checkForUpdates / downloadFile を一元化。
 */
const http_utils_1 = require("../utils/http-utils");
const drug_master_source_state_service_1 = require("./drug-master-source-state-service");
const source_update_detection_1 = require("./source-update-detection");
/**
 * HEAD リクエストでサイトの更新を検知する。
 * ETag / Last-Modified の変化を DB 永続化された前回状態と比較。
 */
async function checkForUpdates(url, dispatcher, opts) {
    const response = await (0, http_utils_1.fetchWithTimeout)(url, {
        method: 'HEAD',
        timeoutMs: 30_000,
        retry: { retries: opts.retries },
        redirect: 'manual',
        dispatcher,
        headers: opts.headers,
    });
    if (response.status >= 300 && response.status < 400) {
        throw new Error(`Redirect response is not allowed for source URL: ${response.status}`);
    }
    if (!response.ok) {
        throw new Error(`HEAD request failed: ${response.status} ${response.statusText}`);
    }
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const contentType = response.headers.get('content-type');
    const prevState = await (0, drug_master_source_state_service_1.getSourceState)(opts.sourceKey);
    const decision = (0, source_update_detection_1.decideSourceUpdate)(prevState, { etag, lastModified });
    return {
        hasUpdate: decision.shouldDownload,
        etag,
        lastModified,
        contentType,
        compareByContentHash: decision.compareByContentHash,
        previousContentHash: prevState?.contentHash ?? null,
    };
}
/**
 * ファイルをダウンロードしてバッファとして取得。
 */
async function downloadFile(url, dispatcher, opts) {
    const response = await (0, http_utils_1.fetchWithTimeout)(url, {
        timeoutMs: http_utils_1.MHLW_FETCH_TIMEOUT_MS,
        retry: { retries: opts.retries },
        redirect: 'manual',
        dispatcher,
        headers: opts.headers,
    });
    if (response.status >= 300 && response.status < 400) {
        throw new Error(`Redirect response is not allowed for source URL: ${response.status}`);
    }
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    const buffer = await (0, http_utils_1.downloadResponseBuffer)(response, http_utils_1.MHLW_MAX_DOWNLOAD_SIZE);
    return { buffer, contentType };
}
//# sourceMappingURL=mhlw-source-fetch.js.map