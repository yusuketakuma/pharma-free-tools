import { MonitoringKpiSnapshot } from './monitoring-kpi-service';
export interface MonitoringKpiAlertCheckResult {
    status: 'disabled' | 'healthy' | 'cooldown' | 'alerted' | 'failed';
    notified: boolean;
    snapshot: MonitoringKpiSnapshot | null;
}
export declare function runMonitoringKpiAlertCheck(): Promise<MonitoringKpiAlertCheckResult>;
export declare function startMonitoringKpiAlertScheduler(): void;
export declare function stopMonitoringKpiAlertScheduler(): void;
export declare function resetMonitoringKpiAlertSchedulerForTests(): void;
//# sourceMappingURL=monitoring-kpi-alert-scheduler.d.ts.map