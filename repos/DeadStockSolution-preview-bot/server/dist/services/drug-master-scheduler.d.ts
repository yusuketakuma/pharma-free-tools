export type SourceMode = 'index' | 'single';
declare function getConfiguredSourceMode(): SourceMode;
/**
 * 自動同期スケジューラを開始する
 * サーバー起動時に呼び出す
 */
export declare function startDrugMasterScheduler(): void;
/**
 * スケジューラを停止する
 */
export declare function stopDrugMasterScheduler(): void;
/**
 * 手動で即時チェック＆同期をトリガーする（管理者API用）
 */
export declare function triggerManualAutoSync(options?: {
    sourceUrl?: string | null;
    sourceMode?: SourceMode;
}): Promise<{
    triggered: boolean;
    message: string;
}>;
/** 現在設定されているソースモードを返す（API用） */
export { getConfiguredSourceMode };
//# sourceMappingURL=drug-master-scheduler.d.ts.map