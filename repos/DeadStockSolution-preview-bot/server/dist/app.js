"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const verification_1 = __importDefault(require("./routes/verification"));
const account_1 = __importDefault(require("./routes/account"));
const admin_1 = __importDefault(require("./routes/admin"));
const upload_1 = __importDefault(require("./routes/upload"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const exchange_1 = __importDefault(require("./routes/exchange"));
const pharmacies_1 = __importDefault(require("./routes/pharmacies"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const requests_1 = __importDefault(require("./routes/requests"));
const openclaw_1 = __importDefault(require("./routes/openclaw"));
const business_hours_1 = __importDefault(require("./routes/business-hours"));
const search_1 = __importDefault(require("./routes/search"));
const drug_master_1 = __importDefault(require("./routes/drug-master"));
const admin_error_codes_1 = __importDefault(require("./routes/admin-error-codes"));
const admin_log_center_1 = __importDefault(require("./routes/admin-log-center"));
const openclaw_commands_1 = __importDefault(require("./routes/openclaw-commands"));
const updates_1 = __importDefault(require("./routes/updates"));
const internal_matching_refresh_1 = __importDefault(require("./routes/internal-matching-refresh"));
const internal_monthly_reports_1 = __importDefault(require("./routes/internal-monthly-reports"));
const internal_upload_jobs_1 = __importDefault(require("./routes/internal-upload-jobs"));
const internal_monitoring_1 = __importDefault(require("./routes/internal-monitoring"));
const internal_predictive_alerts_1 = __importDefault(require("./routes/internal-predictive-alerts"));
const internal_vercel_deploy_events_1 = __importDefault(require("./routes/internal-vercel-deploy-events"));
const timeline_1 = __importDefault(require("./routes/timeline"));
const statistics_1 = __importDefault(require("./routes/statistics"));
const error_handler_1 = require("./middleware/error-handler");
const request_logger_1 = require("./middleware/request-logger");
const csrf_1 = require("./middleware/csrf");
const database_1 = require("./config/database");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("./services/logger");
const trust_proxy_1 = require("./utils/trust-proxy");
const app = (0, express_1.default)();
app.disable('x-powered-by');
app.set('trust proxy', (0, trust_proxy_1.resolveTrustProxySetting)());
function normalizeOrigin(origin) {
    return origin.trim().replace(/\/$/, '');
}
function extractHostname(value) {
    const candidate = value.split(',')[0]?.trim();
    if (!candidate)
        return null;
    try {
        const normalized = candidate.includes('://')
            ? candidate
            : `http://${candidate}`;
        return new URL(normalized).hostname.toLowerCase();
    }
    catch {
        return null;
    }
}
function isSameHostOrigin(origin, req) {
    try {
        const originHost = new URL(origin).hostname.toLowerCase();
        const forwardedHost = req.headers['x-forwarded-host'];
        const requestHostRaw = Array.isArray(forwardedHost)
            ? forwardedHost[0]
            : forwardedHost ?? req.headers.host;
        if (!requestHostRaw) {
            return false;
        }
        const requestHost = extractHostname(requestHostRaw);
        if (!requestHost) {
            return false;
        }
        return originHost === requestHost;
    }
    catch {
        return false;
    }
}
const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => origin.length > 0);
const vercelOrigin = process.env.VERCEL_URL
    ? normalizeOrigin(`https://${process.env.VERCEL_URL}`)
    : null;
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [...configuredOrigins, ...(vercelOrigin ? [vercelOrigin] : [])]
    : ['http://localhost:5173', 'http://127.0.0.1:5173', ...configuredOrigins];
const uniqueAllowedOrigins = Array.from(new Set(allowedOrigins));
if (process.env.NODE_ENV === 'production' && uniqueAllowedOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set in production');
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (uniqueAllowedOrigins.includes(normalizeOrigin(origin))) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use((0, compression_1.default)({
    threshold: 1024,
}));
app.use(express_1.default.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
        // rawBody is required for OpenClaw webhook HMAC verification.
        if (req.url?.startsWith('/api/openclaw/callback') || req.url?.startsWith('/api/openclaw/commands')) {
            req.rawBody = buf.toString('utf8');
        }
    },
}));
app.use((0, cookie_parser_1.default)());
// Request logging
app.use(request_logger_1.requestLogger);
const apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: { error: 'リクエストが集中しています。しばらくしてから再試行してください' },
});
app.use('/api', apiRateLimiter);
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !uniqueAllowedOrigins.includes(normalizeOrigin(origin)) && !isSameHostOrigin(origin, req)) {
        res.status(403).json({ error: '許可されていないオリジンです' });
        return;
    }
    next();
});
app.use('/api', csrf_1.csrfProtection);
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/auth', verification_1.default);
app.use('/api/account', account_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/exchange', exchange_1.default);
app.use('/api/pharmacies', pharmacies_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/requests', requests_1.default);
app.use('/api/openclaw', openclaw_1.default);
app.use('/api/openclaw/commands', openclaw_commands_1.default);
app.use('/api/business-hours', business_hours_1.default);
app.use('/api/search', search_1.default);
app.use('/api/admin/drug-master', drug_master_1.default);
app.use('/api/admin/error-codes', admin_error_codes_1.default);
app.use('/api/admin/log-center', admin_log_center_1.default);
app.use('/api/updates', updates_1.default);
app.use('/api/internal/matching-refresh', internal_matching_refresh_1.default);
app.use('/api/internal/monthly-reports', internal_monthly_reports_1.default);
app.use('/api/internal/upload-jobs', internal_upload_jobs_1.default);
app.use('/api/internal/monitoring', internal_monitoring_1.default);
app.use('/api/internal/predictive-alerts', internal_predictive_alerts_1.default);
app.use('/api/internal/vercel', internal_vercel_deploy_events_1.default);
app.use('/api/timeline', timeline_1.default);
app.use('/api/statistics', statistics_1.default);
// Health check with DB connectivity
app.get('/api/health', async (_req, res) => {
    const checks = {
        server: 'ok',
        database: 'unknown',
    };
    try {
        await database_1.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
        checks.database = 'ok';
    }
    catch (err) {
        checks.database = 'error';
        logger_1.logger.error('Health check: database connection failed', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
    const allOk = Object.values(checks).every((v) => v === 'ok');
    const status = allOk ? 'ok' : 'degraded';
    res.status(allOk ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        checks,
        uptime: process.uptime(),
    });
});
app.use(error_handler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map