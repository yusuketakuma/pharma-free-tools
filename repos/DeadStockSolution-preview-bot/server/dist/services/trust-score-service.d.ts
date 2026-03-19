export interface TrustScoreRow {
    pharmacyId: number;
    trustScore: number;
    ratingCount: number;
    positiveRate: number;
    updatedAt: string | null;
}
export declare function recalculateTrustScores(targetPharmacyIds?: number[]): Promise<void>;
export declare function recalculateTrustScoreForPharmacy(pharmacyId: number): Promise<void>;
export declare function triggerTrustScoreRecalculation(): {
    started: boolean;
    startedAt: string;
};
export declare function listTrustScores(page: number, limit: number): Promise<{
    data: Array<{
        id: number;
        email: string;
        name: string;
        prefecture: string;
        phone: string;
        fax: string;
        isActive: boolean;
        isAdmin: boolean;
        isTestAccount: boolean;
        createdAt: string | null;
        trustScore: number;
        ratingCount: number;
        positiveRate: number;
    }>;
    total: number;
}>;
//# sourceMappingURL=trust-score-service.d.ts.map