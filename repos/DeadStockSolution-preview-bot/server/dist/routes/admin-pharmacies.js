"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_pharmacies_list_1 = __importDefault(require("./admin-pharmacies-list"));
const admin_pharmacies_detail_1 = __importDefault(require("./admin-pharmacies-detail"));
const admin_pharmacies_actions_1 = __importDefault(require("./admin-pharmacies-actions"));
const router = (0, express_1.Router)();
router.use(admin_pharmacies_list_1.default);
router.use(admin_pharmacies_detail_1.default);
router.use(admin_pharmacies_actions_1.default);
exports.default = router;
//# sourceMappingURL=admin-pharmacies.js.map