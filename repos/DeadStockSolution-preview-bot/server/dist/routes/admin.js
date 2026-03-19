"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const admin_stats_1 = __importDefault(require("./admin-stats"));
const admin_logs_1 = __importDefault(require("./admin-logs"));
const admin_pharmacies_1 = __importDefault(require("./admin-pharmacies"));
const admin_risk_1 = __importDefault(require("./admin-risk"));
const admin_reports_1 = __importDefault(require("./admin-reports"));
const admin_trust_1 = __importDefault(require("./admin-trust"));
const admin_upload_jobs_1 = __importDefault(require("./admin-upload-jobs"));
const admin_matching_rules_1 = __importDefault(require("./admin-matching-rules"));
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.use(auth_1.requireAdmin);
router.use(admin_stats_1.default);
router.use(admin_logs_1.default);
router.use(admin_trust_1.default);
router.use(admin_matching_rules_1.default);
router.use(admin_risk_1.default);
router.use(admin_reports_1.default);
router.use(admin_pharmacies_1.default);
router.use(admin_upload_jobs_1.default);
exports.default = router;
//# sourceMappingURL=admin.js.map