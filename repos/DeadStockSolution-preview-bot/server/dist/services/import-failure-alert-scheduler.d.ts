type WebhookUrlError = 'invalid' | 'insecure';
export interface ImportFailureAlertConfig {
    enabled: boolean;
    intervalMinutes: number;
    windowMinutes: number;
    threshold: number;
    cooldownMinutes: number;
    monitoredActions: string[];
    webhookUrl: string;
    webhookUrlError: WebhookUrlError | null;
    webhookToken: string;
    webhookTimeoutMs: number;
}
export interface ImportFailureAlertCheckResult {
    status: 'disabled' | 'below_threshold' | 'cooldown' | 'alerted';
    totalFailures: number;
    threshold: number;
    webhookDelivered: boolean;
}
export declare function getImportFailureAlertConfig(): ImportFailureAlertConfig;
export declare function runImportFailureAlertCheck(config?: ImportFailureAlertConfig, now?: Date): Promise<ImportFailureAlertCheckResult>;
export declare function startImportFailureAlertScheduler(): void;
export declare function stopImportFailureAlertScheduler(): void;
export declare function resetImportFailureAlertStateForTests(): void;
export {};
//# sourceMappingURL=import-failure-alert-scheduler.d.ts.map