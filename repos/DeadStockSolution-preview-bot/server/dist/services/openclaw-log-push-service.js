"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueLogAlert = enqueueLogAlert;
exports.flushBuffer = flushBuffer;
exports.buildAlertPayload = buildAlertPayload;
exports.getBufferSize = getBufferSize;
exports.clearBuffer = clearBuffer;
const logger_1 = require("./logger");
// In-memory buffers by severity (typed keys)
const buffers = {
    critical: [],
    error: [],
    warning: [],
};
const MAX_BUFFER_SIZE = 500;
// Resolve flush intervals once at module init
function resolveInterval(severity, defaultMs) {
    const envKey = `OPENCLAW_LOG_PUSH_${severity.toUpperCase()}_BUFFER_MS`;
    return Number(process.env[envKey]) || defaultMs;
}
const FLUSH_INTERVALS = {
    critical: 0,
    error: resolveInterval('error', 30_000),
    warning: resolveInterval('warning', 300_000),
};
const flushTimers = {
    critical: null,
    error: null,
    warning: null,
};
function enqueueLogAlert(entry) {
    if (!isEnabled())
        return;
    const severity = entry.severity;
    // Drop oldest entries if buffer is at capacity
    if (buffers[severity].length >= MAX_BUFFER_SIZE) {
        buffers[severity].shift();
    }
    buffers[severity].push({ ...entry, _retries: 0 });
    if (severity === 'critical') {
        flushBuffer('critical').catch(err => {
            logger_1.logger.error('Failed to flush critical log alerts', { error: String(err) });
        });
        return;
    }
    // Schedule flush if not already scheduled
    if (!flushTimers[severity]) {
        flushTimers[severity] = setTimeout(() => {
            flushTimers[severity] = null;
            flushBuffer(severity).catch(err => {
                logger_1.logger.error(`Failed to flush ${severity} log alerts`, { error: String(err) });
            });
        }, FLUSH_INTERVALS[severity]);
    }
}
async function flushBuffer(severity) {
    const entries = buffers[severity].splice(0);
    if (entries.length === 0)
        return;
    const payload = buildAlertPayload(severity, entries);
    try {
        await sendLogAlertToOpenClaw(payload);
        logger_1.logger.info(`Sent ${entries.length} ${severity} log alerts to OpenClaw`);
    }
    catch (err) {
        // Re-add entries for retry, up to 3 times each
        const retryable = entries.filter(e => e._retries < 3);
        for (const e of retryable)
            e._retries += 1;
        buffers[severity].unshift(...retryable);
        // Enforce cap after re-add to prevent unbounded growth
        if (buffers[severity].length > MAX_BUFFER_SIZE) {
            buffers[severity].length = MAX_BUFFER_SIZE;
        }
        logger_1.logger.error('Failed to send log alerts to OpenClaw', { error: String(err), count: entries.length });
    }
}
function buildAlertPayload(severity, entries) {
    return {
        type: 'log_alert',
        severity,
        logs: entries,
        sentAt: new Date().toISOString(),
    };
}
async function sendLogAlertToOpenClaw(payload) {
    // Dynamic import to avoid circular dependencies
    const { getOpenClawConfig, sendToOpenClawGateway } = await Promise.resolve().then(() => __importStar(require('./openclaw-service')));
    const config = getOpenClawConfig();
    if (!config.agentId || !config.apiKey) {
        throw new Error('OpenClaw not configured for log push');
    }
    const message = `[DeadStockSolution Log Alert] ${payload.severity.toUpperCase()}: ${payload.logs.length}件のログ\n\n` +
        payload.logs.map(l => `- [${l.errorCode ?? 'N/A'}] ${l.message} (${l.occurredAt})`).join('\n');
    await sendToOpenClawGateway({
        agentId: config.agentId,
        message,
        metadata: payload,
    });
}
function getBufferSize(severity) {
    if (!(severity in buffers))
        return 0;
    return buffers[severity].length;
}
function clearBuffer() {
    buffers.critical = [];
    buffers.error = [];
    buffers.warning = [];
    for (const key of Object.keys(flushTimers)) {
        if (flushTimers[key])
            clearTimeout(flushTimers[key]);
        flushTimers[key] = null;
    }
}
function isEnabled() {
    return process.env.OPENCLAW_LOG_PUSH_ENABLED === 'true';
}
//# sourceMappingURL=openclaw-log-push-service.js.map