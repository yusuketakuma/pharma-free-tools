import type { ColumnMapping } from '../types';
import { type DiffSummary } from './upload-diff-service';
export type ApplyMode = 'replace' | 'diff' | 'partial';
export type UploadType = 'dead_stock' | 'used_medication';
export interface UploadConfirmExecutionParams {
    pharmacyId: number;
    uploadType: UploadType;
    originalFilename: string;
    jobId?: number;
    headerRowIndex: number;
    mapping: ColumnMapping;
    allRows: unknown[][];
    applyMode: ApplyMode;
    deleteMissing: boolean;
    staleGuardCreatedAt?: string | null;
}
export interface UploadConfirmExecutionResult {
    uploadId: number;
    rowCount: number;
    diffSummary: DiffSummary | null;
    partialSummary: PartialSummary | null;
}
export interface PartialSummary {
    inspectedRows: number;
    acceptedRows: number;
    rejectedRows: number;
    issueCounts: Record<string, number>;
}
export declare function runUploadConfirm(params: UploadConfirmExecutionParams): Promise<UploadConfirmExecutionResult>;
//# sourceMappingURL=upload-confirm-service.d.ts.map