export interface LogAlertEntry {
    source: string;
    severity: 'critical' | 'error' | 'warning';
    errorCode: string | null;
    message: string;
    logId: number;
    occurredAt: string;
    detail?: unknown;
}
type Severity = LogAlertEntry['severity'];
interface AlertPayload {
    type: 'log_alert';
    severity: string;
    logs: LogAlertEntry[];
    sentAt: string;
}
export declare function enqueueLogAlert(entry: LogAlertEntry): void;
export declare function flushBuffer(severity: Severity): Promise<void>;
export declare function buildAlertPayload(severity: Severity, entries: LogAlertEntry[]): AlertPayload;
export declare function getBufferSize(severity: string): number;
export declare function clearBuffer(): void;
export {};
//# sourceMappingURL=openclaw-log-push-service.d.ts.map