"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const drug_master_crud_1 = __importDefault(require("./drug-master-crud"));
const drug_master_sync_1 = __importDefault(require("./drug-master-sync"));
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.use(auth_1.requireAdmin);
router.use('/', drug_master_crud_1.default);
router.use('/', drug_master_sync_1.default);
exports.default = router;
//# sourceMappingURL=drug-master.js.map