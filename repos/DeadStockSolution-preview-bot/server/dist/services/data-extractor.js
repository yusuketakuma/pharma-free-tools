"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDeadStockRowsWithIssues = extractDeadStockRowsWithIssues;
exports.extractDeadStockRows = extractDeadStockRows;
exports.extractUsedMedicationRowsWithIssues = extractUsedMedicationRowsWithIssues;
exports.extractUsedMedicationRows = extractUsedMedicationRows;
const string_utils_1 = require("../utils/string-utils");
const column_mapper_1 = require("./column-mapper");
function compileMapping(mapping) {
    return {
        drugCodeIdx: (0, column_mapper_1.parseColumnIndex)(mapping.drug_code),
        drugNameIdx: (0, column_mapper_1.parseColumnIndex)(mapping.drug_name),
        quantityIdx: (0, column_mapper_1.parseColumnIndex)(mapping.quantity),
        unitIdx: (0, column_mapper_1.parseColumnIndex)(mapping.unit),
        yakkaUnitPriceIdx: (0, column_mapper_1.parseColumnIndex)(mapping.yakka_unit_price),
        expirationDateIdx: (0, column_mapper_1.parseColumnIndex)(mapping.expiration_date),
        lotNumberIdx: (0, column_mapper_1.parseColumnIndex)(mapping.lot_number),
        monthlyUsageIdx: (0, column_mapper_1.parseColumnIndex)(mapping.monthly_usage),
    };
}
function getStringValue(row, colIndex) {
    const val = (0, column_mapper_1.getCell)(row, colIndex);
    if (val === null || val === undefined || String(val).trim() === '')
        return null;
    return String(val).trim();
}
function getNumberValue(row, colIndex) {
    const val = (0, column_mapper_1.getCell)(row, colIndex);
    return (0, string_utils_1.parseNumber)(val);
}
function isBlankCell(cell) {
    if (cell === null || cell === undefined)
        return true;
    if (typeof cell === 'string')
        return cell.trim() === '';
    return false;
}
function isBlankRow(row) {
    return row.every((cell) => isBlankCell(cell));
}
function normalizeRowForIssue(row) {
    return row.map((cell) => {
        if (cell === null || cell === undefined)
            return '';
        if (typeof cell === 'string')
            return cell;
        if (typeof cell === 'number' || typeof cell === 'boolean')
            return cell;
        return String(cell);
    });
}
function createIssue(rowIndex, issueCode, issueMessage, row) {
    return {
        rowNumber: rowIndex + 1,
        issueCode,
        issueMessage,
        rowData: normalizeRowForIssue(row),
    };
}
function extractDeadStockRowsWithIssues(dataRows, mapping, startIndex = 0) {
    const m = compileMapping(mapping);
    const rows = [];
    const issues = [];
    let inspectedRowCount = 0;
    for (let i = startIndex; i < dataRows.length; i += 1) {
        const row = dataRows[i] ?? [];
        if (isBlankRow(row)) {
            continue;
        }
        inspectedRowCount += 1;
        const drugName = getStringValue(row, m.drugNameIdx);
        const quantity = getNumberValue(row, m.quantityIdx);
        if (!drugName) {
            issues.push(createIssue(i, 'MISSING_DRUG_NAME', '薬剤名が入力されていません', row));
            continue;
        }
        if (quantity === null) {
            issues.push(createIssue(i, 'INVALID_QUANTITY', '数量が数値として解釈できません', row));
            continue;
        }
        if (quantity <= 0) {
            issues.push(createIssue(i, 'NON_POSITIVE_QUANTITY', '数量は0より大きい値を指定してください', row));
            continue;
        }
        const yakkaUnitPrice = getNumberValue(row, m.yakkaUnitPriceIdx);
        const yakkaTotal = yakkaUnitPrice !== null ? yakkaUnitPrice * quantity : null;
        rows.push({
            drugCode: getStringValue(row, m.drugCodeIdx),
            drugName,
            quantity,
            unit: getStringValue(row, m.unitIdx),
            yakkaUnitPrice,
            yakkaTotal,
            expirationDate: getStringValue(row, m.expirationDateIdx),
            lotNumber: getStringValue(row, m.lotNumberIdx),
        });
    }
    return {
        rows,
        issues,
        inspectedRowCount,
    };
}
function extractDeadStockRows(dataRows, mapping, startIndex = 0) {
    return extractDeadStockRowsWithIssues(dataRows, mapping, startIndex).rows;
}
function extractUsedMedicationRowsWithIssues(dataRows, mapping, startIndex = 0) {
    const m = compileMapping(mapping);
    const rows = [];
    const issues = [];
    let inspectedRowCount = 0;
    for (let i = startIndex; i < dataRows.length; i += 1) {
        const row = dataRows[i] ?? [];
        if (isBlankRow(row)) {
            continue;
        }
        inspectedRowCount += 1;
        const drugName = getStringValue(row, m.drugNameIdx);
        if (!drugName) {
            issues.push(createIssue(i, 'MISSING_DRUG_NAME', '薬剤名が入力されていません', row));
            continue;
        }
        rows.push({
            drugCode: getStringValue(row, m.drugCodeIdx),
            drugName,
            monthlyUsage: getNumberValue(row, m.monthlyUsageIdx),
            unit: getStringValue(row, m.unitIdx),
            yakkaUnitPrice: getNumberValue(row, m.yakkaUnitPriceIdx),
        });
    }
    return {
        rows,
        issues,
        inspectedRowCount,
    };
}
function extractUsedMedicationRows(dataRows, mapping, startIndex = 0) {
    return extractUsedMedicationRowsWithIssues(dataRows, mapping, startIndex).rows;
}
//# sourceMappingURL=data-extractor.js.map