interface RequestMetric {
    timestamp: number;
    path: string;
    method: string;
    status: number;
    durationMs: number;
}
interface SlowPathStat {
    path: string;
    count: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
}
export interface ObservabilitySnapshot {
    windowMinutes: number;
    totalRequests: number;
    totalErrors5xx: number;
    errorRate5xx: number;
    authFailures401: number;
    forbidden403: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    topSlowPaths: SlowPathStat[];
}
export declare function recordRequestMetric(metric: RequestMetric): void;
export declare function getObservabilitySnapshot(windowMinutesRaw?: number): ObservabilitySnapshot;
export declare function resetObservabilityMetrics(): void;
export {};
//# sourceMappingURL=observability-service.d.ts.map