import { db } from '../config/database';
interface DeadStockDiffInput {
    drugCode: string | null;
    drugName: string;
    drugMasterId?: number | null;
    drugMasterPackageId?: number | null;
    packageLabel?: string | null;
    quantity: number;
    unit: string | null;
    yakkaUnitPrice: number | null;
    yakkaTotal: number | null;
    expirationDate: string | null;
    lotNumber: string | null;
}
interface UsedMedicationDiffInput {
    drugCode: string | null;
    drugName: string;
    drugMasterId?: number | null;
    drugMasterPackageId?: number | null;
    packageLabel?: string | null;
    monthlyUsage: number | null;
    unit: string | null;
    yakkaUnitPrice: number | null;
}
export interface DiffSummary {
    inserted: number;
    updated: number;
    deactivated: number;
    unchanged: number;
    totalIncoming: number;
}
export interface ApplyDiffOptions {
    deleteMissing: boolean;
}
type UploadDiffTx = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete' | 'execute'>;
export declare function previewDeadStockDiff(pharmacyId: number, incoming: DeadStockDiffInput[], options: ApplyDiffOptions): Promise<DiffSummary>;
export declare function applyDeadStockDiff(tx: UploadDiffTx, pharmacyId: number, uploadId: number, incoming: DeadStockDiffInput[], options: ApplyDiffOptions): Promise<DiffSummary>;
export declare function previewUsedMedicationDiff(pharmacyId: number, incoming: UsedMedicationDiffInput[], options: ApplyDiffOptions): Promise<DiffSummary>;
export declare function applyUsedMedicationDiff(tx: UploadDiffTx, pharmacyId: number, uploadId: number, incoming: UsedMedicationDiffInput[], options: ApplyDiffOptions): Promise<DiffSummary>;
export {};
//# sourceMappingURL=upload-diff-service.d.ts.map