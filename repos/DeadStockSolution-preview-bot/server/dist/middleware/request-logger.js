"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../services/logger");
const observability_service_1 = require("../services/observability-service");
const number_utils_1 = require("../utils/number-utils");
const REQUEST_LOG_ERRORS_ONLY = (0, number_utils_1.parseBooleanFlag)(process.env.REQUEST_LOG_ERRORS_ONLY, true);
const REQUEST_METRICS_ENABLED = (0, number_utils_1.parseBooleanFlag)(process.env.REQUEST_METRICS_ENABLED, true);
function resolveRequestLogLevel(statusCode) {
    if (REQUEST_LOG_ERRORS_ONLY && statusCode < 400) {
        return null;
    }
    if (statusCode >= 500) {
        return 'error';
    }
    if (statusCode >= 400) {
        return 'warn';
    }
    return 'info';
}
function requestLogger(req, res, next) {
    // Skip health check and static asset logging
    if (req.path === '/api/health') {
        next();
        return;
    }
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = resolveRequestLogLevel(res.statusCode);
        if (REQUEST_METRICS_ENABLED) {
            (0, observability_service_1.recordRequestMetric)({
                timestamp: Date.now(),
                method: req.method,
                path: req.path,
                status: res.statusCode,
                durationMs: duration,
            });
        }
        if (!level) {
            return;
        }
        logger_1.logger[level]('request', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
    });
    next();
}
//# sourceMappingURL=request-logger.js.map