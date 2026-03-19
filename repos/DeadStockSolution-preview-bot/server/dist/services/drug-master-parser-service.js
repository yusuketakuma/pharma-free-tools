"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseYjCode = parseYjCode;
exports.parseMhlwExcelData = parseMhlwExcelData;
exports.decodeCsvBuffer = decodeCsvBuffer;
exports.parseMhlwCsvData = parseMhlwCsvData;
exports.parsePackageCsvData = parsePackageCsvData;
exports.parsePackageXmlData = parsePackageXmlData;
exports.parsePackageZipData = parsePackageZipData;
exports.parsePackageExcelData = parsePackageExcelData;
exports.parseMhlwDrugFile = parseMhlwDrugFile;
const fast_xml_parser_1 = require("fast-xml-parser");
const adm_zip_1 = __importDefault(require("adm-zip"));
const string_utils_1 = require("../utils/string-utils");
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const upload_service_1 = require("./upload-service");
const logger_1 = require("./logger");
// ── MHLW Excel パース ─────────────────────────────────
// 厚生労働省の薬価基準収載品目リストの標準的なヘッダーキーワード
const MHLW_HEADER_KEYWORDS = {
    yjCode: ['薬価基準収載医薬品コード', 'YJコード', '医薬品コード', '収載コード', 'コード'],
    drugName: ['品名', '品目名称', '医薬品名', '名称', '商品名'],
    genericName: ['成分名', '一般名', '一般的名称'],
    specification: ['規格', '規格単位'],
    unit: ['単位', '薬価単位'],
    yakkaPrice: ['薬価', '薬価（円）', '薬価円', '告示価格'],
    manufacturer: ['メーカー', '製造販売業者', '業者名', '会社名', '販売名'],
    category: ['区分', '薬効分類', '投与経路'],
    therapeuticCategory: ['薬効分類番号', '分類番号'],
    listedDate: ['収載日', '収載年月日'],
    transitionDeadline: ['経過措置期限', '経過措置', '経過措置年月日'],
};
function detectMhlwHeaderRow(rows) {
    let bestRow = 0;
    let bestScore = 0;
    let bestMapping = {};
    const scanLimit = Math.min(rows.length, 15);
    for (let i = 0; i < scanLimit; i++) {
        const row = rows[i];
        if (!row)
            continue;
        const headers = row.map((h) => String(h || '').normalize('NFKC').trim());
        const mapping = {};
        let score = 0;
        for (const [field, keywords] of Object.entries(MHLW_HEADER_KEYWORDS)) {
            for (let colIdx = 0; colIdx < headers.length; colIdx++) {
                const header = headers[colIdx];
                if (!header)
                    continue;
                for (const keyword of keywords) {
                    let matched = header === keyword || header.includes(keyword);
                    // 「薬価基準収載医薬品コード」を薬価列と誤認しない
                    if (field === 'yakkaPrice' && matched && header.includes('コード')) {
                        matched = false;
                    }
                    if (matched) {
                        if (mapping[field] === undefined) {
                            mapping[field] = colIdx;
                            score += header === keyword ? 10 : 5;
                        }
                        break;
                    }
                }
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestRow = i;
            bestMapping = mapping;
        }
    }
    return { rowIndex: bestRow, mapping: bestMapping };
}
function getCell(row, idx) {
    if (idx === undefined || idx < 0 || idx >= row.length)
        return null;
    const val = row[idx];
    if (val === null || val === undefined)
        return null;
    const str = String(val).trim();
    return str || null;
}
function parseYjCode(raw) {
    if (!raw)
        return null;
    // YJコードは数字12桁（先頭のスペースやハイフン除去）
    const cleaned = raw.replace(/[\s\-]/g, '').normalize('NFKC');
    // 12桁の数字パターンにマッチするか
    if (/^\d{12}$/.test(cleaned))
        return cleaned;
    // 先頭にアルファベットが入るパターン（一部旧形式）
    if (/^[A-Z0-9]{12}$/i.test(cleaned))
        return cleaned;
    return null;
}
function parseMhlwExcelData(rows) {
    const { rowIndex, mapping } = detectMhlwHeaderRow(rows);
    if (mapping.yjCode === undefined && mapping.drugName === undefined) {
        throw new Error('薬価基準収載品目リストのフォーマットを検出できません。YJコードまたは品名の列が必要です。');
    }
    const results = [];
    for (let i = rowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row)
            continue;
        const yjCode = parseYjCode(getCell(row, mapping.yjCode));
        const drugName = getCell(row, mapping.drugName);
        const priceStr = getCell(row, mapping.yakkaPrice);
        const yakkaPrice = (0, string_utils_1.parseNumber)(priceStr);
        // YJコードと品名と薬価は必須
        if (!yjCode || !drugName || yakkaPrice === null || yakkaPrice < 0)
            continue;
        results.push({
            yjCode,
            drugName,
            genericName: getCell(row, mapping.genericName),
            specification: getCell(row, mapping.specification),
            unit: getCell(row, mapping.unit),
            yakkaPrice,
            manufacturer: getCell(row, mapping.manufacturer),
            category: getCell(row, mapping.category),
            therapeuticCategory: getCell(row, mapping.therapeuticCategory),
            listedDate: getCell(row, mapping.listedDate),
            transitionDeadline: getCell(row, mapping.transitionDeadline),
        });
    }
    return results;
}
// ── CSV エンコーディング検出 ──────────────────────────────
/**
 * バッファから文字列に変換する（UTF-8 / Shift_JIS 自動判別）
 * MHLWのCSVはShift_JIS（CP932）の場合が多い
 */
function decodeCsvBuffer(buffer) {
    // UTF-8 BOM check
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return buffer.toString('utf-8').slice(1); // BOM除去
    }
    // UTF-8 として妥当かチェック（不正バイトシーケンスが含まれるならShift_JISの可能性）
    const utf8Text = buffer.toString('utf-8');
    // 置換文字（U+FFFD）が含まれる場合、UTF-8として不正
    if (!utf8Text.includes('\uFFFD')) {
        return utf8Text;
    }
    // Shift_JIS（CP932）でデコードを試みる
    if (iconv_lite_1.default.encodingExists('CP932')) {
        return iconv_lite_1.default.decode(buffer, 'CP932');
    }
    return utf8Text;
}
// ── CSV パース ──────────────────────────────────────
function parseMhlwCsvData(csvContent) {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length < 2)
        return [];
    // ヘッダー行を検出（CSVなのでカンマ区切り）
    const allRows = lines.map((line) => parseCsvLine(line));
    return parseMhlwExcelData(allRows);
}
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else if (ch === '"') {
                inQuotes = false;
            }
            else {
                current += ch;
            }
        }
        else {
            if (ch === '"') {
                inQuotes = true;
            }
            else if (ch === ',') {
                result.push(current);
                current = '';
            }
            else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}
// ── 包装単位データパース ────────────────────────────────
const PACKAGE_HEADER_KEYWORDS = {
    yjCode: ['薬価基準収載医薬品コード', 'YJコード', '医薬品コード'],
    gs1Code: ['GS1コード', 'GS1', 'GTIN', '販売包装単位コード'],
    janCode: ['JANコード', 'JAN'],
    hotCode: ['HOTコード', 'HOT', 'HOT番号'],
    packageDescription: ['包装', '包装規格', '包装単位', '包装形態'],
    packageQuantity: ['包装数量', '入数', '数量'],
    packageUnit: ['単位', '包装単位名'],
};
const PACKAGE_XML_KEYWORDS = {
    yjCode: ['yjcode', 'yjコード', '薬価基準収載医薬品コード', '医薬品コード'],
    gs1Code: ['gs1', '販売包装単位コード', 'gtin'],
    janCode: ['jan'],
    hotCode: ['hot'],
    packageDescription: ['包装単位', '包装規格', '包装形態'],
    packageQuantity: ['包装数量', '入数', '数量'],
    packageUnit: ['包装単位名', '単位'],
};
function parsePackageCsvData(csvContent) {
    const lines = csvContent.split(/\r?\n/);
    const allRows = lines.map((line) => parseCsvLine(line));
    return parsePackageExcelData(allRows);
}
function normalizeXmlKey(key) {
    return key
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\s_\-（）()【】\[\]\/]/g, '');
}
function toXmlStringValue(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const text = String(value).trim();
        return text || null;
    }
    if (typeof value !== 'object')
        return null;
    const record = value;
    for (const key of ['#text', '_text', 'text']) {
        const val = record[key];
        if (typeof val === 'string') {
            const text = val.trim();
            if (text)
                return text;
        }
    }
    return null;
}
function pickXmlField(obj, keywords, options) {
    let bestValue = null;
    let bestScore = -1;
    for (const [rawKey, rawValue] of Object.entries(obj)) {
        const key = normalizeXmlKey(rawKey);
        if (options?.excludeIfKeyIncludes?.some((kw) => key.includes(normalizeXmlKey(kw)))) {
            continue;
        }
        for (const keyword of keywords) {
            const normalizedKeyword = normalizeXmlKey(keyword);
            let score = -1;
            if (key === normalizedKeyword) {
                score = 100;
            }
            else if (key.endsWith(normalizedKeyword)) {
                score = 80;
            }
            else if (key.includes(normalizedKeyword)) {
                score = 60;
            }
            if (score > bestScore) {
                const value = toXmlStringValue(rawValue);
                if (value) {
                    bestScore = score;
                    bestValue = value;
                }
            }
        }
    }
    return bestValue;
}
function extractPackageRowFromXmlObject(obj) {
    const yjRaw = pickXmlField(obj, PACKAGE_XML_KEYWORDS.yjCode);
    const yjCode = parseYjCode(yjRaw);
    if (!yjCode)
        return null;
    const gs1Code = pickXmlField(obj, PACKAGE_XML_KEYWORDS.gs1Code);
    const janCode = pickXmlField(obj, PACKAGE_XML_KEYWORDS.janCode);
    const hotCode = pickXmlField(obj, PACKAGE_XML_KEYWORDS.hotCode);
    if (!gs1Code && !janCode && !hotCode)
        return null;
    return {
        yjCode,
        gs1Code,
        janCode,
        hotCode,
        packageDescription: pickXmlField(obj, PACKAGE_XML_KEYWORDS.packageDescription, { excludeIfKeyIncludes: ['コード'] }),
        packageQuantity: (0, string_utils_1.parseNumber)(pickXmlField(obj, PACKAGE_XML_KEYWORDS.packageQuantity)),
        packageUnit: pickXmlField(obj, PACKAGE_XML_KEYWORDS.packageUnit, { excludeIfKeyIncludes: ['コード'] }),
    };
}
function parsePackageXmlData(xmlContent) {
    const parser = new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        parseTagValue: true,
        parseAttributeValue: false,
        trimValues: true,
    });
    const parsed = parser.parse(xmlContent);
    const rows = [];
    const walk = (node) => {
        if (!node)
            return;
        if (Array.isArray(node)) {
            for (const child of node)
                walk(child);
            return;
        }
        if (typeof node !== 'object')
            return;
        const obj = node;
        const row = extractPackageRowFromXmlObject(obj);
        if (row)
            rows.push(row);
        for (const value of Object.values(obj)) {
            walk(value);
        }
    };
    walk(parsed);
    const deduped = new Map();
    for (const row of rows) {
        const key = [row.yjCode, row.gs1Code ?? '', row.janCode ?? '', row.hotCode ?? '', row.packageDescription ?? ''].join('|');
        if (!deduped.has(key)) {
            deduped.set(key, row);
        }
    }
    return [...deduped.values()];
}
const MAX_ZIP_ENTRY_SIZE = 200 * 1024 * 1024; // 200MB per entry
const MAX_ZIP_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total
function yieldToEventLoop() {
    return new Promise((resolve) => setImmediate(resolve));
}
async function parsePackageZipData(buffer) {
    const zip = new adm_zip_1.default(buffer);
    const rows = [];
    let totalSize = 0;
    const entries = zip.getEntries();
    for (let idx = 0; idx < entries.length; idx++) {
        const entry = entries[idx];
        if (entry.isDirectory)
            continue;
        // パストラバーサル対策
        if (entry.entryName.includes('..'))
            continue;
        // サイズ制限チェック
        if (entry.header.size > MAX_ZIP_ENTRY_SIZE) {
            logger_1.logger.warn(`Skipping oversized ZIP entry: ${entry.entryName} (${entry.header.size} bytes)`);
            continue;
        }
        totalSize += entry.header.size;
        if (totalSize > MAX_ZIP_TOTAL_SIZE) {
            logger_1.logger.warn(`ZIP total extracted size exceeds limit (${MAX_ZIP_TOTAL_SIZE} bytes), stopping`);
            break;
        }
        const lowerName = entry.entryName.toLowerCase();
        const entryBuffer = entry.getData();
        try {
            if (lowerName.endsWith('.xml')) {
                rows.push(...parsePackageXmlData(entryBuffer.toString('utf-8')));
            }
            else if (lowerName.endsWith('.csv')) {
                rows.push(...parsePackageCsvData(decodeCsvBuffer(entryBuffer)));
            }
            else if (lowerName.endsWith('.xlsx')) {
                const excelRows = await (0, upload_service_1.parseExcelBuffer)(entryBuffer);
                rows.push(...parsePackageExcelData(excelRows));
            }
        }
        catch (err) {
            logger_1.logger.warn(`Failed to parse ZIP entry: ${entry.entryName}`, { error: err instanceof Error ? err.message : err });
        }
        // エントリ処理間にイベントループを解放
        if (idx % 5 === 4) {
            await yieldToEventLoop();
        }
    }
    const deduped = new Map();
    for (const row of rows) {
        const key = [row.yjCode, row.gs1Code ?? '', row.janCode ?? '', row.hotCode ?? '', row.packageDescription ?? ''].join('|');
        if (!deduped.has(key)) {
            deduped.set(key, row);
        }
    }
    return [...deduped.values()];
}
function parsePackageExcelData(rows) {
    const { rowIndex, mapping } = detectPackageHeader(rows);
    if (mapping.yjCode === undefined) {
        throw new Error('包装単位データのフォーマットを検出できません。YJコードの列が必要です。');
    }
    const results = [];
    for (let i = rowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row)
            continue;
        const yjCode = parseYjCode(getCell(row, mapping.yjCode));
        if (!yjCode)
            continue;
        const gs1Code = getCell(row, mapping.gs1Code);
        const janCode = getCell(row, mapping.janCode);
        const hotCode = getCell(row, mapping.hotCode);
        // 少なくとも1つのコードが必要
        if (!gs1Code && !janCode && !hotCode)
            continue;
        results.push({
            yjCode,
            gs1Code,
            janCode,
            hotCode,
            packageDescription: getCell(row, mapping.packageDescription),
            packageQuantity: (0, string_utils_1.parseNumber)(getCell(row, mapping.packageQuantity)),
            packageUnit: getCell(row, mapping.packageUnit),
        });
    }
    return results;
}
function detectPackageHeader(rows) {
    let bestRow = 0;
    let bestScore = 0;
    let bestMapping = {};
    const scanLimit = Math.min(rows.length, 15);
    for (let i = 0; i < scanLimit; i++) {
        const row = rows[i];
        if (!row)
            continue;
        const headers = row.map((h) => String(h || '').normalize('NFKC').trim());
        const mapping = {};
        let score = 0;
        for (const [field, keywords] of Object.entries(PACKAGE_HEADER_KEYWORDS)) {
            for (let colIdx = 0; colIdx < headers.length; colIdx++) {
                const header = headers[colIdx];
                if (!header)
                    continue;
                for (const keyword of keywords) {
                    if (header === keyword || header.includes(keyword)) {
                        if (mapping[field] === undefined) {
                            mapping[field] = colIdx;
                            score += header === keyword ? 10 : 5;
                        }
                        break;
                    }
                }
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestRow = i;
            bestMapping = mapping;
        }
    }
    return { rowIndex: bestRow, mapping: bestMapping };
}
/**
 * MHLW 薬価基準ファイル（Excel/CSV）をパースする共通エントリーポイント。
 * drug-master-scheduler と mhlw-multi-file-fetcher から使用。
 */
async function parseMhlwDrugFile(url, contentType, buffer) {
    const isCsv = contentType?.includes('csv')
        || contentType?.includes('text/plain')
        || url.endsWith('.csv');
    if (isCsv) {
        const csvContent = decodeCsvBuffer(buffer);
        return parseMhlwCsvData(csvContent);
    }
    const excelRows = await (0, upload_service_1.parseExcelBuffer)(buffer);
    return parseMhlwExcelData(excelRows);
}
//# sourceMappingURL=drug-master-parser-service.js.map