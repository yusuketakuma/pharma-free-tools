import { MatchCandidate } from '../types';
interface TopCandidateDigest {
    pharmacyId: number;
    score: number;
    matchRate: number;
    valueDifference: number;
    totalValueA: number;
    totalValueB: number;
    itemCountA: number;
    itemCountB: number;
    mutualStagnantItems: number;
    mutualNearExpiryItems: number;
    estimatedWasteAvoidanceYen: number;
    estimatedWorkingCapitalReleaseYen: number;
}
interface SnapshotPayload {
    hash: string;
    candidateCount: number;
    topCandidates: TopCandidateDigest[];
}
interface SnapshotHashItem {
    deadStockItemId: number;
    quantity: number;
}
interface SnapshotHashEntry {
    pharmacyId: number;
    totalValueA: number;
    totalValueB: number;
    valueDifference: number;
    itemsFromA: SnapshotHashItem[];
    itemsFromB: SnapshotHashItem[];
}
interface SnapshotDiff {
    addedPharmacyIds: number[];
    removedPharmacyIds: number[];
    beforeCount: number;
    afterCount: number;
}
export declare function buildTopCandidateDigest(candidates: readonly MatchCandidate[], limit?: number): TopCandidateDigest[];
export declare function buildSnapshotHashInput(candidates: readonly MatchCandidate[], limit?: number): SnapshotHashEntry[];
export declare function createCandidateHash(hashEntries: SnapshotHashEntry[]): string;
export declare function createSnapshotPayload(candidates: MatchCandidate[]): SnapshotPayload;
export declare function calculateSnapshotDiff(beforeTopCandidates: TopCandidateDigest[], afterTopCandidates: TopCandidateDigest[], beforeCount: number, afterCount: number): SnapshotDiff;
export declare function saveMatchSnapshotAndNotifyOnChange(params: {
    pharmacyId: number;
    triggerPharmacyId: number;
    triggerUploadType: 'dead_stock' | 'used_medication';
    candidates: MatchCandidate[];
    notifyEnabled?: boolean;
}): Promise<{
    changed: boolean;
    beforeCount: number;
    afterCount: number;
}>;
export {};
//# sourceMappingURL=matching-snapshot-service.d.ts.map