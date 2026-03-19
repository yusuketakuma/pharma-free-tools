export interface RiskBucketCounts {
    expired: number;
    within30: number;
    within60: number;
    within90: number;
    within120: number;
    over120: number;
    unknown: number;
}
export interface ExpiryRiskItem {
    id: number;
    pharmacyId: number;
    pharmacyName?: string;
    drugName: string;
    quantity: number;
    unit: string | null;
    yakkaTotal: number;
    expirationDate: string | null;
    daysUntilExpiry: number | null;
    bucket: keyof RiskBucketCounts;
}
export interface PharmacyRiskSummary {
    pharmacyId: number;
    pharmacyName: string;
    totalItems: number;
    riskScore: number;
    bucketCounts: RiskBucketCounts;
}
export interface PharmacyRiskDetail {
    pharmacyId: number;
    totalItems: number;
    riskScore: number;
    bucketCounts: RiskBucketCounts;
    topRiskItems: ExpiryRiskItem[];
    computedAt: string;
}
export interface AdminRiskOverview {
    totalPharmacies: number;
    highRiskPharmacies: number;
    mediumRiskPharmacies: number;
    lowRiskPharmacies: number;
    avgRiskScore: number;
    totalBucketCounts: RiskBucketCounts;
    topHighRiskPharmacies: PharmacyRiskSummary[];
    computedAt: string;
}
export declare function invalidateAdminRiskSnapshotCache(): void;
export declare function getPharmacyRiskDetail(pharmacyId: number): Promise<PharmacyRiskDetail>;
export declare function getAdminRiskOverview(): Promise<AdminRiskOverview>;
export declare function getAdminPharmacyRiskPage(page: number, limit: number): Promise<{
    data: PharmacyRiskSummary[];
    total: number;
}>;
//# sourceMappingURL=expiry-risk-service.d.ts.map