"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = exports.USED_MEDICATION_FIELD_SET = exports.DEAD_STOCK_FIELD_SET = exports.VALID_UPLOAD_TYPES = exports.ALLOWED_MIME_TYPES = exports.ALLOWED_EXTENSIONS = exports.INSERT_BATCH_SIZE = exports.MAX_MAPPING_COLUMN_INDEX = exports.MAX_MAPPING_KEYS = exports.MAX_UPLOAD_SIZE = void 0;
exports.getBaseContext = getBaseContext;
exports.sanitizeLogValue = sanitizeLogValue;
exports.logUploadFailure = logUploadFailure;
exports.uploadSingleFile = uploadSingleFile;
exports.parseMapping = parseMapping;
exports.parseUploadType = parseUploadType;
exports.getUploadFileOrReject = getUploadFileOrReject;
exports.getUploadTypeOrReject = getUploadTypeOrReject;
exports.parseExcelRowsOrReject = parseExcelRowsOrReject;
exports.parseHeaderRowIndexOrReject = parseHeaderRowIndexOrReject;
exports.validateMappingAgainstHeader = validateMappingAgainstHeader;
exports.resolveMappingFromTemplateWithSource = resolveMappingFromTemplateWithSource;
exports.resolveMappingFromTemplate = resolveMappingFromTemplate;
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const types_1 = require("../types");
const column_mapper_1 = require("../services/column-mapper");
const logger_1 = require("../services/logger");
const log_service_1 = require("../services/log-service");
const upload_service_1 = require("../services/upload-service");
const error_handler_1 = require("../middleware/error-handler");
exports.MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
exports.MAX_MAPPING_KEYS = 30;
exports.MAX_MAPPING_COLUMN_INDEX = 199;
exports.INSERT_BATCH_SIZE = 500;
exports.ALLOWED_EXTENSIONS = new Set(['.xlsx']);
exports.ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
]);
exports.VALID_UPLOAD_TYPES = new Set(['dead_stock', 'used_medication']);
exports.DEAD_STOCK_FIELD_SET = new Set(types_1.DEAD_STOCK_FIELDS);
exports.USED_MEDICATION_FIELD_SET = new Set(types_1.USED_MEDICATION_FIELDS);
const MAPPING_FIELD_LABELS = {
    drug_code: '薬品コード',
    drug_name: '薬剤名',
    quantity: '数量',
    unit: '単位',
    yakka_unit_price: '薬価',
    expiration_date: '使用期限',
    lot_number: 'ロット番号',
    monthly_usage: '月間使用量',
};
function getBaseContext(req) {
    const authReq = req;
    const uploadTypeRaw = authReq.body?.uploadType;
    return {
        path: req.path,
        pharmacyId: authReq.user?.id ?? null,
        uploadType: typeof uploadTypeRaw === 'string' ? uploadTypeRaw : null,
        fileName: authReq.file?.originalname ?? null,
        fileType: authReq.file?.mimetype ?? null,
        fileSize: authReq.file?.size ?? null,
    };
}
var error_handler_2 = require("../middleware/error-handler");
Object.defineProperty(exports, "getErrorMessage", { enumerable: true, get: function () { return error_handler_2.getErrorMessage; } });
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
function logUploadFailure(req, phase, reason, extra = {}) {
    const authReq = req;
    const detailParts = [
        '失敗',
        `phase=${phase}`,
        `reason=${reason}`,
    ];
    const uploadType = sanitizeLogValue(authReq.body?.uploadType, 40);
    if (uploadType)
        detailParts.push(`uploadType=${uploadType}`);
    const fileName = sanitizeLogValue(authReq.file?.originalname, 120);
    if (fileName)
        detailParts.push(`file=${fileName}`);
    for (const [key, value] of Object.entries(extra)) {
        const sanitized = sanitizeLogValue(value);
        if (sanitized) {
            detailParts.push(`${key}=${sanitized}`);
        }
    }
    void (0, log_service_1.writeLog)('upload', {
        pharmacyId: authReq.user?.id ?? null,
        detail: detailParts.join('|'),
        ipAddress: (0, log_service_1.getClientIp)(authReq),
    });
}
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: exports.MAX_UPLOAD_SIZE,
        files: 1,
        fields: 10,
        fieldSize: 100 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!exports.ALLOWED_EXTENSIONS.has(ext) || !exports.ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(new Error('xlsxファイルのみアップロードできます'));
            return;
        }
        cb(null, true);
    },
});
function uploadSingleFile(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (!err) {
            next();
            return;
        }
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                logUploadFailure(req, 'file_upload', 'file_too_large', { code: err.code });
                res.status(400).json({ error: `ファイルサイズは${exports.MAX_UPLOAD_SIZE / (1024 * 1024)}MB以下にしてください` });
                return;
            }
            logUploadFailure(req, 'file_upload', 'multer_error', { code: err.code, error: err.message });
            res.status(400).json({ error: 'アップロードに失敗しました' });
            return;
        }
        if (err instanceof Error) {
            logUploadFailure(req, 'file_upload', 'file_filter_rejected', { error: err.message });
            res.status(400).json({ error: err.message });
            return;
        }
        logger_1.logger.warn('Upload rejected by unknown error', () => getBaseContext(req));
        logUploadFailure(req, 'file_upload', 'unknown_upload_error');
        res.status(400).json({ error: 'アップロードに失敗しました' });
    });
}
function parseMapping(raw, uploadType) {
    if (typeof raw !== 'string') {
        throw new Error('mapping形式が不正です');
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('mapping形式が不正です');
    }
    const entries = Object.entries(parsed);
    if (entries.length > exports.MAX_MAPPING_KEYS) {
        throw new Error('mappingの項目数が多すぎます');
    }
    const allowedFields = uploadType === 'dead_stock' ? exports.DEAD_STOCK_FIELD_SET : exports.USED_MEDICATION_FIELD_SET;
    const sanitized = Object.create(null);
    for (const field of allowedFields) {
        sanitized[field] = null;
    }
    for (const [key, value] of entries) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue;
        }
        if (key.length > 50 || !allowedFields.has(key)) {
            continue;
        }
        if (value === null) {
            sanitized[key] = null;
            continue;
        }
        if (typeof value === 'string') {
            const normalized = value.trim();
            if (/^\d{1,3}$/.test(normalized)) {
                const colIdx = Number(normalized);
                if (Number.isInteger(colIdx) && colIdx >= 0 && colIdx <= exports.MAX_MAPPING_COLUMN_INDEX) {
                    sanitized[key] = normalized;
                }
            }
        }
    }
    if (!sanitized.drug_name) {
        throw new Error('薬剤名カラムの割り当てが必要です');
    }
    if (uploadType === 'dead_stock' && !sanitized.quantity) {
        throw new Error('数量カラムの割り当てが必要です');
    }
    return sanitized;
}
function parseUploadType(raw) {
    if (typeof raw !== 'string')
        return null;
    return exports.VALID_UPLOAD_TYPES.has(raw) ? raw : null;
}
function getUploadFileOrReject(req, res) {
    if (!req.file) {
        res.status(400).json({ error: 'ファイルが選択されていません' });
        return null;
    }
    return req.file;
}
function getUploadTypeOrReject(req, res) {
    const uploadType = parseUploadType(req.body.uploadType);
    if (!uploadType) {
        res.status(400).json({ error: 'アップロードタイプを指定してください' });
        return null;
    }
    return uploadType;
}
async function parseExcelRowsOrReject(req, res, phase, fileBuffer) {
    try {
        return await (0, upload_service_1.parseExcelBuffer)(fileBuffer);
    }
    catch (err) {
        const reason = (0, error_handler_1.getErrorMessage)(err);
        logUploadFailure(req, phase, 'parse_failed', { error: reason });
        if (reason.includes('上限')) {
            res.status(400).json({ error: reason });
            return null;
        }
        res.status(400).json({ error: 'ファイルの解析に失敗しました。xlsx形式を確認してください' });
        return null;
    }
}
function parseHeaderRowIndexOrReject(req, res) {
    const headerRowRaw = typeof req.body.headerRowIndex === 'string'
        ? req.body.headerRowIndex.trim()
        : '';
    if (!/^\d+$/.test(headerRowRaw)) {
        logUploadFailure(req, 'confirm', 'invalid_header_row_format', { headerRowIndex: headerRowRaw });
        res.status(400).json({ error: 'ヘッダー行指定が不正です' });
        return null;
    }
    const headerRowIndex = Number(headerRowRaw);
    if (!Number.isSafeInteger(headerRowIndex)) {
        logUploadFailure(req, 'confirm', 'invalid_header_row_value', { headerRowIndex });
        res.status(400).json({ error: 'ヘッダー行指定が不正です' });
        return null;
    }
    return headerRowIndex;
}
function resolveMappingFieldLabel(field) {
    return MAPPING_FIELD_LABELS[field] ?? field;
}
function parseMappingColumnIndex(index) {
    if (index === null || index === undefined)
        return null;
    const parsed = Number(index);
    return Number.isInteger(parsed) ? parsed : null;
}
function validateMappingAgainstHeader(mapping, headerRow) {
    const headerLength = Array.isArray(headerRow) ? headerRow.length : 0;
    if (headerLength <= 0) {
        throw new Error('ヘッダー行が不正です');
    }
    for (const [field, value] of Object.entries(mapping)) {
        if (value === null)
            continue;
        const colIndex = parseMappingColumnIndex(value);
        if (colIndex === null || colIndex < 0 || colIndex >= headerLength) {
            throw new Error(`${resolveMappingFieldLabel(field)}カラムの割り当てが見出し範囲外です`);
        }
    }
}
function resolveMappingFromTemplateWithSource(savedMappingRaw, headerRow, uploadType) {
    if (savedMappingRaw) {
        try {
            return {
                mapping: parseMapping(savedMappingRaw, uploadType),
                fromSavedTemplate: true,
            };
        }
        catch {
            // fallback
        }
    }
    return {
        mapping: (0, column_mapper_1.suggestMapping)(headerRow, uploadType),
        fromSavedTemplate: false,
    };
}
function resolveMappingFromTemplate(savedMappingRaw, headerRow, uploadType) {
    return resolveMappingFromTemplateWithSource(savedMappingRaw, headerRow, uploadType).mapping;
}
//# sourceMappingURL=upload-validation.js.map