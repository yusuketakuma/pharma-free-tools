"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../services/logger");
const github_updates_service_1 = require("../services/github-updates-service");
const router = (0, express_1.Router)();
router.use(auth_1.requireLogin);
router.get('/github', async (_req, res) => {
    try {
        const updates = await (0, github_updates_service_1.getGitHubUpdates)();
        res.json(updates);
    }
    catch (err) {
        logger_1.logger.warn('Failed to fetch GitHub updates', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(502).json({
            error: 'GitHubのアップデート取得に失敗しました。しばらくしてから再試行してください',
        });
    }
});
exports.default = router;
//# sourceMappingURL=updates.js.map