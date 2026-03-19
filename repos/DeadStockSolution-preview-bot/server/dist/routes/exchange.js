"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const exchange_proposals_1 = __importDefault(require("./exchange-proposals"));
const exchange_comments_1 = __importDefault(require("./exchange-comments"));
const exchange_feedback_1 = __importDefault(require("./exchange-feedback"));
const exchange_history_1 = __importDefault(require("./exchange-history"));
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.use(exchange_proposals_1.default);
router.use(exchange_comments_1.default);
router.use(exchange_feedback_1.default);
router.use(exchange_history_1.default);
exports.default = router;
//# sourceMappingURL=exchange.js.map