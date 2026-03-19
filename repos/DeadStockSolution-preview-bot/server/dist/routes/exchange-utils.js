"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExchangeIdOrBadRequest = parseExchangeIdOrBadRequest;
const request_utils_1 = require("../utils/request-utils");
function parseExchangeIdOrBadRequest(res, rawId) {
    const id = (0, request_utils_1.parsePositiveInt)(typeof rawId === 'string' ? rawId : undefined);
    if (!id) {
        res.status(400).json({ error: '不正なIDです' });
        return null;
    }
    return id;
}
//# sourceMappingURL=exchange-utils.js.map