"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminWriteLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.adminWriteLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '管理系APIへのリクエストが多すぎます。しばらくして再試行してください' },
});
//# sourceMappingURL=admin-write-limiter.js.map