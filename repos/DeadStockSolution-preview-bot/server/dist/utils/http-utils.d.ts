/** Undici dispatcher type used with createPinnedDnsAgent */
export type FetchDispatcher = NonNullable<RequestInit['dispatcher']>;
/** MHLW ファイルダウンロード共通デフォルト */
export declare const MHLW_MAX_DOWNLOAD_SIZE: number;
export declare const MHLW_FETCH_TIMEOUT_MS = 120000;
export declare const MHLW_DEFAULT_FETCH_RETRIES = 2;
export declare class FetchTimeoutError extends Error {
    constructor(message: string);
}
interface RetryOptions {
    retries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    retryOnStatuses?: number[];
}
interface FetchWithTimeoutOptions extends RequestInit {
    timeoutMs: number;
    retry?: RetryOptions;
}
export declare function sleep(ms: number): Promise<void>;
export declare function fetchWithTimeout(url: string, options: FetchWithTimeoutOptions): Promise<Response>;
export declare function summarizeSourceUrl(sourceUrl: string): string;
export declare function downloadResponseBuffer(response: Response, maxDownloadSize: number): Promise<Buffer>;
export {};
//# sourceMappingURL=http-utils.d.ts.map