"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSystemEvent = recordSystemEvent;
exports.recordHttpUnhandledError = recordHttpUnhandledError;
exports.recordUnhandledRejection = recordUnhandledRejection;
exports.recordUncaughtException = recordUncaughtException;
exports.recordVercelDeployEvent = recordVercelDeployEvent;
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const logger_1 = require("./logger");
const openclaw_log_push_service_1 = require("./openclaw-log-push-service");
const MAX_MESSAGE_LENGTH = 2000;
const MAX_DETAIL_LENGTH = 12000;
function sanitizeMessage(value) {
    const trimmed = value.trim();
    if (trimmed.length <= MAX_MESSAGE_LENGTH)
        return trimmed;
    return `${trimmed.slice(0, MAX_MESSAGE_LENGTH)}...`;
}
function toDetailJson(detail) {
    if (detail === undefined || detail === null)
        return null;
    if (typeof detail === 'string') {
        return detail.length > MAX_DETAIL_LENGTH ? `${detail.slice(0, MAX_DETAIL_LENGTH)}...` : detail;
    }
    try {
        const serialized = JSON.stringify(detail);
        if (!serialized)
            return null;
        return serialized.length > MAX_DETAIL_LENGTH ? `${serialized.slice(0, MAX_DETAIL_LENGTH)}...` : serialized;
    }
    catch {
        return null;
    }
}
async function recordSystemEvent(input) {
    try {
        await database_1.db.insert(schema_1.systemEvents).values({
            source: input.source,
            level: input.level ?? 'error',
            eventType: sanitizeMessage(input.eventType),
            message: sanitizeMessage(input.message),
            detailJson: toDetailJson(input.detail),
            errorCode: input.errorCode ?? null,
            occurredAt: input.occurredAt ?? new Date().toISOString(),
        });
        // Forward errors/warnings to OpenClaw
        const effectiveLevel = input.level ?? 'error';
        if (effectiveLevel === 'error' || effectiveLevel === 'warning') {
            try {
                (0, openclaw_log_push_service_1.enqueueLogAlert)({
                    source: 'system_events',
                    severity: effectiveLevel === 'error' ? 'error' : 'warning',
                    errorCode: input.errorCode ?? null,
                    message: sanitizeMessage(input.message),
                    logId: 0,
                    occurredAt: input.occurredAt ?? new Date().toISOString(),
                });
            }
            catch {
                // Log push should never break event recording
            }
        }
        return true;
    }
    catch (err) {
        logger_1.logger.error('Failed to persist system event', {
            source: input.source,
            eventType: input.eventType,
            error: err instanceof Error ? err.message : String(err),
        });
        return false;
    }
}
async function recordHttpUnhandledError(input) {
    return recordSystemEvent({
        source: 'runtime_error',
        level: input.status >= 500 ? 'error' : 'warning',
        eventType: 'http_unhandled_error',
        message: `${input.method} ${input.path} -> ${input.status}`,
        detail: {
            status: input.status,
            requestId: input.requestId ?? null,
            code: input.errorCode ?? null,
        },
    });
}
async function recordUnhandledRejection(reason) {
    return recordSystemEvent({
        source: 'unhandled_rejection',
        level: 'error',
        eventType: 'process_unhandled_rejection',
        message: reason instanceof Error ? reason.message : String(reason),
        detail: reason instanceof Error
            ? { errorName: reason.name }
            : { reason: String(reason) },
    });
}
async function recordUncaughtException(err) {
    const message = err instanceof Error ? err.message : String(err);
    return recordSystemEvent({
        source: 'uncaught_exception',
        level: 'error',
        eventType: 'process_uncaught_exception',
        message,
        detail: err instanceof Error
            ? { errorName: err.name }
            : { error: message },
    });
}
async function recordVercelDeployEvent(input) {
    return recordSystemEvent({
        source: 'vercel_deploy',
        level: input.level,
        eventType: input.eventType,
        message: input.message,
        detail: {
            deploymentId: input.deploymentId ?? null,
            url: input.url ?? null,
            payload: input.payload ?? null,
        },
    });
}
//# sourceMappingURL=system-event-service.js.map