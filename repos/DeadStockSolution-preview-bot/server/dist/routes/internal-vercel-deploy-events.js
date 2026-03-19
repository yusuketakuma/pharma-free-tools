"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const internal_cron_auth_1 = require("./internal-cron-auth");
const logger_1 = require("../services/logger");
const system_event_service_1 = require("../services/system-event-service");
const router = (0, express_1.Router)();
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const recentDeployEventCache = new Map();
function asString(value, maxLength) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}
function resolveLevel(state) {
    if (!state)
        return 'warning';
    const normalized = state.toLowerCase();
    if (['error', 'failed', 'failure', 'canceled'].includes(normalized)) {
        return 'error';
    }
    if (['building', 'queued', 'initializing'].includes(normalized)) {
        return 'warning';
    }
    return 'info';
}
function readWebhookSecret() {
    const value = process.env.VERCEL_DEPLOY_WEBHOOK_SECRET?.trim();
    if (!value)
        return null;
    return value;
}
function resolveEventType(body, deployment) {
    const type = asString(body.type, 120) ?? asString(body.event, 120);
    const state = asString(deployment.state, 80);
    if (type && state)
        return `${type}:${state}`;
    if (type)
        return type;
    if (state)
        return `deployment:${state}`;
    return 'deployment:unknown';
}
function resolveMessage(body, deployment) {
    const explicitMessage = asString(body.message, 2000);
    if (explicitMessage)
        return explicitMessage;
    const errorMessage = asString(deployment.error?.message, 2000);
    if (errorMessage)
        return errorMessage;
    const state = asString(deployment.state, 80) ?? 'unknown';
    const target = asString(deployment.target, 80) ?? 'unknown';
    return `Vercel deployment event received (state=${state}, target=${target})`;
}
function buildDedupeKey(eventType, deploymentId, state) {
    return `${eventType}:${deploymentId}:${state ?? '-'}`;
}
function isRecentDuplicate(dedupeKey, nowMs) {
    for (const [key, expiresAt] of recentDeployEventCache.entries()) {
        if (expiresAt <= nowMs) {
            recentDeployEventCache.delete(key);
        }
    }
    const expiresAt = recentDeployEventCache.get(dedupeKey);
    if (expiresAt && expiresAt > nowMs) {
        return true;
    }
    recentDeployEventCache.set(dedupeKey, nowMs + DEDUPE_WINDOW_MS);
    return false;
}
async function handleIngest(req, res) {
    try {
        const secret = readWebhookSecret();
        if (!secret) {
            logger_1.logger.error('Vercel deploy webhook secret is not configured');
            res.status(503).json({ error: 'vercel deploy webhook is not configured' });
            return;
        }
        const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
        if (!(0, internal_cron_auth_1.isAuthorizedCron)(authHeader, secret)) {
            logger_1.logger.warn('Unauthorized Vercel deploy webhook request', {
                ip: req.ip ?? null,
                userAgent: req.get('user-agent') ?? null,
            });
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        const body = (typeof req.body === 'object' && req.body !== null
            ? req.body
            : {});
        const deploymentRaw = (typeof body.payload === 'object' && body.payload !== null
            ? body.payload
            : {});
        const eventType = resolveEventType(body, deploymentRaw);
        const message = resolveMessage(body, deploymentRaw);
        const deploymentState = asString(deploymentRaw.state, 80);
        const deploymentId = asString(deploymentRaw.id, 120);
        const deploymentTarget = asString(deploymentRaw.target, 80);
        const level = resolveLevel(deploymentState);
        const dedupeKey = deploymentId
            ? buildDedupeKey(eventType, deploymentId, deploymentState)
            : null;
        if (dedupeKey && isRecentDuplicate(dedupeKey, Date.now())) {
            res.status(202).json({
                message: 'vercel deployment event already recorded',
                eventType,
                level,
            });
            return;
        }
        const persisted = await (0, system_event_service_1.recordVercelDeployEvent)({
            eventType,
            level,
            message,
            deploymentId,
            url: asString(deploymentRaw.url, 240),
            payload: {
                state: deploymentState,
                target: deploymentTarget,
            },
        });
        if (!persisted) {
            res.status(500).json({ error: 'vercel deploy event ingest failed' });
            return;
        }
        res.status(202).json({
            message: 'vercel deployment event recorded',
            eventType,
            level,
        });
    }
    catch (err) {
        logger_1.logger.error('Vercel deploy event ingest failed', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'vercel deploy event ingest failed' });
    }
}
router.post('/deploy-events', handleIngest);
exports.default = router;
//# sourceMappingURL=internal-vercel-deploy-events.js.map