"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const log_service_1 = require("../services/log-service");
const drug_master_service_1 = require("../services/drug-master-service");
const drug_master_scheduler_1 = require("../services/drug-master-scheduler");
const drug_package_scheduler_1 = require("../services/drug-package-scheduler");
const drug_master_source_state_service_1 = require("../services/drug-master-source-state-service");
const upload_service_1 = require("../services/upload-service");
const logger_1 = require("../services/logger");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
const EMPTY_SYNC_RESULT = {
    itemsProcessed: 0,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsDeleted: 0,
};
function getUploadContext(req) {
    const file = req.file;
    const revisionDateRaw = req.body?.revisionDate;
    return {
        path: req.path,
        pharmacyId: req.user?.id ?? null,
        fileName: file?.originalname ?? null,
        fileType: file?.mimetype ?? null,
        fileSize: file?.size ?? null,
        revisionDate: typeof revisionDateRaw === 'string' ? revisionDateRaw : null,
    };
}
function sanitizeLogValue(value, maxLength = 160) {
    if (value === null || value === undefined)
        return null;
    const str = String(value)
        .replace(/\|/g, '/')
        .replace(/\s+/g, ' ')
        .trim();
    if (!str)
        return null;
    return str.slice(0, maxLength);
}
function logImportFailure(action, req, phase, reason, extra = {}) {
    const file = req.file;
    const detailParts = [
        '失敗',
        `phase=${phase}`,
        `reason=${reason}`,
    ];
    const fileName = sanitizeLogValue(file?.originalname, 120);
    if (fileName)
        detailParts.push(`file=${fileName}`);
    const revisionDate = sanitizeLogValue(req.body?.revisionDate, 40);
    if (revisionDate)
        detailParts.push(`revisionDate=${revisionDate}`);
    for (const [key, value] of Object.entries(extra)) {
        const sanitized = sanitizeLogValue(value);
        if (sanitized) {
            detailParts.push(`${key}=${sanitized}`);
        }
    }
    void (0, log_service_1.writeLog)(action, {
        pharmacyId: req.user?.id ?? null,
        detail: detailParts.join('|'),
        ipAddress: (0, log_service_1.getClientIp)(req),
    });
}
const MAX_UPLOAD_SIZE = 30 * 1024 * 1024; // 30MB（MHLWファイルは大きい場合がある）
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.csv', '.xml', '.zip']);
const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
    'text/csv',
    'text/plain',
    'application/csv',
    'application/xml',
    'text/xml',
    'application/zip',
    'application/x-zip-compressed',
]);
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_UPLOAD_SIZE,
        files: 1,
        fields: 10,
        fieldSize: 100 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(new Error('xlsx / csv / xml / zip ファイルのみアップロードできます'));
            return;
        }
        cb(null, true);
    },
});
function resolveIntervalHours(raw, fallback = 24) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 24 * 30) {
        return fallback;
    }
    return parsed;
}
function normalizeRevisionDate(raw) {
    if (typeof raw === 'string') {
        return raw.trim();
    }
    return new Date().toISOString().slice(0, 10);
}
function isRevisionDateFormat(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function resolveSourceHost(sourceUrl) {
    if (!sourceUrl)
        return '';
    try {
        return new URL(sourceUrl).hostname;
    }
    catch {
        return 'invalid-url';
    }
}
function buildAutoSyncStatus(sourceUrl, autoSyncEnabled, checkIntervalHours) {
    return {
        enabled: autoSyncEnabled,
        sourceHost: resolveSourceHost(sourceUrl),
        hasSourceUrl: !!sourceUrl,
        checkIntervalHours,
        supportsManualUrlOverride: true,
    };
}
async function parseDrugMasterRows(file, ext) {
    if (ext === '.csv') {
        const csvContent = (0, drug_master_service_1.decodeCsvBuffer)(file.buffer);
        return (0, drug_master_service_1.parseMhlwCsvData)(csvContent);
    }
    const excelRows = await (0, upload_service_1.parseExcelBuffer)(file.buffer);
    return (0, drug_master_service_1.parseMhlwExcelData)(excelRows);
}
async function parsePackageRows(file, ext) {
    if (ext === '.csv') {
        const csvContent = (0, drug_master_service_1.decodeCsvBuffer)(file.buffer);
        return (0, drug_master_service_1.parsePackageCsvData)(csvContent);
    }
    if (ext === '.xml') {
        const xmlContent = file.buffer.toString('utf-8');
        return (0, drug_master_service_1.parsePackageXmlData)(xmlContent);
    }
    if (ext === '.zip') {
        return (0, drug_master_service_1.parsePackageZipData)(file.buffer);
    }
    const excelRows = await (0, upload_service_1.parseExcelBuffer)(file.buffer);
    return (0, drug_master_service_1.parsePackageExcelData)(excelRows);
}
async function completeSyncLogAsFailed(syncLogId, errorMessage) {
    await (0, drug_master_service_1.completeSyncLog)(syncLogId, 'failed', EMPTY_SYNC_RESULT, errorMessage);
}
function uploadSingleFile(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (!err) {
            next();
            return;
        }
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({ error: 'ファイルサイズが上限(30MB)を超えています' });
                return;
            }
            res.status(400).json({ error: `アップロードエラー: ${err.message}` });
            return;
        }
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.status(500).json({ error: 'ファイルアップロード中にエラーが発生しました' });
    });
}
// ── 薬価基準収載品目リスト同期（ファイルアップロード）──
router.post('/sync', uploadSingleFile, async (req, res) => {
    let syncFailureLogged = false;
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'ファイルが必要です' });
            return;
        }
        const revisionDate = normalizeRevisionDate(req.body.revisionDate);
        // バリデーション: 日付形式
        if (!isRevisionDateFormat(revisionDate)) {
            logImportFailure('drug_master_sync', req, 'sync', 'invalid_revision_date', { revisionDate });
            res.status(400).json({ error: '改定日は YYYY-MM-DD 形式で指定してください' });
            return;
        }
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const userId = req.user.id;
        // 同期ログ作成
        const syncLog = await (0, drug_master_service_1.createSyncLog)('manual', file.originalname, userId);
        let parsedRows;
        try {
            parsedRows = await parseDrugMasterRows(file, ext);
        }
        catch (parseErr) {
            logImportFailure('drug_master_sync', req, 'sync', 'parse_failed', {
                extension: ext,
                syncLogId: syncLog.id,
                error: (0, admin_utils_1.getErrorMessage)(parseErr),
            });
            await completeSyncLogAsFailed(syncLog.id, (0, admin_utils_1.getErrorMessage)(parseErr));
            res.status(400).json({ error: (0, admin_utils_1.getErrorMessage)(parseErr) });
            return;
        }
        if (parsedRows.length === 0) {
            logImportFailure('drug_master_sync', req, 'sync', 'empty_rows', {
                extension: ext,
                syncLogId: syncLog.id,
            });
            await completeSyncLogAsFailed(syncLog.id, '有効なデータ行が見つかりません');
            res.status(400).json({ error: '有効なデータ行が見つかりませんでした。ファイル形式を確認してください。' });
            return;
        }
        try {
            // 同期実行
            const result = await (0, drug_master_service_1.syncDrugMaster)(parsedRows, syncLog.id, revisionDate);
            await (0, drug_master_service_1.completeSyncLog)(syncLog.id, 'success', result);
            await (0, log_service_1.writeLog)('drug_master_sync', {
                pharmacyId: userId,
                detail: `同期完了: 処理${result.itemsProcessed}件, 追加${result.itemsAdded}件, 更新${result.itemsUpdated}件, 削除${result.itemsDeleted}件`,
                ipAddress: (0, log_service_1.getClientIp)(req),
            });
            res.json({
                message: '同期が完了しました',
                result,
                syncLogId: syncLog.id,
            });
        }
        catch (syncErr) {
            syncFailureLogged = true;
            logger_1.logger.error('Drug master sync failed', () => ({
                ...getUploadContext(req),
                extension: ext,
                syncLogId: syncLog.id,
                error: (0, admin_utils_1.getErrorMessage)(syncErr),
                stack: syncErr instanceof Error ? syncErr.stack : undefined,
            }));
            logImportFailure('drug_master_sync', req, 'sync', 'sync_failed', {
                extension: ext,
                syncLogId: syncLog.id,
                error: (0, admin_utils_1.getErrorMessage)(syncErr),
            });
            // 同期失敗時もログを確実に閉じる
            try {
                await completeSyncLogAsFailed(syncLog.id, (0, admin_utils_1.getErrorMessage)(syncErr));
            }
            catch { /* ログ更新失敗は無視 */ }
            throw syncErr;
        }
    }
    catch (err) {
        if (!syncFailureLogged) {
            logger_1.logger.error('Drug master sync route error', () => ({
                ...getUploadContext(req),
                error: (0, admin_utils_1.getErrorMessage)(err),
                stack: err instanceof Error ? err.stack : undefined,
            }));
            logImportFailure('drug_master_sync', req, 'sync', 'unexpected_error', {
                error: (0, admin_utils_1.getErrorMessage)(err),
            });
        }
        res.status(500).json({ error: '同期処理中にエラーが発生しました' });
    }
});
// ── 包装単位データ登録 ────────────────────────────────
router.post('/upload-packages', uploadSingleFile, async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'ファイルが必要です' });
            return;
        }
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        let parsedRows;
        try {
            parsedRows = await parsePackageRows(file, ext);
        }
        catch (parseErr) {
            logImportFailure('drug_master_package_upload', req, 'upload_packages', 'parse_failed', {
                extension: ext,
                error: (0, admin_utils_1.getErrorMessage)(parseErr),
            });
            res.status(400).json({ error: parseErr instanceof Error ? parseErr.message : 'ファイルのパースに失敗しました' });
            return;
        }
        if (parsedRows.length === 0) {
            logImportFailure('drug_master_package_upload', req, 'upload_packages', 'empty_rows', {
                extension: ext,
            });
            res.status(400).json({ error: '有効なデータ行が見つかりませんでした。' });
            return;
        }
        const result = await (0, drug_master_service_1.syncPackageData)(parsedRows);
        await (0, log_service_1.writeLog)('drug_master_package_upload', {
            pharmacyId: req.user.id,
            detail: `包装単位データ登録: 追加${result.added}件, 更新${result.updated}件`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({
            message: '包装単位データの登録が完了しました',
            result,
        });
    }
    catch (err) {
        logger_1.logger.error('Drug package upload error', () => ({
            ...getUploadContext(req),
            error: (0, admin_utils_1.getErrorMessage)(err),
            stack: err instanceof Error ? err.stack : undefined,
        }));
        logImportFailure('drug_master_package_upload', req, 'upload_packages', 'unexpected_error', {
            error: (0, admin_utils_1.getErrorMessage)(err),
        });
        res.status(500).json({ error: '包装単位データの登録中にエラーが発生しました' });
    }
});
// ── 同期ログ一覧 ─────────────────────────────────
router.get('/sync-logs', async (_req, res) => {
    try {
        const logs = await (0, drug_master_service_1.getSyncLogs)(30);
        res.json({ data: logs });
    }
    catch (err) {
        logger_1.logger.error('Sync logs error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '同期ログの取得に失敗しました' });
    }
});
// ── 自動取得トリガー（URL設定済みの場合のサイト更新検知＆同期）──
router.post('/auto-sync', async (req, res) => {
    try {
        const sourceUrl = typeof req.body?.sourceUrl === 'string'
            ? req.body.sourceUrl.trim()
            : '';
        const sourceMode = req.body?.sourceMode === 'single' ? 'single' : undefined;
        const result = await (0, drug_master_scheduler_1.triggerManualAutoSync)({ sourceUrl: sourceUrl || null, sourceMode });
        if (result.triggered) {
            await (0, log_service_1.writeLog)('drug_master_sync', {
                pharmacyId: req.user.id,
                detail: sourceUrl ? '自動取得を手動トリガー（sourceUrl指定）' : '自動取得を手動トリガー',
                ipAddress: (0, log_service_1.getClientIp)(req),
            });
        }
        res.json(result);
    }
    catch (err) {
        logger_1.logger.error('Auto-sync trigger error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '自動取得の開始に失敗しました' });
    }
});
// ── 自動取得設定状況 ──
router.get('/auto-sync/status', async (_req, res) => {
    try {
        const sourceUrl = process.env.DRUG_MASTER_SOURCE_URL || '';
        const autoSyncEnabled = process.env.DRUG_MASTER_AUTO_SYNC === 'true';
        const checkIntervalHours = resolveIntervalHours(process.env.DRUG_MASTER_CHECK_INTERVAL_HOURS, 24);
        const sourceMode = (0, drug_master_scheduler_1.getConfiguredSourceMode)();
        const baseStatus = buildAutoSyncStatus(sourceUrl, autoSyncEnabled, checkIntervalHours);
        // index モードの場合、発見済みファイル情報を追加
        let discoveredFiles;
        let lastIndexCheck;
        if (sourceMode === 'index') {
            const states = await (0, drug_master_source_state_service_1.getSourceStatesByPrefix)('drug:');
            const indexState = states.find((s) => s.sourceKey === 'drug:index_page');
            lastIndexCheck = indexState?.lastCheckedAt ?? undefined;
            discoveredFiles = states
                .filter((s) => s.sourceKey.startsWith('drug:file:'))
                .map((s) => ({
                category: s.sourceKey.replace('drug:file:', ''),
                url: s.url,
                lastChanged: s.lastChangedAt,
            }));
        }
        res.json({
            ...baseStatus,
            sourceMode,
            discoveredFiles,
            lastIndexCheck,
        });
    }
    catch (err) {
        logger_1.logger.error('Auto-sync status error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '設定状況の取得に失敗しました' });
    }
});
// ── 包装単位データの自動取得トリガー ──
router.post('/auto-sync/packages', async (req, res) => {
    try {
        const sourceUrl = typeof req.body?.sourceUrl === 'string'
            ? req.body.sourceUrl.trim()
            : '';
        const result = await (0, drug_package_scheduler_1.triggerManualPackageAutoSync)({ sourceUrl: sourceUrl || null });
        if (result.triggered) {
            await (0, log_service_1.writeLog)('drug_master_package_upload', {
                pharmacyId: req.user.id,
                detail: sourceUrl
                    ? '包装単位データ自動取得を手動トリガー（sourceUrl指定）'
                    : '包装単位データ自動取得を手動トリガー',
                ipAddress: (0, log_service_1.getClientIp)(req),
            });
        }
        res.json(result);
    }
    catch (err) {
        logger_1.logger.error('Package auto-sync trigger error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '包装単位データ自動取得の開始に失敗しました' });
    }
});
router.get('/auto-sync/packages/status', async (_req, res) => {
    try {
        const sourceUrl = process.env.DRUG_PACKAGE_SOURCE_URL || '';
        const autoSyncEnabled = process.env.DRUG_PACKAGE_AUTO_SYNC === 'true';
        const checkIntervalHours = resolveIntervalHours(process.env.DRUG_PACKAGE_CHECK_INTERVAL_HOURS, 24);
        res.json(buildAutoSyncStatus(sourceUrl, autoSyncEnabled, checkIntervalHours));
    }
    catch (err) {
        logger_1.logger.error('Package auto-sync status error', {
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: '包装単位データ自動取得設定の取得に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=drug-master-sync.js.map