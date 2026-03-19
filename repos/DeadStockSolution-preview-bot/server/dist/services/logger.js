"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const number_utils_1 = require("../utils/number-utils");
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const envLevel = process.env.LOG_LEVEL;
const currentLevel = envLevel in LOG_LEVELS ? envLevel : 'info';
const LOGGER_LAZY_PAYLOAD_ENABLED = (0, number_utils_1.parseBooleanFlag)(process.env.LOGGER_LAZY_PAYLOAD_ENABLED, true);
function shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}
function resolvePayload(payload) {
    if (typeof payload === 'function') {
        return payload();
    }
    return payload;
}
function formatLog(level, msg, data) {
    const entry = {
        level,
        msg,
        timestamp: new Date().toISOString(),
        ...data,
    };
    return JSON.stringify(entry);
}
exports.logger = {
    debug(msg, data) {
        const eagerPayload = LOGGER_LAZY_PAYLOAD_ENABLED ? undefined : resolvePayload(data);
        if (shouldLog('debug')) {
            process.stdout.write(formatLog('debug', msg, LOGGER_LAZY_PAYLOAD_ENABLED ? resolvePayload(data) : eagerPayload) + '\n');
        }
    },
    info(msg, data) {
        const eagerPayload = LOGGER_LAZY_PAYLOAD_ENABLED ? undefined : resolvePayload(data);
        if (shouldLog('info')) {
            process.stdout.write(formatLog('info', msg, LOGGER_LAZY_PAYLOAD_ENABLED ? resolvePayload(data) : eagerPayload) + '\n');
        }
    },
    warn(msg, data) {
        const eagerPayload = LOGGER_LAZY_PAYLOAD_ENABLED ? undefined : resolvePayload(data);
        if (shouldLog('warn')) {
            process.stderr.write(formatLog('warn', msg, LOGGER_LAZY_PAYLOAD_ENABLED ? resolvePayload(data) : eagerPayload) + '\n');
        }
    },
    error(msg, data) {
        const eagerPayload = LOGGER_LAZY_PAYLOAD_ENABLED ? undefined : resolvePayload(data);
        if (shouldLog('error')) {
            process.stderr.write(formatLog('error', msg, LOGGER_LAZY_PAYLOAD_ENABLED ? resolvePayload(data) : eagerPayload) + '\n');
        }
    },
};
//# sourceMappingURL=logger.js.map