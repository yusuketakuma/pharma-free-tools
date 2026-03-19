import { ParsedDrugRow, ParsedPackageRow } from './drug-master-parser-service';
export interface SyncResult {
    itemsProcessed: number;
    itemsAdded: number;
    itemsUpdated: number;
    itemsDeleted: number;
}
export declare function syncDrugMaster(parsedRows: ParsedDrugRow[], syncLogId: number, revisionDate: string): Promise<SyncResult>;
export declare function syncPackageData(parsedRows: ParsedPackageRow[]): Promise<{
    added: number;
    updated: number;
}>;
export declare function createSyncLog(syncType: string, sourceDescription: string, triggeredBy: number | null): Promise<{
    id: number;
    status: "failed" | "running" | "success" | "partial";
    completedAt: string | null;
    syncType: string;
    sourceDescription: string | null;
    itemsProcessed: number | null;
    itemsAdded: number | null;
    itemsUpdated: number | null;
    itemsDeleted: number | null;
    errorMessage: string | null;
    startedAt: string | null;
    triggeredBy: number | null;
}>;
export declare function completeSyncLog(logId: number, status: 'success' | 'failed' | 'partial', result: SyncResult, errorMessage?: string): Promise<void>;
//# sourceMappingURL=drug-master-sync-service.d.ts.map