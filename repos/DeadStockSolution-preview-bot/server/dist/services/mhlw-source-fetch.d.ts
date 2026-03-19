/**
 * MHLW ソースファイルの更新チェック・ダウンロード共通ロジック
 *
 * drug-master-scheduler / drug-package-scheduler が共有する
 * checkForUpdates / downloadFile を一元化。
 */
import { type FetchDispatcher } from '../utils/http-utils';
export interface CheckForUpdatesResult {
    hasUpdate: boolean;
    etag: string | null;
    lastModified: string | null;
    contentType: string | null;
    compareByContentHash: boolean;
    previousContentHash: string | null;
}
/**
 * HEAD リクエストでサイトの更新を検知する。
 * ETag / Last-Modified の変化を DB 永続化された前回状態と比較。
 */
export declare function checkForUpdates(url: string, dispatcher: FetchDispatcher, opts: {
    sourceKey: string;
    retries: number;
    headers: Record<string, string>;
}): Promise<CheckForUpdatesResult>;
/**
 * ファイルをダウンロードしてバッファとして取得。
 */
export declare function downloadFile(url: string, dispatcher: FetchDispatcher, opts: {
    retries: number;
    headers: Record<string, string>;
}): Promise<{
    buffer: Buffer;
    contentType: string | null;
}>;
//# sourceMappingURL=mhlw-source-fetch.d.ts.map