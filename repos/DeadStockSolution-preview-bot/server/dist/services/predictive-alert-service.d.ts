export interface RunPredictiveAlertsOptions {
    nearExpiryDays?: number;
    excessStockMonths?: number;
    now?: Date;
}
export interface PredictiveAlertsJobResult {
    processedPharmacies: number;
    generatedAlerts: number;
    nearExpiryAlerts: number;
    excessStockAlerts: number;
    duplicateAlerts: number;
    failedAlerts: number;
    generatedAt: string;
}
export declare function runPredictiveAlertsJob(options?: RunPredictiveAlertsOptions): Promise<PredictiveAlertsJobResult>;
//# sourceMappingURL=predictive-alert-service.d.ts.map