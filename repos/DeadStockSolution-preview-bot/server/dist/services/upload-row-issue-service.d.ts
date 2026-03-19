import { db } from '../config/database';
export type UploadRowIssueUploadType = 'dead_stock' | 'used_medication';
export interface UploadRowIssueInput {
    rowNumber: number;
    issueCode: string;
    issueMessage: string;
    rowData: unknown[] | Record<string, unknown> | null;
}
export interface UploadRowIssueRecord {
    id: number;
    jobId: number;
    pharmacyId: number;
    uploadType: UploadRowIssueUploadType;
    rowNumber: number;
    issueCode: string;
    issueMessage: string;
    rowDataJson: string | null;
    createdAt: string | null;
}
export interface UploadRowIssueSummary {
    totalIssues: number;
    byCode: Record<string, number>;
}
type UploadRowIssueReadExecutor = Pick<typeof db, 'select'>;
type UploadRowIssueWriteExecutor = Pick<typeof db, 'insert' | 'delete'>;
export declare function replaceUploadRowIssuesForJob(jobId: number, pharmacyId: number, uploadType: UploadRowIssueUploadType, issues: UploadRowIssueInput[], executor?: UploadRowIssueWriteExecutor): Promise<void>;
export declare function clearUploadRowIssuesForJob(jobId: number, executor?: UploadRowIssueWriteExecutor): Promise<void>;
export declare function getUploadRowIssueCountByJobIds(jobIds: number[], executor?: UploadRowIssueReadExecutor): Promise<Map<number, number>>;
export declare function getUploadRowIssueCountByJobId(jobId: number, executor?: UploadRowIssueReadExecutor): Promise<number>;
export declare function getUploadRowIssuesForJob(jobId: number, options?: {
    limit?: number;
    offset?: number;
}, executor?: UploadRowIssueReadExecutor): Promise<UploadRowIssueRecord[]>;
export declare function getUploadRowIssueSummary(jobId: number, executor?: UploadRowIssueReadExecutor): Promise<UploadRowIssueSummary>;
export declare function getUploadRowIssueSummaryByJobIds(jobIds: number[], executor?: UploadRowIssueReadExecutor): Promise<Map<number, UploadRowIssueSummary>>;
export declare function buildUploadRowIssueCsv(issues: UploadRowIssueRecord[]): string;
export {};
//# sourceMappingURL=upload-row-issue-service.d.ts.map