"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = getErrorMessage;
exports.handleRouteError = handleRouteError;
exports.errorHandler = errorHandler;
const logger_1 = require("../services/logger");
const system_event_service_1 = require("../services/system-event-service");
function getErrorMessage(err) {
    if (err instanceof Error)
        return err.message;
    return String(err);
}
function handleRouteError(err, logContext, responseMessage, res) {
    logger_1.logger.error(logContext, { error: getErrorMessage(err) });
    res.status(500).json({ error: responseMessage });
}
const PUBLIC_ERROR_CODES = new Set([
    'UPLOAD_CONFIRM_QUEUE_LIMIT',
]);
function resolveStatusCode(err) {
    const candidates = [err.status, err.statusCode];
    for (const candidate of candidates) {
        if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
            return candidate;
        }
    }
    return 500;
}
function resolveResponseMessage(err, status) {
    if (status === 400 && err.type === 'entity.parse.failed') {
        return 'リクエスト本文の形式が不正です';
    }
    if (status >= 500) {
        return process.env.NODE_ENV === 'production'
            ? 'サーバーエラーが発生しました'
            : err.message;
    }
    return process.env.NODE_ENV === 'production'
        ? 'リクエストに失敗しました'
        : err.message || 'リクエストに失敗しました';
}
function resolveLogMessage(err, status) {
    if (status === 400 && err.type === 'entity.parse.failed') {
        return 'Malformed JSON payload';
    }
    return err.message || 'Request failed';
}
function resolveLogStack(err, status) {
    if (status === 400 && err.type === 'entity.parse.failed') {
        return undefined;
    }
    return err.stack;
}
function resolveResponseCode(err, status) {
    if (typeof err.code === 'string' && PUBLIC_ERROR_CODES.has(err.code)) {
        return err.code;
    }
    if (status === 400 && err.type === 'entity.parse.failed') {
        return 'BAD_JSON_PAYLOAD';
    }
    if (status >= 500) {
        return 'INTERNAL_SERVER_ERROR';
    }
    return `HTTP_${status}`;
}
function errorHandler(err, req, res, _next) {
    const httpErr = err;
    const status = resolveStatusCode(httpErr);
    logger_1.logger.error('Unhandled error', {
        error: resolveLogMessage(httpErr, status),
        stack: resolveLogStack(httpErr, status),
        method: req.method,
        path: req.path,
        status,
    });
    void (0, system_event_service_1.recordHttpUnhandledError)({
        method: req.method,
        path: req.path,
        status,
        requestId: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined,
        errorCode: typeof httpErr.code === 'string' ? httpErr.code : undefined,
    });
    res.status(status).json({
        error: resolveResponseMessage(httpErr, status),
        code: resolveResponseCode(httpErr, status),
    });
}
//# sourceMappingURL=error-handler.js.map