import { cancelUploadConfirmJobByAdmin, isUploadConfirmRetryUnavailableError, retryUploadConfirmJobByAdmin } from './upload-confirm-job-service';
import { type ApplyMode, type UploadType } from './upload-confirm-service';
type StoredUploadJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type UploadJobStatus = StoredUploadJobStatus | 'canceled';
export interface AdminUploadJobListFilters {
    page: number;
    limit: number;
    pharmacyId?: number;
    status?: UploadJobStatus;
    uploadType?: UploadType;
    applyMode?: ApplyMode;
    keyword?: string;
}
export interface AdminUploadJobSummary {
    id: number;
    pharmacyId: number;
    pharmacyName: string | null;
    uploadType: UploadType;
    originalFilename: string;
    status: UploadJobStatus;
    applyMode: ApplyMode;
    attempts: number;
    deduplicated: boolean;
    cancelable: boolean;
    canceledAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    completedAt: string | null;
    partialSummary: unknown;
    errorReportAvailable: boolean;
}
export interface AdminUploadJobDetail extends AdminUploadJobSummary {
    idempotencyKey: string | null;
    fileHash: string;
    deleteMissing: boolean;
    lastError: string | null;
    result: unknown;
    issueCount: number;
}
export interface AdminUploadJobErrorReport {
    filename: string;
    contentType: string;
    body: string;
    issueCount: number;
}
export interface AdminUploadJobListResult {
    data: AdminUploadJobSummary[];
    total: number;
}
export declare function listAdminUploadJobs(filters: AdminUploadJobListFilters): Promise<AdminUploadJobListResult>;
export declare function getAdminUploadJobDetail(jobId: number): Promise<AdminUploadJobDetail | null>;
export declare function cancelAdminUploadJob(jobId: number, adminPharmacyId: number): Promise<Awaited<ReturnType<typeof cancelUploadConfirmJobByAdmin>>>;
export declare function retryAdminUploadJob(jobId: number): Promise<Awaited<ReturnType<typeof retryUploadConfirmJobByAdmin>>>;
export declare function getAdminUploadJobErrorReport(jobId: number, format: 'csv' | 'json'): Promise<AdminUploadJobErrorReport | null>;
export { isUploadConfirmRetryUnavailableError };
//# sourceMappingURL=admin-upload-job-service.d.ts.map