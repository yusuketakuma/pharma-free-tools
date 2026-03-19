import { type DiscoveredFile } from './mhlw-index-scraper';
export interface MultiFileSyncResult {
    indexUrl: string;
    discoveredFiles: DiscoveredFile[];
    allUnchanged: boolean;
    syncResult?: {
        itemsProcessed: number;
        itemsAdded: number;
        itemsUpdated: number;
        itemsDeleted: number;
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
export declare function runMultiFileSync(): Promise<MultiFileSyncResult>;
//# sourceMappingURL=mhlw-multi-file-fetcher.d.ts.map