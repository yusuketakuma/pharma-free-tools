export declare function startDrugPackageScheduler(): void;
export declare function stopDrugPackageScheduler(): void;
export declare function triggerManualPackageAutoSync(options?: {
    sourceUrl?: string | null;
}): Promise<{
    triggered: boolean;
    message: string;
}>;
//# sourceMappingURL=drug-package-scheduler.d.ts.map