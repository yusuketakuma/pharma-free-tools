import { type ColumnMapping } from '../types';
import { type ApplyMode, type UploadType } from './upload-confirm-service';
export declare const UPLOAD_CONFIRM_QUEUE_LIMIT_ERROR_CODE = "UPLOAD_CONFIRM_QUEUE_LIMIT";
export declare const UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT_ERROR_CODE = "UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT";
export declare const UPLOAD_CONFIRM_RETRY_UNAVAILABLE_ERROR_CODE = "UPLOAD_CONFIRM_RETRY_UNAVAILABLE";
interface EnqueueUploadConfirmJobParams {
    pharmacyId: number;
    uploadType: UploadType;
    originalFilename: string;
    idempotencyKey?: string | null;
    headerRowIndex: number;
    mapping: ColumnMapping;
    applyMode: ApplyMode;
    deleteMissing: boolean;
    fileBuffer: Buffer;
    requestedAtIso?: string;
}
export interface EnqueueUploadConfirmJobResult {
    jobId: number;
    status: UploadConfirmJobStatus;
    deduplicated: boolean;
    cancelable: boolean;
    canceledAt: string | null;
}
type UploadConfirmJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
interface UploadConfirmJobRecord {
    id: number;
    pharmacyId: number;
    uploadType: UploadType;
    originalFilename: string;
    idempotencyKey: string | null;
    fileHash: string;
    headerRowIndex: number;
    mappingJson: string;
    status: UploadConfirmJobStatus;
    applyMode: ApplyMode;
    deleteMissing: boolean;
    deduplicated: boolean;
    fileBase64: string;
    attempts: number;
    lastError: string | null;
    resultJson: string | null;
    cancelRequestedAt: string | null;
    canceledAt: string | null;
    canceledBy: number | null;
    processingStartedAt: string | null;
    nextRetryAt: string | null;
    completedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}
export interface UploadConfirmQueueLimitError extends Error {
    code: typeof UPLOAD_CONFIRM_QUEUE_LIMIT_ERROR_CODE;
    limit: number;
    activeJobs: number;
}
export interface UploadConfirmIdempotencyConflictError extends Error {
    code: typeof UPLOAD_CONFIRM_IDEMPOTENCY_CONFLICT_ERROR_CODE;
}
export interface UploadConfirmRetryUnavailableError extends Error {
    code: typeof UPLOAD_CONFIRM_RETRY_UNAVAILABLE_ERROR_CODE;
}
export type UploadConfirmJobView = Omit<UploadConfirmJobRecord, 'headerRowIndex' | 'mappingJson' | 'fileBase64' | 'processingStartedAt' | 'nextRetryAt'> & {
    issueCount: number;
    cancelable: boolean;
};
export interface CancelUploadConfirmJobResult {
    id: number;
    status: UploadConfirmJobStatus;
    canceledAt: string | null;
    cancelRequestedAt: string | null;
    cancelable: boolean;
}
export interface RetryUploadConfirmJobResult {
    id: number;
    status: UploadConfirmJobStatus;
    cancelable: boolean;
    canceledAt: string | null;
}
export declare function isUploadConfirmQueueLimitError(error: unknown): error is UploadConfirmQueueLimitError;
export declare function isUploadConfirmIdempotencyConflictError(error: unknown): error is UploadConfirmIdempotencyConflictError;
export declare function isUploadConfirmRetryUnavailableError(error: unknown): error is UploadConfirmRetryUnavailableError;
export declare function enqueueUploadConfirmJob(params: EnqueueUploadConfirmJobParams): Promise<EnqueueUploadConfirmJobResult>;
export declare function ensureUploadConfirmQueueHasCapacity(pharmacyId: number): Promise<void>;
export declare function processUploadConfirmJobById(jobId: number): Promise<boolean>;
export declare function processPendingUploadConfirmJobs(limit?: number): Promise<number>;
export declare function cleanupUploadConfirmJobs(limit?: number): Promise<number>;
export declare function getUploadConfirmJobById(jobId: number): Promise<UploadConfirmJobView | null>;
export declare function getUploadConfirmJobForPharmacy(jobId: number, pharmacyId: number): Promise<UploadConfirmJobView | null>;
export declare function cancelUploadConfirmJobByAdmin(jobId: number, adminPharmacyId: number): Promise<CancelUploadConfirmJobResult | null>;
export declare function cancelUploadConfirmJobForPharmacy(jobId: number, pharmacyId: number): Promise<CancelUploadConfirmJobResult | null>;
export declare function retryUploadConfirmJobByAdmin(jobId: number): Promise<RetryUploadConfirmJobResult | null>;
export {};
//# sourceMappingURL=upload-confirm-job-service.d.ts.map