export interface SourceState {
    id: number;
    sourceKey: string;
    url: string;
    etag: string | null;
    lastModified: string | null;
    contentHash: string | null;
    lastCheckedAt: string | null;
    lastChangedAt: string | null;
    metadataJson: string | null;
}
export interface UpsertSourceStateData {
    url: string;
    etag?: string | null;
    lastModified?: string | null;
    contentHash?: string | null;
    lastCheckedAt?: string | null;
    lastChangedAt?: string | null;
    metadataJson?: string | null;
}
export declare function getSourceState(sourceKey: string): Promise<SourceState | null>;
export declare function upsertSourceState(sourceKey: string, data: UpsertSourceStateData): Promise<void>;
export declare function getAllSourceStates(): Promise<SourceState[]>;
/** 薬価基準: 単一ファイルモード */
export declare const SOURCE_KEY_SINGLE = "drug:single";
/** 薬価基準: インデックスページ */
export declare const SOURCE_KEY_INDEX = "drug:index_page";
/** 包装単位 */
export declare const SOURCE_KEY_PACKAGE = "package:main";
/** 薬価基準: カテゴリファイル別キー */
export declare function sourceKeyForFile(category: string): string;
/**
 * ソースのヘッダー情報（ETag/Last-Modified/contentHash）を永続化する共通ヘルパー。
 * drug-master-scheduler / drug-package-scheduler から呼び出される。
 */
export declare function persistSourceHeaders(sourceKey: string, sourceUrl: string, data: {
    etag: string | null;
    lastModified: string | null;
    contentHash?: string | null;
}, changed: boolean): Promise<void>;
export declare function getSourceStatesByPrefix(prefix: string): Promise<SourceState[]>;
//# sourceMappingURL=drug-master-source-state-service.d.ts.map