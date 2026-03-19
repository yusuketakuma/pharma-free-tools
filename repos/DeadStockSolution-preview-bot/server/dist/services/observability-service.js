"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRequestMetric = recordRequestMetric;
exports.getObservabilitySnapshot = getObservabilitySnapshot;
exports.resetObservabilityMetrics = resetObservabilityMetrics;
const MAX_METRICS = 20000;
const metrics = new Array(MAX_METRICS);
let metricsCount = 0;
let nextWriteIndex = 0;
function percentile(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}
function round(value) {
    return Math.round(value * 100) / 100;
}
function recordRequestMetric(metric) {
    metrics[nextWriteIndex] = metric;
    nextWriteIndex = (nextWriteIndex + 1) % MAX_METRICS;
    if (metricsCount < MAX_METRICS) {
        metricsCount += 1;
    }
}
function getObservabilitySnapshot(windowMinutesRaw = 60) {
    const windowMinutes = Math.max(5, Math.min(1440, Math.floor(windowMinutesRaw)));
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    let totalRequests = 0;
    let errors5xx = 0;
    let authFailures401 = 0;
    let forbidden403 = 0;
    const durations = [];
    const pathMap = new Map();
    const startIndex = metricsCount === MAX_METRICS ? nextWriteIndex : 0;
    for (let offset = 0; offset < metricsCount; offset += 1) {
        const idx = (startIndex + offset) % MAX_METRICS;
        const metric = metrics[idx];
        if (!metric || metric.timestamp < cutoff)
            continue;
        totalRequests += 1;
        if (metric.status >= 500)
            errors5xx += 1;
        if (metric.status === 401)
            authFailures401 += 1;
        if (metric.status === 403)
            forbidden403 += 1;
        durations.push(metric.durationMs);
        const key = `${metric.method} ${metric.path}`;
        const list = pathMap.get(key);
        if (list) {
            list.push(metric.durationMs);
        }
        else {
            pathMap.set(key, [metric.durationMs]);
        }
    }
    durations.sort((a, b) => a - b);
    const avgLatencyMs = totalRequests === 0
        ? 0
        : round(durations.reduce((sum, value) => sum + value, 0) / totalRequests);
    const p95LatencyMs = round(percentile(durations, 95));
    const errorRate5xx = totalRequests === 0 ? 0 : round((errors5xx / totalRequests) * 100);
    const topSlowPaths = [...pathMap.entries()]
        .map(([path, durationsMs]) => {
        const sortedDurations = durationsMs.slice().sort((a, b) => a - b);
        const avg = sortedDurations.reduce((sum, value) => sum + value, 0) / sortedDurations.length;
        return {
            path,
            count: sortedDurations.length,
            avgLatencyMs: round(avg),
            p95LatencyMs: round(percentile(sortedDurations, 95)),
        };
    })
        .sort((a, b) => b.p95LatencyMs - a.p95LatencyMs || b.count - a.count)
        .slice(0, 5);
    return {
        windowMinutes,
        totalRequests,
        totalErrors5xx: errors5xx,
        errorRate5xx,
        authFailures401,
        forbidden403,
        avgLatencyMs,
        p95LatencyMs,
        topSlowPaths,
    };
}
function resetObservabilityMetrics() {
    metrics.fill(undefined);
    metricsCount = 0;
    nextWriteIndex = 0;
}
//# sourceMappingURL=observability-service.js.map