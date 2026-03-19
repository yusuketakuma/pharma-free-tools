import { db } from '../config/database';
import { splitIntoChunks } from '../utils/array-utils';
interface RefreshJob {
    id: number;
    triggerPharmacyId: number;
    uploadType: 'dead_stock' | 'used_medication';
    attempts: number;
}
interface JobQueueExecutor {
    insert: typeof db.insert;
    select: typeof db.select;
    update: typeof db.update;
    delete: typeof db.delete;
    execute: typeof db.execute;
}
declare function runSingleRefresh(triggerPharmacyId: number, uploadType: 'dead_stock' | 'used_medication'): Promise<void>;
declare function claimNextRefreshJob(excludedJobIds?: number[]): Promise<RefreshJob | null>;
export declare function processPendingMatchingRefreshJobs(limit?: number): Promise<number>;
export declare function triggerMatchingRefreshOnUpload(params: {
    triggerPharmacyId: number;
    uploadType: 'dead_stock' | 'used_medication';
}, executor?: JobQueueExecutor): Promise<void>;
export declare const __testables: {
    claimNextRefreshJob: typeof claimNextRefreshJob;
    runSingleRefresh: typeof runSingleRefresh;
    splitIntoChunks: typeof splitIntoChunks;
};
export {};
//# sourceMappingURL=matching-refresh-service.d.ts.map