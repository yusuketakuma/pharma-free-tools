import { ColumnMapping } from '../types';
export interface UploadTypeDetectionResult {
    detectedType: 'dead_stock' | 'used_medication';
    confidence: 'high' | 'medium' | 'low';
    scores: {
        dead_stock: number;
        used_medication: number;
    };
}
export declare function parseColumnIndex(index: string | null | undefined): number;
export declare function getCell(row: unknown[], colIndex: number): unknown;
export declare function detectHeaderRow(rows: unknown[][]): number;
export declare function suggestMapping(headerRow: unknown[], uploadType: 'dead_stock' | 'used_medication'): ColumnMapping;
export declare function detectUploadType(rows: unknown[][], headerRowIndex: number): UploadTypeDetectionResult;
export declare function computeHeaderHash(headerRow: unknown[]): string;
//# sourceMappingURL=column-mapper.d.ts.map