"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../middleware/auth");
const openclaw_service_1 = require("../services/openclaw-service");
const openclaw_command_service_1 = require("../services/openclaw-command-service");
const logger_1 = require("../services/logger");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
const commandLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'リクエストが多すぎます。時間をおいて再試行してください' },
});
// POST / --- OpenClaw command reception (HMAC auth, not admin JWT)
router.post('/', commandLimiter, async (req, res) => {
    try {
        if (process.env.OPENCLAW_COMMANDS_ENABLED !== 'true') {
            res.status(503).json({ error: 'コマンド受信が無効です' });
            return;
        }
        if (!(0, openclaw_service_1.isOpenClawWebhookConfigured)()) {
            res.status(503).json({ error: 'OpenClaw webhook が未設定です' });
            return;
        }
        const signature = req.header('x-openclaw-signature');
        const timestamp = req.header('x-openclaw-timestamp');
        const replayKey = { receivedSignature: signature, receivedTimestamp: timestamp };
        const isAuthorized = (0, openclaw_service_1.verifyOpenClawWebhookSignature)({ ...replayKey, rawBody: req.rawBody });
        if (!isAuthorized) {
            res.status(401).json({ error: 'OpenClaw webhook 認証に失敗しました' });
            return;
        }
        if ((0, openclaw_service_1.isOpenClawWebhookReplay)(replayKey)) {
            res.status(401).json({ error: 'OpenClaw webhook 認証に失敗しました' });
            return;
        }
        const replayAccepted = (0, openclaw_service_1.consumeOpenClawWebhookReplay)(replayKey);
        if (!replayAccepted) {
            res.status(401).json({ error: 'OpenClaw webhook 認証に失敗しました' });
            return;
        }
        const { command, parameters, threadId, reason } = req.body;
        if (!command || typeof command !== 'string') {
            (0, openclaw_service_1.releaseOpenClawWebhookReplay)(replayKey);
            res.status(400).json({ error: 'command フィールドが必要です' });
            return;
        }
        try {
            const result = await (0, openclaw_command_service_1.executeCommand)({ command, parameters, threadId, reason }, signature);
            const statusCode = result.status === 'rejected' ? 403 : result.status === 'failed' ? 500 : 200;
            res.status(statusCode).json(result);
        }
        catch (err) {
            (0, openclaw_service_1.releaseOpenClawWebhookReplay)(replayKey);
            throw err;
        }
    }
    catch (err) {
        logger_1.logger.error('OpenClaw command route error', { error: err.message });
        res.status(500).json({ error: 'コマンド処理に失敗しました' });
    }
});
// GET /history --- Admin command history (JWT admin auth)
router.get('/history', auth_1.requireLogin, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page, limit } = (0, admin_utils_1.parseListPagination)(req, 50);
        const offset = (page - 1) * limit;
        const commands = await (0, openclaw_command_service_1.listCommandHistory)(limit, offset);
        res.json({ commands, limit, offset });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'OpenClaw command history error', 'コマンド履歴の取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=openclaw-commands.js.map