export interface PreviousSourceStateLike {
    etag: string | null;
    lastModified: string | null;
}
export interface SourceHeaderSnapshot {
    etag: string | null;
    lastModified: string | null;
}
export interface SourceUpdateDecision {
    shouldDownload: boolean;
    compareByContentHash: boolean;
}
/**
 * 取得元が ETag / Last-Modified を返さない場合でも更新見逃しを防ぐため、
 * content-hash 比較フォールバックを有効化する。
 */
export declare function decideSourceUpdate(previous: PreviousSourceStateLike | null, current: SourceHeaderSnapshot): SourceUpdateDecision;
//# sourceMappingURL=source-update-detection.d.ts.map