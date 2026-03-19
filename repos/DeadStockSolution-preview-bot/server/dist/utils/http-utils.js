"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchTimeoutError = exports.MHLW_DEFAULT_FETCH_RETRIES = exports.MHLW_FETCH_TIMEOUT_MS = exports.MHLW_MAX_DOWNLOAD_SIZE = void 0;
exports.sleep = sleep;
exports.fetchWithTimeout = fetchWithTimeout;
exports.summarizeSourceUrl = summarizeSourceUrl;
exports.downloadResponseBuffer = downloadResponseBuffer;
/** MHLW ファイルダウンロード共通デフォルト */
exports.MHLW_MAX_DOWNLOAD_SIZE = 100 * 1024 * 1024; // 100MB
exports.MHLW_FETCH_TIMEOUT_MS = 120_000; // 2分（大きなファイル用）
exports.MHLW_DEFAULT_FETCH_RETRIES = 2;
class FetchTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FetchTimeoutError';
    }
}
exports.FetchTimeoutError = FetchTimeoutError;
const DEFAULT_RETRYABLE_STATUSES = [408, 425, 429, 500, 502, 503, 504];
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 5000;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function computeBackoffDelay(attempt, baseDelayMs, maxDelayMs) {
    const exp = Math.min(maxDelayMs, baseDelayMs * (2 ** Math.max(0, attempt - 1)));
    const jitter = Math.floor(Math.random() * Math.max(50, Math.floor(baseDelayMs / 2)));
    return Math.min(maxDelayMs, exp + jitter);
}
function isAbortError(err) {
    return err instanceof Error && err.name === 'AbortError';
}
function shouldRetryError(err) {
    if (err instanceof FetchTimeoutError)
        return true;
    if (isAbortError(err))
        return false;
    return err instanceof Error;
}
async function fetchOnceWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const externalSignal = options.signal;
    let timeoutTriggered = false;
    const abortExternal = () => {
        controller.abort(externalSignal?.reason);
    };
    if (externalSignal) {
        if (externalSignal.aborted) {
            abortExternal();
        }
        else {
            externalSignal.addEventListener('abort', abortExternal, { once: true });
        }
    }
    const timeout = setTimeout(() => {
        timeoutTriggered = true;
        controller.abort(new Error('timeout'));
    }, timeoutMs);
    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
        });
    }
    catch (err) {
        if (timeoutTriggered) {
            throw new FetchTimeoutError(`request timed out after ${timeoutMs}ms`);
        }
        throw err;
    }
    finally {
        clearTimeout(timeout);
        if (externalSignal) {
            externalSignal.removeEventListener('abort', abortExternal);
        }
    }
}
async function fetchWithTimeout(url, options) {
    const { timeoutMs, retry, ...requestInit } = options;
    const retries = Math.max(0, retry?.retries ?? 0);
    const baseDelayMs = Math.max(10, retry?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS);
    const maxDelayMs = Math.max(baseDelayMs, retry?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS);
    const retryOnStatuses = retry?.retryOnStatuses ?? DEFAULT_RETRYABLE_STATUSES;
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetchOnceWithTimeout(url, requestInit, timeoutMs);
            if (attempt < retries && retryOnStatuses.includes(response.status)) {
                response.body?.cancel().catch(() => undefined);
                await sleep(computeBackoffDelay(attempt + 1, baseDelayMs, maxDelayMs));
                continue;
            }
            return response;
        }
        catch (err) {
            lastError = err;
            const externalSignalAborted = requestInit.signal?.aborted ?? false;
            if (externalSignalAborted) {
                throw err;
            }
            if (attempt >= retries || !shouldRetryError(err)) {
                throw err;
            }
            await sleep(computeBackoffDelay(attempt + 1, baseDelayMs, maxDelayMs));
        }
    }
    throw lastError instanceof Error ? lastError : new Error('request failed');
}
function summarizeSourceUrl(sourceUrl) {
    try {
        return new URL(sourceUrl).hostname;
    }
    catch {
        return sourceUrl.slice(0, 64);
    }
}
async function downloadResponseBuffer(response, maxDownloadSize) {
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
        const size = Number(contentLength);
        if (Number.isFinite(size) && size > maxDownloadSize) {
            throw new Error(`File too large: ${size} bytes (max ${maxDownloadSize})`);
        }
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxDownloadSize) {
        throw new Error(`Downloaded file too large: ${arrayBuffer.byteLength} bytes (max ${maxDownloadSize})`);
    }
    return Buffer.from(arrayBuffer);
}
//# sourceMappingURL=http-utils.js.map