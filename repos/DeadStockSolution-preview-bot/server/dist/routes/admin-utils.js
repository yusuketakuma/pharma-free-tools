"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = void 0;
exports.sendPaginated = sendPaginated;
exports.parseListPagination = parseListPagination;
exports.parseIdOrBadRequest = parseIdOrBadRequest;
exports.handleAdminError = handleAdminError;
const request_utils_1 = require("../utils/request-utils");
const logger_1 = require("../services/logger");
const error_handler_1 = require("../middleware/error-handler");
function sendPaginated(res, data, page, limit, total, extra = {}) {
    res.json({
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        ...extra,
    });
}
function parseListPagination(req, defaultLimit = 20) {
    return (0, request_utils_1.parsePagination)(req.query.page, req.query.limit, {
        defaultLimit,
        maxLimit: 100,
    });
}
function parseIdOrBadRequest(res, rawId) {
    const id = (0, request_utils_1.parsePositiveInt)(typeof rawId === 'string' ? rawId : undefined);
    if (!id) {
        res.status(400).json({ error: '不正なIDです' });
        return null;
    }
    return id;
}
var error_handler_2 = require("../middleware/error-handler");
Object.defineProperty(exports, "getErrorMessage", { enumerable: true, get: function () { return error_handler_2.getErrorMessage; } });
function handleAdminError(err, logContext, responseMessage, res) {
    logger_1.logger.error(logContext, { error: (0, error_handler_1.getErrorMessage)(err) });
    res.status(500).json({ error: responseMessage });
}
//# sourceMappingURL=admin-utils.js.map