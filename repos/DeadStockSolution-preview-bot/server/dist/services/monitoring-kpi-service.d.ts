interface MonitoringKpiThresholds {
    errorRate5xx: number;
    uploadFailureRate: number;
    pendingStaleCount: number;
    pendingStaleMinutes: number;
}
interface MonitoringKpiBreaches {
    errorRate5xx: boolean;
    uploadFailureRate: boolean;
    pendingStaleCount: boolean;
}
interface MonitoringKpiMetrics {
    errorRate5xx: number;
    uploadFailureRate: number;
    pendingUploadStaleCount: number;
}
export interface MonitoringKpiSnapshot {
    status: 'healthy' | 'warning';
    metrics: MonitoringKpiMetrics;
    thresholds: MonitoringKpiThresholds;
    breaches: MonitoringKpiBreaches;
    context: {
        windowMinutes: number;
        uploadWindowHours: number;
    };
}
export declare function getMonitoringKpiSnapshot(windowMinutesRaw?: number): Promise<MonitoringKpiSnapshot>;
export {};
//# sourceMappingURL=monitoring-kpi-service.d.ts.map