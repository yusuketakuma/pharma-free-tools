"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonitoringKpiSnapshot = getMonitoringKpiSnapshot;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const observability_service_1 = require("./observability-service");
function resolveThresholdPercent(name, fallback) {
    const raw = Number(process.env[name] ?? fallback);
    if (!Number.isFinite(raw))
        return fallback;
    return Math.max(0, Math.min(100, raw));
}
function resolveThresholdCount(name, fallback) {
    const raw = Number(process.env[name] ?? fallback);
    if (!Number.isFinite(raw))
        return fallback;
    return Math.max(0, Math.floor(raw));
}
function round2(value) {
    return Math.round(value * 100) / 100;
}
function resolveThresholds() {
    const pendingStaleMinutes = resolveThresholdCount('MONITORING_PENDING_UPLOAD_STALE_MINUTES', 60);
    return {
        errorRate5xx: resolveThresholdPercent('MONITORING_ERROR_RATE_5XX_THRESHOLD', 2),
        uploadFailureRate: resolveThresholdPercent('MONITORING_UPLOAD_FAILURE_RATE_THRESHOLD', 10),
        pendingStaleCount: resolveThresholdCount('MONITORING_PENDING_UPLOAD_STALE_COUNT_THRESHOLD', 5),
        pendingStaleMinutes,
    };
}
async function getMonitoringKpiSnapshot(windowMinutesRaw = 60) {
    const observability = (0, observability_service_1.getObservabilitySnapshot)(windowMinutesRaw);
    const thresholds = resolveThresholds();
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const staleBefore = new Date(now - thresholds.pendingStaleMinutes * 60 * 1000).toISOString();
    const [[failedJobs], [completedJobs], [pendingStaleJobs],] = await Promise.all([
        database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.uploadConfirmJobs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'failed'), (0, drizzle_orm_1.gte)(schema_1.uploadConfirmJobs.createdAt, since24h))),
        database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.uploadConfirmJobs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'completed'), (0, drizzle_orm_1.gte)(schema_1.uploadConfirmJobs.createdAt, since24h))),
        database_1.db.select({ count: db_utils_1.rowCount })
            .from(schema_1.uploadConfirmJobs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'pending'), (0, drizzle_orm_1.lte)(schema_1.uploadConfirmJobs.createdAt, staleBefore))),
    ]);
    const failedCount = failedJobs.count;
    const completedCount = completedJobs.count;
    const pendingStaleCount = pendingStaleJobs.count;
    const totalHandled = failedCount + completedCount;
    const uploadFailureRate = totalHandled === 0
        ? 0
        : round2((failedCount / totalHandled) * 100);
    const metrics = {
        errorRate5xx: observability.errorRate5xx,
        uploadFailureRate,
        pendingUploadStaleCount: pendingStaleCount,
    };
    const breaches = {
        errorRate5xx: metrics.errorRate5xx >= thresholds.errorRate5xx,
        uploadFailureRate: metrics.uploadFailureRate >= thresholds.uploadFailureRate,
        pendingStaleCount: metrics.pendingUploadStaleCount >= thresholds.pendingStaleCount,
    };
    const status = Object.values(breaches).some(Boolean)
        ? 'warning'
        : 'healthy';
    return {
        status,
        metrics,
        thresholds,
        breaches,
        context: {
            windowMinutes: observability.windowMinutes,
            uploadWindowHours: 24,
        },
    };
}
//# sourceMappingURL=monitoring-kpi-service.js.map