"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenClawConfig = getOpenClawConfig;
exports.sendToOpenClawGateway = sendToOpenClawGateway;
exports.isOpenClawStatus = isOpenClawStatus;
exports.canTransitionOpenClawStatus = canTransitionOpenClawStatus;
exports.getOpenClawImplementationBranch = getOpenClawImplementationBranch;
exports.isOpenClawConnectorConfigured = isOpenClawConnectorConfigured;
exports.isOpenClawWebhookConfigured = isOpenClawWebhookConfigured;
exports.verifyOpenClawWebhookSignature = verifyOpenClawWebhookSignature;
exports.consumeOpenClawWebhookReplay = consumeOpenClawWebhookReplay;
exports.isOpenClawWebhookReplay = isOpenClawWebhookReplay;
exports.releaseOpenClawWebhookReplay = releaseOpenClawWebhookReplay;
exports.resetOpenClawWebhookReplayCacheForTests = resetOpenClawWebhookReplayCacheForTests;
exports.isImplementationBranchAllowed = isImplementationBranchAllowed;
exports.handoffToOpenClaw = handoffToOpenClaw;
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const error_handler_1 = require("../middleware/error-handler");
const http_utils_1 = require("../utils/http-utils");
const logger_1 = require("./logger");
const FIXED_IMPLEMENTATION_BRANCH = 'review';
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const DEFAULT_WEBHOOK_MAX_SKEW_SECONDS = 300;
const WEBHOOK_SIGNATURE_PREFIX = 'sha256=';
const DEFAULT_OPENCLAW_TIMEOUT_MS = 10000;
const DEFAULT_OPENCLAW_TIMEOUT_SECONDS = 120;
const DEFAULT_OPENCLAW_RETRY_MAX = 2;
const DEFAULT_OPENCLAW_RETRY_BASE_MS = 400;
const DEFAULT_OPENCLAW_IDEMPOTENCY_TTL_MS = 120_000;
const webhookReplayCache = new Map();
const handoffInFlight = new Map();
const handoffResultCache = new Map();
const OPENCLAW_STATUS_ORDER = {
    pending_handoff: 0,
    in_dialogue: 1,
    implementing: 2,
    completed: 3,
};
function isAbortError(err) {
    return err instanceof Error && err.name === 'AbortError';
}
function stripTrailingSlash(url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}
function isLocalhostHost(hostname) {
    const normalized = hostname.toLowerCase();
    return normalized === 'localhost'
        || normalized === '127.0.0.1'
        || normalized === '::1'
        || normalized === '[::1]';
}
function normalizeBaseUrl(baseUrlRaw) {
    const trimmed = baseUrlRaw.trim();
    if (!trimmed)
        return { value: '', error: 'missing' };
    let parsed;
    try {
        parsed = new URL(trimmed);
    }
    catch {
        return { value: '', error: 'invalid' };
    }
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:' || (protocol === 'http:' && isLocalhostHost(parsed.hostname))) {
        parsed.search = '';
        parsed.hash = '';
        return { value: stripTrailingSlash(parsed.toString()), error: null };
    }
    return { value: '', error: 'insecure' };
}
function connectorNotReadyMessage(config) {
    if (config.mode === 'gateway_cli') {
        return 'OpenClaw CLIコネクター未接続。OPENCLAW_CLI_PATH と OPENCLAW_AGENT_ID を確認してください。';
    }
    if (config.baseUrlError === 'insecure') {
        return 'OPENCLAW_BASE_URL はHTTPSを使用してください（localhostのみHTTP許可）。';
    }
    if (config.baseUrlError === 'invalid') {
        return 'OPENCLAW_BASE_URL が不正です。正しいURLを設定してください。';
    }
    return 'OpenClawコネクター未接続。接続後に再連携してください。';
}
function resolveOpenClawConnectorMode() {
    const rawMode = (process.env.OPENCLAW_CONNECTOR_MODE ?? '').trim().toLowerCase();
    if (rawMode === 'gateway_cli')
        return 'gateway_cli';
    return 'legacy_http';
}
function readConfig() {
    const baseUrl = normalizeBaseUrl(process.env.OPENCLAW_BASE_URL ?? '');
    return {
        mode: resolveOpenClawConnectorMode(),
        cliPath: (process.env.OPENCLAW_CLI_PATH ?? '').trim(),
        baseUrl: baseUrl.value,
        baseUrlError: baseUrl.error,
        apiKey: (process.env.OPENCLAW_API_KEY ?? '').trim(),
        agentId: (process.env.OPENCLAW_AGENT_ID ?? '').trim(),
        webhookSecret: (process.env.OPENCLAW_WEBHOOK_SECRET ?? '').trim(),
        implementationBranch: FIXED_IMPLEMENTATION_BRANCH,
    };
}
function resolveWebhookMaxSkewSeconds() {
    const rawValue = Number(process.env.OPENCLAW_WEBHOOK_MAX_SKEW_SECONDS ?? DEFAULT_WEBHOOK_MAX_SKEW_SECONDS);
    if (!Number.isFinite(rawValue) || rawValue <= 0 || rawValue > 3600) {
        return DEFAULT_WEBHOOK_MAX_SKEW_SECONDS;
    }
    return Math.floor(rawValue);
}
function resolveRetryMax() {
    const raw = Number(process.env.OPENCLAW_RETRY_MAX ?? DEFAULT_OPENCLAW_RETRY_MAX);
    if (!Number.isFinite(raw))
        return DEFAULT_OPENCLAW_RETRY_MAX;
    return Math.max(0, Math.min(5, Math.floor(raw)));
}
function resolveRetryBaseMs() {
    const raw = Number(process.env.OPENCLAW_RETRY_BASE_MS ?? DEFAULT_OPENCLAW_RETRY_BASE_MS);
    if (!Number.isFinite(raw))
        return DEFAULT_OPENCLAW_RETRY_BASE_MS;
    return Math.max(100, Math.min(5000, Math.floor(raw)));
}
function resolveIdempotencyTtlMs() {
    const raw = Number(process.env.OPENCLAW_IDEMPOTENCY_TTL_MS ?? DEFAULT_OPENCLAW_IDEMPOTENCY_TTL_MS);
    if (!Number.isFinite(raw))
        return DEFAULT_OPENCLAW_IDEMPOTENCY_TTL_MS;
    return Math.max(5_000, Math.min(15 * 60_000, Math.floor(raw)));
}
function resolveGatewayTimeoutMs() {
    const raw = Number(process.env.OPENCLAW_TIMEOUT_MS ?? DEFAULT_OPENCLAW_TIMEOUT_MS);
    if (!Number.isFinite(raw))
        return DEFAULT_OPENCLAW_TIMEOUT_MS;
    return Math.max(1000, Math.min(60_000, Math.floor(raw)));
}
function resolveGatewayTimeoutSeconds() {
    const raw = Number(process.env.OPENCLAW_TIMEOUT_SECONDS ?? DEFAULT_OPENCLAW_TIMEOUT_SECONDS);
    if (!Number.isFinite(raw))
        return DEFAULT_OPENCLAW_TIMEOUT_SECONDS;
    return Math.max(10, Math.min(600, Math.floor(raw)));
}
function normalizeSignature(raw) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(WEBHOOK_SIGNATURE_PREFIX)) {
        return trimmed.slice(WEBHOOK_SIGNATURE_PREFIX.length).toLowerCase();
    }
    return trimmed.toLowerCase();
}
function pruneWebhookReplayCache(nowMs) {
    for (const [key, expiresAtMs] of webhookReplayCache.entries()) {
        if (expiresAtMs <= nowMs) {
            webhookReplayCache.delete(key);
        }
    }
}
function isReplayRequest(signature, timestamp, nowMs) {
    pruneWebhookReplayCache(nowMs);
    const replayKey = buildReplayKey(signature, timestamp);
    const existing = webhookReplayCache.get(replayKey);
    if (existing && existing > nowMs) {
        return true;
    }
    const ttlMs = resolveWebhookMaxSkewSeconds() * 1000;
    webhookReplayCache.set(replayKey, nowMs + ttlMs);
    return false;
}
function buildReplayKey(signature, timestamp) {
    return `${timestamp}:${signature}`;
}
function normalizeStatus(value) {
    if (value === 'in_dialogue' || value === 'implementing' || value === 'completed') {
        return value;
    }
    return 'in_dialogue';
}
function buildHandoffIdempotencyKey(input) {
    return `openclaw-handoff:${input.requestId}:${input.pharmacyId}`;
}
function pruneHandoffResultCache(nowMs) {
    for (const [key, entry] of handoffResultCache.entries()) {
        if (entry.expiresAtMs <= nowMs) {
            handoffResultCache.delete(key);
        }
    }
}
function getCachedHandoffResult(key, nowMs) {
    const cached = handoffResultCache.get(key);
    if (!cached || cached.expiresAtMs <= nowMs)
        return null;
    return cached.result;
}
function setCachedHandoffResult(key, result, nowMs) {
    pruneHandoffResultCache(nowMs);
    const ttlMs = resolveIdempotencyTtlMs();
    handoffResultCache.set(key, {
        expiresAtMs: nowMs + ttlMs,
        result,
    });
}
function buildHandoffFailure(config, note) {
    return {
        accepted: false,
        connectorConfigured: true,
        implementationBranch: config.implementationBranch,
        status: 'pending_handoff',
        threadId: null,
        summary: null,
        note,
    };
}
function isRetryableStatus(status) {
    return status === 408 || status === 429 || status >= 500;
}
function calcBackoffMs(attempt) {
    const baseMs = resolveRetryBaseMs();
    const jitter = Math.floor(Math.random() * 100);
    return baseMs * Math.max(1, 2 ** (attempt - 1)) + jitter;
}
function extractSummaryFromCli(payload, fallbackStdout) {
    const text = payload.result?.payloads?.find((entry) => typeof entry?.text === 'string' && entry.text.trim().length > 0)?.text;
    if (typeof text === 'string' && text.trim().length > 0) {
        return text.trim().slice(0, 4000);
    }
    const trimmed = fallbackStdout.trim();
    return trimmed ? trimmed.slice(0, 4000) : null;
}
async function handoffViaGatewayCli(config, input, idempotencyKey) {
    const timeoutSeconds = resolveGatewayTimeoutSeconds();
    const maxAttempts = resolveRetryMax() + 1;
    const message = [
        'あなたはDeadStockSolutionのOpenClaw連携エージェントです。',
        `要望ID: ${input.requestId}`,
        `薬局ID: ${input.pharmacyId}`,
        `冪等キー: ${idempotencyKey}`,
        `要望: ${input.requestText}`,
        '次の形式で短く返答してください: 1) 受領確認 2) 初動方針 3) 次アクション',
    ].join('\n');
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const startedAt = Date.now();
        const args = [
            'agent',
            '--agent', config.agentId,
            '--message', message,
            '--thinking', 'low',
            '--timeout', String(timeoutSeconds),
            '--json',
        ];
        try {
            const { stdout } = await execFileAsync(config.cliPath, args, {
                timeout: timeoutSeconds * 1000 + 3000,
                maxBuffer: 2 * 1024 * 1024,
                env: process.env,
            });
            let payload = {};
            try {
                payload = JSON.parse(stdout);
            }
            catch {
                payload = {};
            }
            const summary = extractSummaryFromCli(payload, stdout);
            const sessionIdRaw = payload.result?.meta?.agentMeta?.sessionId;
            const threadId = typeof sessionIdRaw === 'string' && sessionIdRaw.trim().length > 0 ? sessionIdRaw.trim() : null;
            logger_1.logger.info('OpenClaw handoff gateway_cli success', {
                mode: config.mode,
                requestId: input.requestId,
                pharmacyId: input.pharmacyId,
                idempotencyKey,
                attempt,
                durationMs: Date.now() - startedAt,
                threadId,
            });
            return {
                accepted: true,
                connectorConfigured: true,
                implementationBranch: config.implementationBranch,
                status: 'in_dialogue',
                threadId,
                summary,
                note: 'OpenClaw Gateway CLI へ連携しました。',
            };
        }
        catch (err) {
            const durationMs = Date.now() - startedAt;
            const messageText = (0, error_handler_1.getErrorMessage)(err);
            const retryable = attempt < maxAttempts;
            logger_1.logger.warn('OpenClaw handoff gateway_cli failed', {
                mode: config.mode,
                requestId: input.requestId,
                pharmacyId: input.pharmacyId,
                idempotencyKey,
                attempt,
                durationMs,
                retryable,
                error: messageText,
            });
            if (retryable) {
                await (0, http_utils_1.sleep)(calcBackoffMs(attempt));
                continue;
            }
            return buildHandoffFailure(config, 'OpenClaw Gateway CLI 連携に失敗しました。');
        }
    }
    return buildHandoffFailure(config, 'OpenClaw Gateway CLI 連携に失敗しました。');
}
async function handoffViaLegacyHttp(config, input, idempotencyKey) {
    const maxAttempts = resolveRetryMax() + 1;
    const timeoutMs = resolveGatewayTimeoutMs();
    const requestPayload = {
        agentId: config.agentId,
        requestId: input.requestId,
        pharmacyId: input.pharmacyId,
        requestText: input.requestText,
        idempotencyKey,
        constraints: {
            implementationBranch: config.implementationBranch,
        },
    };
    if (input.context && Object.keys(input.context).length > 0) {
        requestPayload.context = input.context;
    }
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const startedAt = Date.now();
        try {
            const response = await fetch(`${config.baseUrl}/v1/handoffs`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': idempotencyKey,
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal,
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                const retryable = isRetryableStatus(response.status) && attempt < maxAttempts;
                logger_1.logger.warn('OpenClaw handoff legacy_http failed', {
                    mode: config.mode,
                    requestId: input.requestId,
                    pharmacyId: input.pharmacyId,
                    idempotencyKey,
                    attempt,
                    durationMs: Date.now() - startedAt,
                    statusCode: response.status,
                    retryable,
                });
                if (retryable) {
                    await (0, http_utils_1.sleep)(calcBackoffMs(attempt));
                    continue;
                }
                return buildHandoffFailure(config, `OpenClaw連携失敗: HTTP ${response.status}`);
            }
            const threadId = typeof payload.threadId === 'string' && payload.threadId.trim().length > 0
                ? payload.threadId.trim()
                : null;
            const summary = typeof payload.summary === 'string' && payload.summary.trim().length > 0
                ? payload.summary.trim()
                : null;
            const status = normalizeStatus(payload.status);
            logger_1.logger.info('OpenClaw handoff legacy_http success', {
                mode: config.mode,
                requestId: input.requestId,
                pharmacyId: input.pharmacyId,
                idempotencyKey,
                attempt,
                durationMs: Date.now() - startedAt,
                threadId,
                status,
            });
            return {
                accepted: true,
                connectorConfigured: true,
                implementationBranch: config.implementationBranch,
                status,
                threadId,
                summary,
                note: `OpenClawへ連携しました。実装ブランチは ${config.implementationBranch} に固定されています。`,
            };
        }
        catch (err) {
            const retryable = attempt < maxAttempts;
            logger_1.logger.warn('OpenClaw handoff legacy_http error', {
                mode: config.mode,
                requestId: input.requestId,
                pharmacyId: input.pharmacyId,
                idempotencyKey,
                attempt,
                durationMs: Date.now() - startedAt,
                retryable,
                timeout: isAbortError(err),
                error: (0, error_handler_1.getErrorMessage)(err),
            });
            if (retryable) {
                await (0, http_utils_1.sleep)(calcBackoffMs(attempt));
                continue;
            }
            return buildHandoffFailure(config, isAbortError(err) ? 'OpenClaw連携がタイムアウトしました。' : 'OpenClaw連携中にエラーが発生しました。');
        }
        finally {
            clearTimeout(timer);
        }
    }
    return buildHandoffFailure(config, 'OpenClaw連携中にエラーが発生しました。');
}
function getOpenClawConfig() {
    return readConfig();
}
async function sendToOpenClawGateway(input) {
    const config = readConfig();
    if (config.mode === 'gateway_cli') {
        const timeoutSeconds = resolveGatewayTimeoutSeconds();
        const args = [
            'agent',
            '--agent', input.agentId,
            '--message', input.message,
            '--thinking', 'low',
            '--timeout', String(timeoutSeconds),
            '--json',
        ];
        const { stdout } = await execFileAsync(config.cliPath, args, {
            timeout: timeoutSeconds * 1000 + 3000,
            maxBuffer: 2 * 1024 * 1024,
            env: process.env,
        });
        let parsed = {};
        try {
            parsed = JSON.parse(stdout);
        }
        catch {
            parsed = {};
        }
        return {
            summary: (typeof parsed.result === 'string' ? parsed.result : null)
                ?? (typeof parsed.message === 'string' ? parsed.message : null)
                ?? stdout.slice(0, 500),
        };
    }
    // Legacy HTTP mode
    const timeoutMs = resolveGatewayTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.agentId,
                messages: [{ role: 'user', content: input.message }],
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`OpenClaw API error: ${response.status}`);
        }
        const data = await response.json();
        return {
            summary: data?.choices?.[0]?.message?.content ?? '',
        };
    }
    finally {
        clearTimeout(timer);
    }
}
function isOpenClawStatus(value) {
    return value === 'pending_handoff'
        || value === 'in_dialogue'
        || value === 'implementing'
        || value === 'completed';
}
function canTransitionOpenClawStatus(current, next) {
    return OPENCLAW_STATUS_ORDER[next] >= OPENCLAW_STATUS_ORDER[current];
}
function getOpenClawImplementationBranch() {
    return FIXED_IMPLEMENTATION_BRANCH;
}
function isOpenClawConnectorConfigured() {
    const config = readConfig();
    if (config.mode === 'gateway_cli') {
        return Boolean(config.cliPath && config.agentId);
    }
    return Boolean(config.baseUrl && config.apiKey && config.agentId);
}
function isOpenClawWebhookConfigured() {
    return Boolean(readConfig().webhookSecret);
}
function verifyOpenClawWebhookSignature({ receivedSignature, receivedTimestamp, rawBody, nowMs = Date.now(), }) {
    const expectedSecret = readConfig().webhookSecret;
    if (!expectedSecret || !receivedSignature || !receivedTimestamp || typeof rawBody !== 'string') {
        return false;
    }
    const timestampText = receivedTimestamp.trim();
    const timestampSeconds = Number(timestampText);
    if (!Number.isInteger(timestampSeconds) || timestampSeconds <= 0) {
        return false;
    }
    const maxSkewSeconds = resolveWebhookMaxSkewSeconds();
    const skewSeconds = Math.abs(Math.floor(nowMs / 1000) - timestampSeconds);
    if (skewSeconds > maxSkewSeconds) {
        return false;
    }
    const signature = normalizeSignature(receivedSignature);
    if (!/^[a-f0-9]{64}$/.test(signature)) {
        return false;
    }
    const signedPayload = `${timestampText}.${rawBody}`;
    const expectedDigest = crypto_1.default.createHmac('sha256', expectedSecret)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();
    const expectedBuffer = Buffer.from(expectedDigest, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');
    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }
    if (!crypto_1.default.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        return false;
    }
    return true;
}
function consumeOpenClawWebhookReplay({ receivedSignature, receivedTimestamp, nowMs = Date.now(), }) {
    if (!receivedSignature || !receivedTimestamp) {
        return false;
    }
    const signature = normalizeSignature(receivedSignature);
    const timestamp = receivedTimestamp.trim();
    if (!signature || !timestamp) {
        return false;
    }
    return !isReplayRequest(signature, timestamp, nowMs);
}
function isOpenClawWebhookReplay({ receivedSignature, receivedTimestamp, nowMs = Date.now(), }) {
    if (!receivedSignature || !receivedTimestamp) {
        return false;
    }
    const signature = normalizeSignature(receivedSignature);
    const timestamp = receivedTimestamp.trim();
    if (!signature || !timestamp) {
        return false;
    }
    pruneWebhookReplayCache(nowMs);
    const existing = webhookReplayCache.get(buildReplayKey(signature, timestamp));
    return Boolean(existing && existing > nowMs);
}
function releaseOpenClawWebhookReplay({ receivedSignature, receivedTimestamp, }) {
    if (!receivedSignature || !receivedTimestamp) {
        return;
    }
    const signature = normalizeSignature(receivedSignature);
    const timestamp = receivedTimestamp.trim();
    if (!signature || !timestamp) {
        return;
    }
    webhookReplayCache.delete(buildReplayKey(signature, timestamp));
}
function resetOpenClawWebhookReplayCacheForTests() {
    webhookReplayCache.clear();
    handoffInFlight.clear();
    handoffResultCache.clear();
}
function isImplementationBranchAllowed(branch) {
    if (!branch)
        return false;
    return branch.trim() === getOpenClawImplementationBranch();
}
async function handoffToOpenClaw(input) {
    const config = readConfig();
    const connectorConfigured = config.mode === 'gateway_cli'
        ? Boolean(config.cliPath && config.agentId)
        : Boolean(config.baseUrl && config.apiKey && config.agentId);
    if (!connectorConfigured) {
        return {
            accepted: false,
            connectorConfigured: false,
            implementationBranch: config.implementationBranch,
            status: 'pending_handoff',
            threadId: null,
            summary: null,
            note: connectorNotReadyMessage(config),
        };
    }
    const idempotencyKey = buildHandoffIdempotencyKey(input);
    const nowMs = Date.now();
    const cached = getCachedHandoffResult(idempotencyKey, nowMs);
    if (cached) {
        logger_1.logger.info('OpenClaw handoff cache hit', {
            mode: config.mode,
            requestId: input.requestId,
            pharmacyId: input.pharmacyId,
            idempotencyKey,
        });
        return cached;
    }
    const inFlight = handoffInFlight.get(idempotencyKey);
    if (inFlight) {
        logger_1.logger.info('OpenClaw handoff deduplicated by in-flight key', {
            mode: config.mode,
            requestId: input.requestId,
            pharmacyId: input.pharmacyId,
            idempotencyKey,
        });
        return inFlight;
    }
    const task = (async () => {
        if (config.mode === 'gateway_cli') {
            return handoffViaGatewayCli(config, input, idempotencyKey);
        }
        return handoffViaLegacyHttp(config, input, idempotencyKey);
    })();
    handoffInFlight.set(idempotencyKey, task);
    try {
        const result = await task;
        setCachedHandoffResult(idempotencyKey, result, Date.now());
        return result;
    }
    finally {
        handoffInFlight.delete(idempotencyKey);
    }
}
//# sourceMappingURL=openclaw-service.js.map