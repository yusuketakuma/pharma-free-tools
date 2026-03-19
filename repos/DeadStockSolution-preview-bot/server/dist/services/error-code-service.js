"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_ERROR_CODES = void 0;
exports.listErrorCodes = listErrorCodes;
exports.getErrorCodeByCode = getErrorCodeByCode;
exports.createErrorCode = createErrorCode;
exports.updateErrorCode = updateErrorCode;
exports.seedInitialErrorCodes = seedInitialErrorCodes;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const request_utils_1 = require("../utils/request-utils");
const logger_1 = require("./logger");
// ── 初期エラーコード定義 ──────────────────────────────────
exports.INITIAL_ERROR_CODES = [
    { code: 'UPLOAD_PARSE_FAILED', category: 'upload', severity: 'error', titleJa: 'ファイル解析エラー', descriptionJa: 'アップロードされたファイルの解析に失敗しました', resolutionJa: 'ファイル形式を確認してください' },
    { code: 'UPLOAD_EMPTY_FILE', category: 'upload', severity: 'warning', titleJa: '空ファイル', descriptionJa: 'アップロードされたファイルにデータがありません' },
    { code: 'UPLOAD_EMPTY_ROWS', category: 'upload', severity: 'warning', titleJa: '有効行なし', descriptionJa: '有効なデータ行がありませんでした' },
    { code: 'UPLOAD_INVALID_MAPPING', category: 'upload', severity: 'error', titleJa: 'カラムマッピング不正', descriptionJa: 'カラムの対応付けが正しくありません', resolutionJa: 'マッピング設定を確認してください' },
    { code: 'UPLOAD_FILE_TOO_LARGE', category: 'upload', severity: 'error', titleJa: 'ファイルサイズ超過', descriptionJa: 'ファイルサイズが上限を超えています' },
    { code: 'UPLOAD_MULTER_ERROR', category: 'upload', severity: 'error', titleJa: 'アップロード処理エラー', descriptionJa: 'ファイルアップロードの処理中にエラーが発生しました' },
    { code: 'SYNC_MASTER_FAILED', category: 'sync', severity: 'error', titleJa: '薬価マスター同期失敗', descriptionJa: '薬価基準データの同期に失敗しました', resolutionJa: 'ネットワーク接続とMHLWサイトの状態を確認してください' },
    { code: 'AUTH_LOGIN_FAILED', category: 'auth', severity: 'warning', titleJa: 'ログイン失敗', descriptionJa: 'ログイン認証に失敗しました' },
    { code: 'AUTH_TOKEN_EXPIRED', category: 'auth', severity: 'info', titleJa: 'トークン期限切れ', descriptionJa: '認証トークンの有効期限が切れました' },
    { code: 'SYSTEM_INTERNAL_ERROR', category: 'system', severity: 'critical', titleJa: '内部エラー', descriptionJa: 'サーバー内部でエラーが発生しました', resolutionJa: 'ログの詳細を確認し、システム管理者に連絡してください' },
    { code: 'SYSTEM_UNHANDLED_REJECTION', category: 'system', severity: 'error', titleJa: '未処理Promise拒否', descriptionJa: '処理されなかったPromise拒否が発生しました' },
    { code: 'SYSTEM_UNCAUGHT_EXCEPTION', category: 'system', severity: 'critical', titleJa: '未捕捉例外', descriptionJa: '捕捉されなかった例外が発生しました' },
    { code: 'OPENCLAW_HANDOFF_FAILED', category: 'openclaw', severity: 'error', titleJa: 'ハンドオフ失敗', descriptionJa: 'OpenClawへのハンドオフに失敗しました' },
    { code: 'OPENCLAW_COMMAND_REJECTED', category: 'openclaw', severity: 'warning', titleJa: 'コマンド拒否', descriptionJa: 'OpenClawからのコマンドが拒否されました' },
];
// ── サービス関数 ──────────────────────────────────
/**
 * エラーコード一覧を取得する（フィルタ・ページネーション対応）
 */
async function listErrorCodes(options = {}) {
    try {
        const conditions = [];
        if (options.category) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.errorCodes.category, options.category));
        }
        if (options.severity) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.errorCodes.severity, options.severity));
        }
        if (options.activeOnly) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.errorCodes.isActive, true));
        }
        if (options.search) {
            conditions.push((0, drizzle_orm_1.ilike)(schema_1.errorCodes.code, `%${(0, request_utils_1.escapeLikeWildcards)(options.search)}%`));
        }
        const where = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const limit = options.limit ?? 50;
        const offset = options.offset ?? 0;
        const [items, [totalRow]] = await Promise.all([
            database_1.db.select().from(schema_1.errorCodes).where(where).limit(limit).offset(offset),
            database_1.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema_1.errorCodes).where(where),
        ]);
        return { items, total: totalRow?.value ?? 0 };
    }
    catch (err) {
        logger_1.logger.error('Failed to list error codes', {
            error: err instanceof Error ? err.message : String(err),
        });
        return { items: [], total: 0 };
    }
}
/**
 * エラーコード文字列で1件取得する
 */
async function getErrorCodeByCode(code) {
    try {
        const [row] = await database_1.db.select().from(schema_1.errorCodes).where((0, drizzle_orm_1.eq)(schema_1.errorCodes.code, code)).limit(1);
        return row ?? null;
    }
    catch (err) {
        logger_1.logger.error('Failed to get error code', {
            code,
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}
/**
 * 新しいエラーコードを登録する
 */
async function createErrorCode(entry) {
    try {
        const [row] = await database_1.db.insert(schema_1.errorCodes).values({
            code: entry.code,
            category: entry.category,
            severity: entry.severity,
            titleJa: entry.titleJa,
            descriptionJa: entry.descriptionJa ?? null,
            resolutionJa: entry.resolutionJa ?? null,
        }).returning();
        return row ?? null;
    }
    catch (err) {
        logger_1.logger.error('Failed to create error code', {
            code: entry.code,
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}
/**
 * 既存エラーコードを更新する
 */
async function updateErrorCode(id, updates) {
    try {
        const [row] = await database_1.db.update(schema_1.errorCodes)
            .set({
            ...updates,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.errorCodes.id, id))
            .returning();
        return row ?? null;
    }
    catch (err) {
        logger_1.logger.error('Failed to update error code', {
            id,
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}
/**
 * 初期エラーコードをシードする（既存レコードはスキップ）
 */
async function seedInitialErrorCodes() {
    try {
        const result = await database_1.db.insert(schema_1.errorCodes)
            .values(exports.INITIAL_ERROR_CODES.map((entry) => ({
            code: entry.code,
            category: entry.category,
            severity: entry.severity,
            titleJa: entry.titleJa,
            descriptionJa: entry.descriptionJa ?? null,
            resolutionJa: entry.resolutionJa ?? null,
        })))
            .onConflictDoNothing({ target: schema_1.errorCodes.code });
        const inserted = result.rowCount ?? 0;
        if (inserted > 0) {
            logger_1.logger.info(`Seeded ${inserted} initial error codes`);
        }
        return inserted;
    }
    catch (err) {
        logger_1.logger.error('Failed to seed initial error codes', {
            error: err instanceof Error ? err.message : String(err),
        });
        return 0;
    }
}
//# sourceMappingURL=error-code-service.js.map