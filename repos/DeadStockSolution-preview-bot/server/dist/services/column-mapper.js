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
exports.parseColumnIndex = parseColumnIndex;
exports.getCell = getCell;
exports.detectHeaderRow = detectHeaderRow;
exports.suggestMapping = suggestMapping;
exports.detectUploadType = detectUploadType;
exports.computeHeaderHash = computeHeaderHash;
const crypto = __importStar(require("crypto"));
const types_1 = require("../types");
const string_utils_1 = require("../utils/string-utils");
const KEYWORD_MAP = {
    drug_code: ['薬品コード', '医薬品コード', 'JANコード', 'YJコード', '統一商品コード', 'コード', 'code'],
    drug_name: ['薬品名', '医薬品名', '薬剤名', '品名', '品目名', '商品名', '名称', 'drug_name', 'name'],
    quantity: ['数量', '在庫数', '在庫数量', '残数', '個数', 'quantity', 'qty'],
    unit: ['単位', 'unit'],
    yakka_unit_price: ['薬価', '単価', '薬価単価', 'unit_price', 'price'],
    expiration_date: ['使用期限', '有効期限', '期限', 'expiry', 'expiration'],
    lot_number: ['ロット', 'ロット番号', 'lot', 'LOT'],
    monthly_usage: ['月間使用量', '使用量', '月間', '処方量', '使用数量', 'usage'],
};
const DEAD_STOCK_TYPE_HINTS = [
    '在庫',
    '数量',
    '使用期限',
    '有効期限',
    '期限',
    'ロット',
    'lot',
].map((h) => h.normalize('NFKC').toLowerCase());
const USED_MEDICATION_TYPE_HINTS = [
    '月間使用量',
    '使用量',
    '処方量',
    '月間',
    'monthly',
    'usage',
].map((h) => h.normalize('NFKC').toLowerCase());
function normalizeText(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .trim()
        .toLowerCase();
}
function parseColumnIndex(index) {
    if (index === null || index === undefined)
        return -1;
    const parsed = Number(index);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : -1;
}
function getCell(row, colIndex) {
    if (colIndex < 0 || colIndex >= row.length)
        return null;
    return row[colIndex];
}
function scoreHeaderHints(headerRow, hints) {
    const headers = headerRow.map((cell) => normalizeText(cell));
    let score = 0;
    for (const header of headers) {
        if (!header)
            continue;
        for (const hint of hints) {
            if (header === hint) {
                score += 4;
                continue;
            }
            if (header.includes(hint)) {
                score += 2;
            }
        }
    }
    return score;
}
function scoreDeadStockDataRows(rows, startIndex, mapping) {
    const drugNameIdx = parseColumnIndex(mapping.drug_name);
    const quantityIdx = parseColumnIndex(mapping.quantity);
    const expirationIdx = parseColumnIndex(mapping.expiration_date);
    const sampleLimit = Math.min(rows.length, startIndex + 30);
    let score = 0;
    for (let i = startIndex; i < sampleLimit; i += 1) {
        const row = rows[i] ?? [];
        const drugName = normalizeText(getCell(row, drugNameIdx));
        const quantity = (0, string_utils_1.parseNumber)(getCell(row, quantityIdx));
        const expiration = normalizeText(getCell(row, expirationIdx));
        if (drugName) {
            score += 1;
        }
        if (quantity !== null && quantity > 0) {
            score += 2;
        }
        if (expiration) {
            score += 1;
        }
    }
    return score;
}
function scoreUsedMedicationDataRows(rows, startIndex, mapping) {
    const drugNameIdx = parseColumnIndex(mapping.drug_name);
    const monthlyUsageIdx = parseColumnIndex(mapping.monthly_usage);
    const sampleLimit = Math.min(rows.length, startIndex + 30);
    let score = 0;
    for (let i = startIndex; i < sampleLimit; i += 1) {
        const row = rows[i] ?? [];
        const drugName = normalizeText(getCell(row, drugNameIdx));
        const monthlyUsage = (0, string_utils_1.parseNumber)(getCell(row, monthlyUsageIdx));
        if (drugName) {
            score += 1;
        }
        if (monthlyUsage !== null && monthlyUsage >= 0) {
            score += 2;
        }
    }
    return score;
}
function scoreDeadStockMapping(mapping) {
    let score = 0;
    if (mapping.drug_name)
        score += 5;
    if (mapping.quantity)
        score += 5;
    if (mapping.expiration_date)
        score += 2;
    if (mapping.unit)
        score += 1;
    return score;
}
function scoreUsedMedicationMapping(mapping) {
    let score = 0;
    if (mapping.drug_name)
        score += 5;
    if (mapping.monthly_usage)
        score += 5;
    if (mapping.unit)
        score += 1;
    return score;
}
function detectHeaderRow(rows) {
    let bestRow = 0;
    let bestScore = 0;
    const scanLimit = Math.min(rows.length, 10);
    for (let i = 0; i < scanLimit; i++) {
        const row = rows[i];
        if (!row)
            continue;
        // Count non-empty string cells
        const nonEmptyStrings = row.filter((cell) => cell !== null && cell !== undefined && String(cell).trim().length > 0).length;
        // Bonus for cells that contain known keywords
        let keywordScore = 0;
        for (const cell of row) {
            const cellStr = String(cell || '').normalize('NFKC');
            for (const keywords of Object.values(KEYWORD_MAP)) {
                if (keywords.some((kw) => cellStr.includes(kw))) {
                    keywordScore += 5;
                }
            }
        }
        const totalScore = nonEmptyStrings + keywordScore;
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestRow = i;
        }
    }
    return bestRow;
}
function suggestMapping(headerRow, uploadType) {
    const fields = uploadType === 'dead_stock' ? types_1.DEAD_STOCK_FIELDS : types_1.USED_MEDICATION_FIELDS;
    const mapping = {};
    for (const field of fields) {
        mapping[field] = null;
    }
    const headers = headerRow.map((h) => String(h || '').normalize('NFKC'));
    for (const field of fields) {
        const keywords = KEYWORD_MAP[field];
        if (!keywords)
            continue;
        let bestCol = null;
        let bestScore = 0;
        for (let colIdx = 0; colIdx < headers.length; colIdx++) {
            const header = headers[colIdx];
            if (!header)
                continue;
            let score = 0;
            for (const keyword of keywords) {
                if (header === keyword) {
                    score = 10; // exact match
                    break;
                }
                else if (header.includes(keyword)) {
                    score = Math.max(score, 5); // partial match
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestCol = String(colIdx);
            }
        }
        if (bestCol !== null) {
            mapping[field] = bestCol;
        }
    }
    return mapping;
}
function detectUploadType(rows, headerRowIndex) {
    const headerRow = rows[headerRowIndex] ?? [];
    const dataStartIndex = Math.max(0, headerRowIndex + 1);
    const deadStockMapping = suggestMapping(headerRow, 'dead_stock');
    const usedMedicationMapping = suggestMapping(headerRow, 'used_medication');
    const deadStockScore = (scoreHeaderHints(headerRow, DEAD_STOCK_TYPE_HINTS) * 4
        + scoreDeadStockMapping(deadStockMapping) * 3
        + scoreDeadStockDataRows(rows, dataStartIndex, deadStockMapping));
    const usedMedicationScore = (scoreHeaderHints(headerRow, USED_MEDICATION_TYPE_HINTS) * 4
        + scoreUsedMedicationMapping(usedMedicationMapping) * 3
        + scoreUsedMedicationDataRows(rows, dataStartIndex, usedMedicationMapping));
    const detectedType = usedMedicationScore > deadStockScore ? 'used_medication' : 'dead_stock';
    const scoreDiff = Math.abs(deadStockScore - usedMedicationScore);
    const confidence = scoreDiff >= 12 ? 'high' : scoreDiff >= 5 ? 'medium' : 'low';
    return {
        detectedType,
        confidence,
        scores: {
            dead_stock: deadStockScore,
            used_medication: usedMedicationScore,
        },
    };
}
function computeHeaderHash(headerRow) {
    const headerStr = headerRow.map((h) => String(h || '')).join('|');
    return crypto.createHash('md5').update(headerStr).digest('hex');
}
//# sourceMappingURL=column-mapper.js.map