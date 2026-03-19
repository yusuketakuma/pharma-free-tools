"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeLog = writeLog;
exports.getClientIp = getClientIp;
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const logger_1 = require("./logger");
const openclaw_log_push_service_1 = require("./openclaw-log-push-service");
async function writeLog(action, options = {}) {
    try {
        const metadataJson = (() => {
            if (options.metadataJson === undefined || options.metadataJson === null) {
                return null;
            }
            if (typeof options.metadataJson === 'string') {
                return options.metadataJson;
            }
            try {
                return JSON.stringify(options.metadataJson);
            }
            catch {
                return null;
            }
        })();
        await database_1.db.insert(schema_1.activityLogs).values({
            pharmacyId: options.pharmacyId ?? null,
            action,
            detail: options.detail ?? null,
            resourceType: options.resourceType ?? null,
            resourceId: options.resourceId !== undefined && options.resourceId !== null
                ? String(options.resourceId)
                : null,
            metadataJson,
            ipAddress: options.ipAddress ?? null,
            errorCode: options.errorCode ?? null,
        });
        // Forward failures to OpenClaw
        const isFailure = options.detail?.startsWith('失敗|') ?? false;
        const isFailedAction = action === 'login_failed' || action === 'password_reset_failed';
        if (isFailure || isFailedAction) {
            try {
                (0, openclaw_log_push_service_1.enqueueLogAlert)({
                    source: 'activity_logs',
                    severity: isFailure ? 'error' : 'warning',
                    errorCode: options.errorCode ?? null,
                    message: `[${action}] ${options.detail ?? ''}`.trim(),
                    logId: 0,
                    occurredAt: new Date().toISOString(),
                });
            }
            catch {
                // Log push should never break the main flow
            }
        }
    }
    catch (err) {
        // Logging should never break the main flow
        logger_1.logger.error('Failed to write activity log', {
            action,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}
function getClientIp(req) {
    // Rely on Express trust proxy setting for correct client IP via req.ip
    return req.ip ?? 'unknown';
}
//# sourceMappingURL=log-service.js.map