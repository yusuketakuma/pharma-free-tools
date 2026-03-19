export interface MonthlyReportMetrics {
    year: number;
    month: number;
    periodStart: string;
    periodEnd: string;
    proposalCount: number;
    completedExchangeCount: number;
    rejectedProposalCount: number;
    confirmedProposalCount: number;
    totalExchangeValue: number;
    uploadCount: number;
    deadStockUploadCount: number;
    usedMedicationUploadCount: number;
    nearExpiryItemCount: number;
    expiredItemCount: number;
}
export declare function resolveDefaultTargetMonth(now?: Date): {
    year: number;
    month: number;
};
export declare function validateYearMonth(year: number, month: number): void;
export declare function buildMonthlyReportMetrics(year: number, month: number): Promise<MonthlyReportMetrics>;
export declare function generateMonthlyReport(year: number, month: number, generatedBy: number | null): Promise<{
    id: number;
    year: number;
    month: number;
    generatedAt: string | null;
    metrics: MonthlyReportMetrics;
}>;
export declare function listMonthlyReports(page: number, limit: number): Promise<{
    data: Array<{
        id: number;
        year: number;
        month: number;
        status: 'success' | 'failed';
        generatedBy: number | null;
        generatedAt: string | null;
    }>;
    total: number;
}>;
export declare function getMonthlyReportById(id: number): Promise<{
    id: number;
    year: number;
    month: number;
    status: 'success' | 'failed';
    generatedAt: string | null;
    reportJson: string;
} | null>;
export declare function monthlyReportToCsv(metrics: MonthlyReportMetrics): string;
//# sourceMappingURL=monthly-report-service.d.ts.map