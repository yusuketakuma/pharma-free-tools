import { Request, Response, NextFunction } from 'express';
import { AuthRequest, ColumnMapping } from '../types';
export declare const MAX_UPLOAD_SIZE: number;
export declare const MAX_MAPPING_KEYS = 30;
export declare const MAX_MAPPING_COLUMN_INDEX = 199;
export declare const INSERT_BATCH_SIZE = 500;
export declare const ALLOWED_EXTENSIONS: Set<string>;
export declare const ALLOWED_MIME_TYPES: Set<string>;
export type UploadType = 'dead_stock' | 'used_medication';
export declare const VALID_UPLOAD_TYPES: Set<UploadType>;
export declare const DEAD_STOCK_FIELD_SET: Set<string>;
export declare const USED_MEDICATION_FIELD_SET: Set<string>;
export declare function getBaseContext(req: Request): Record<string, unknown>;
export { getErrorMessage } from '../middleware/error-handler';
export declare function sanitizeLogValue(value: unknown, maxLength?: number): string | null;
export declare function logUploadFailure(req: Request, phase: string, reason: string, extra?: Record<string, unknown>): void;
export declare function uploadSingleFile(req: Request, res: Response, next: NextFunction): void;
export declare function parseMapping(raw: unknown, uploadType: UploadType): ColumnMapping;
export declare function parseUploadType(raw: unknown): UploadType | null;
export declare function getUploadFileOrReject(req: AuthRequest, res: Response): Express.Multer.File | null;
export declare function getUploadTypeOrReject(req: AuthRequest, res: Response): UploadType | null;
export declare function parseExcelRowsOrReject(req: AuthRequest, res: Response, phase: 'preview' | 'confirm', fileBuffer: Buffer): Promise<unknown[][] | null>;
export declare function parseHeaderRowIndexOrReject(req: AuthRequest, res: Response): number | null;
export declare function validateMappingAgainstHeader(mapping: ColumnMapping, headerRow: unknown[]): void;
export interface ResolvedTemplateMapping {
    mapping: ColumnMapping;
    fromSavedTemplate: boolean;
}
export declare function resolveMappingFromTemplateWithSource(savedMappingRaw: string | null | undefined, headerRow: unknown[], uploadType: UploadType): ResolvedTemplateMapping;
export declare function resolveMappingFromTemplate(savedMappingRaw: string | null | undefined, headerRow: unknown[], uploadType: UploadType): ColumnMapping;
//# sourceMappingURL=upload-validation.d.ts.map