export declare const LOG_SOURCES: readonly ["activity_logs", "system_events", "drug_master_sync_logs"];
export type LogSource = (typeof LOG_SOURCES)[number];
export interface NormalizedLogEntry {
    id: number;
    source: LogSource;
    level: 'critical' | 'error' | 'warning' | 'info';
    category: string;
    errorCode: string | null;
    message: string;
    detail: unknown;
    pharmacyId: number | null;
    timestamp: string;
}
export interface LogCenterQuery {
    sources?: LogSource[];
    level?: NormalizedLogEntry['level'];
    search?: string;
    pharmacyId?: number;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}
export interface LogSummary {
    total: number;
    errors: number;
    warnings: number;
    today: number;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
}
export declare function normalizeLogEntry(source: LogSource, row: Record<string, unknown>): NormalizedLogEntry;
export declare function queryLogs(query: LogCenterQuery): Promise<{
    entries: NormalizedLogEntry[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getLogSummary(): Promise<LogSummary>;
//# sourceMappingURL=log-center-service.d.ts.map