import { ColumnMapping } from '../types';
interface ExtractedDeadStock {
    drugCode: string | null;
    drugName: string;
    quantity: number;
    unit: string | null;
    yakkaUnitPrice: number | null;
    yakkaTotal: number | null;
    expirationDate: string | null;
    lotNumber: string | null;
}
interface ExtractedUsedMedication {
    drugCode: string | null;
    drugName: string;
    monthlyUsage: number | null;
    unit: string | null;
    yakkaUnitPrice: number | null;
}
export interface UploadExtractionIssue {
    rowNumber: number;
    issueCode: string;
    issueMessage: string;
    rowData: unknown[] | null;
}
export interface UploadExtractionResult<T> {
    rows: T[];
    issues: UploadExtractionIssue[];
    inspectedRowCount: number;
}
export declare function extractDeadStockRowsWithIssues(dataRows: unknown[][], mapping: ColumnMapping, startIndex?: number): UploadExtractionResult<ExtractedDeadStock>;
export declare function extractDeadStockRows(dataRows: unknown[][], mapping: ColumnMapping, startIndex?: number): ExtractedDeadStock[];
export declare function extractUsedMedicationRowsWithIssues(dataRows: unknown[][], mapping: ColumnMapping, startIndex?: number): UploadExtractionResult<ExtractedUsedMedication>;
export declare function extractUsedMedicationRows(dataRows: unknown[][], mapping: ColumnMapping, startIndex?: number): ExtractedUsedMedication[];
export {};
//# sourceMappingURL=data-extractor.d.ts.map