export declare function normalizeString(value: string | null | undefined): string;
export declare function normalizeNullableNumber(value: number | null | undefined): number | null;
export declare function normalizeDate(value: string | null | undefined): string | null;
export declare function deadStockKey(item: {
    drugCode: string | null;
    drugName: string;
    unit: string | null;
    expirationDate: string | null;
    lotNumber: string | null;
}): string;
export declare function usedMedicationKey(item: {
    drugCode: string | null;
    drugName: string;
    unit: string | null;
}): string;
export declare function equalNullableNumber(a: number | string | null, b: number | null): boolean;
export declare function dedupeIncomingByKey<T>(incoming: T[], keyFn: (item: T) => string): T[];
export declare function buildExistingByKey<T>(existing: T[], keyFn: (item: T) => string): Map<string, T>;
//# sourceMappingURL=upload-diff-utils.d.ts.map