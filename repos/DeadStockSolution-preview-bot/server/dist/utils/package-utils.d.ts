export type PackageForm = 'loose' | 'ptp' | 'bottle' | 'sachet' | 'vial' | 'ampoule' | 'other' | null;
export interface NormalizedPackageInfo {
    normalizedPackageLabel: string | null;
    packageForm: PackageForm;
    isLoosePackage: boolean;
    quantity: number | null;
    unit: string | null;
}
export declare function normalizePackageInfo(input: {
    packageDescription?: string | null;
    packageQuantity?: number | null;
    packageUnit?: string | null;
}): NormalizedPackageInfo;
export declare function scorePackageMatch(options: {
    rowUnit: string | null;
    normalizedPackageLabel: string | null;
    packageDescription: string | null;
    isLoosePackage: boolean;
}): number;
//# sourceMappingURL=package-utils.d.ts.map