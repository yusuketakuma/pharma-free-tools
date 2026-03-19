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
exports.BUILTIN_COMMANDS = void 0;
exports.isCommandAllowed = isCommandAllowed;
exports.executeCommand = executeCommand;
exports.listCommandHistory = listCommandHistory;
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("./logger");
// ── 組込みコマンド定義 ──────────────────────────────────────────
exports.BUILTIN_COMMANDS = {
    'system.status': {
        category: 'read',
        descriptionJa: 'システムステータス取得',
        handler: async () => ({
            status: 'operational',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version ?? 'unknown',
            uptime: process.uptime(),
        }),
    },
    'logs.query': {
        category: 'read',
        descriptionJa: 'ログ検索',
        handler: async (params) => {
            const { queryLogs } = await Promise.resolve().then(() => __importStar(require('./log-center-service')));
            return queryLogs({
                sources: params.sources,
                level: params.level,
                search: typeof params.search === 'string' ? params.search : undefined,
                from: typeof params.from === 'string' ? params.from : undefined,
                to: typeof params.to === 'string' ? params.to : undefined,
                limit: Number(params.limit) || 50,
            });
        },
    },
    'stats.summary': {
        category: 'read',
        descriptionJa: '統計サマリー取得',
        handler: async () => {
            const { getLogSummary } = await Promise.resolve().then(() => __importStar(require('./log-center-service')));
            return getLogSummary();
        },
    },
    'cache.clear': {
        category: 'write',
        descriptionJa: 'キャッシュクリア',
        handler: async () => ({ cleared: true, timestamp: new Date().toISOString() }),
    },
    'maintenance.enable': {
        category: 'admin',
        descriptionJa: 'メンテナンスモード有効化',
        handler: async () => {
            process.env.MAINTENANCE_MODE = 'true';
            return { maintenanceMode: true };
        },
    },
    'maintenance.disable': {
        category: 'admin',
        descriptionJa: 'メンテナンスモード無効化',
        handler: async () => {
            delete process.env.MAINTENANCE_MODE;
            return { maintenanceMode: false };
        },
    },
    'scheduler.restart': {
        category: 'write',
        descriptionJa: 'スケジューラー再起動',
        handler: async () => ({ restarted: true, timestamp: new Date().toISOString() }),
    },
    'pharmacy.toggle': {
        category: 'admin',
        descriptionJa: '薬局の有効/無効切替',
        handler: async (params) => {
            const pharmacyId = Number(params.pharmacyId);
            if (!pharmacyId)
                throw new Error('pharmacyId is required');
            // Placeholder - actual implementation would toggle pharmacy isActive
            return { pharmacyId, action: 'toggle_requested', timestamp: new Date().toISOString() };
        },
    },
    'job.cancel': {
        category: 'write',
        descriptionJa: 'ジョブキャンセル',
        handler: async (params) => {
            const jobId = Number(params.jobId);
            if (!jobId)
                throw new Error('jobId is required');
            return { jobId, action: 'cancel_requested', timestamp: new Date().toISOString() };
        },
    },
    'drug_master.sync': {
        category: 'write',
        descriptionJa: '薬価マスター同期実行',
        handler: async () => ({ syncTriggered: true, timestamp: new Date().toISOString() }),
    },
    'notification.send': {
        category: 'write',
        descriptionJa: '通知送信',
        handler: async (params) => {
            if (!params.message || typeof params.message !== 'string')
                throw new Error('message is required');
            return { sent: true, message: params.message.slice(0, 100), timestamp: new Date().toISOString() };
        },
    },
};
// ── ホワイトリスト判定 ──────────────────────────────────────────
function isCommandAllowed(commandName) {
    return commandName in exports.BUILTIN_COMMANDS;
}
// ── コマンド実行 ──────────────────────────────────────────
async function executeCommand(request, signature) {
    // Record received command
    const [record] = await database_1.db.insert(schema_1.openclawCommands).values({
        commandName: request.command,
        parameters: request.parameters ? JSON.stringify(request.parameters) : null,
        status: 'received',
        openclawThreadId: request.threadId ?? null,
        signature,
    }).returning();
    // Check whitelist
    if (!isCommandAllowed(request.command)) {
        await database_1.db.update(schema_1.openclawCommands)
            .set({ status: 'rejected', errorMessage: `Command not in whitelist: ${request.command}`, completedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.openclawCommands.id, record.id));
        logger_1.logger.warn('OpenClaw command rejected', { command: request.command, reason: 'not_in_whitelist' });
        return { id: record.id, command: request.command, status: 'rejected', errorMessage: 'コマンドが許可リストにありません' };
    }
    // Execute
    try {
        await database_1.db.update(schema_1.openclawCommands)
            .set({ status: 'executing' })
            .where((0, drizzle_orm_1.eq)(schema_1.openclawCommands.id, record.id));
        const handler = exports.BUILTIN_COMMANDS[request.command].handler;
        const result = await handler(request.parameters ?? {});
        await database_1.db.update(schema_1.openclawCommands)
            .set({ status: 'completed', result: JSON.stringify(result), completedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.openclawCommands.id, record.id));
        logger_1.logger.info('OpenClaw command executed', { command: request.command });
        return { id: record.id, command: request.command, status: 'completed', result };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await database_1.db.update(schema_1.openclawCommands)
            .set({ status: 'failed', errorMessage: message, completedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.openclawCommands.id, record.id));
        logger_1.logger.error('OpenClaw command failed', { command: request.command, error: message });
        return { id: record.id, command: request.command, status: 'failed', errorMessage: message };
    }
}
// ── 履歴取得 ──────────────────────────────────────────
async function listCommandHistory(limit = 50, offset = 0) {
    return database_1.db.select().from(schema_1.openclawCommands).orderBy((0, drizzle_orm_1.desc)(schema_1.openclawCommands.receivedAt)).limit(Math.min(limit, 200)).offset(offset);
}
//# sourceMappingURL=openclaw-command-service.js.map