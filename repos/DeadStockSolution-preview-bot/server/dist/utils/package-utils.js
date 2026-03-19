"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePackageInfo = normalizePackageInfo;
exports.scorePackageMatch = scorePackageMatch;
const string_utils_1 = require("./string-utils");
function formatQuantity(value) {
    const rounded = Math.round(value * 1000) / 1000;
    if (Number.isInteger(rounded))
        return String(rounded);
    return String(rounded);
}
function normalizeUnit(raw) {
    if (!raw)
        return null;
    const normalized = raw.normalize('NFKC').replace(/\s+/g, '');
    if (!normalized)
        return null;
    if (/^(cap|capsule|cp|カプセル)$/i.test(normalized))
        return 'カプセル';
    if (/^(ml)$/i.test(normalized))
        return 'mL';
    if (/^(μg|ug)$/i.test(normalized))
        return 'μg';
    if (/^(mg|g|mL|L|錠|包|袋|本|枚|個|管|キット|カプセル)$/i.test(normalized))
        return normalized;
    const match = normalized.match(/(錠|カプセル|包|袋|本|枚|個|管|キット|mL|ml|L|g|mg|μg|ug)/i);
    if (!match)
        return null;
    return normalizeUnit(match[0]);
}
function detectPackageForm(description, isLoose) {
    if (isLoose)
        return 'loose';
    if (/ptp/i.test(description))
        return 'ptp';
    if (/瓶|ボトル|bottle/i.test(description))
        return 'bottle';
    if (/分包|sachet|stick|スティック/i.test(description))
        return 'sachet';
    if (/バイアル|vial/i.test(description))
        return 'vial';
    if (/アンプル|ampoule|ampule/i.test(description))
        return 'ampoule';
    if (description)
        return 'other';
    return null;
}
function parseQuantityAndUnitFromDescription(description) {
    const normalized = description.normalize('NFKC');
    const direct = normalized.match(/(\d+(?:\.\d+)?)\s*(錠|カプセル|包|袋|本|枚|個|管|キット|mL|ml|L|g|mg|μg|ug)/i);
    if (direct) {
        const quantity = (0, string_utils_1.parseNumber)(direct[1]);
        const unit = normalizeUnit(direct[2]);
        return { quantity, unit };
    }
    const multiplied = normalized.match(/(\d+(?:\.\d+)?)\s*(錠|カプセル|包|袋|本|枚|個)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
    if (multiplied) {
        const left = (0, string_utils_1.parseNumber)(multiplied[1]);
        const right = (0, string_utils_1.parseNumber)(multiplied[3]);
        const unit = normalizeUnit(multiplied[2]);
        if (left !== null && right !== null) {
            return { quantity: left * right, unit };
        }
    }
    return { quantity: null, unit: null };
}
function normalizePackageInfo(input) {
    const rawDescription = (input.packageDescription ?? '').normalize('NFKC').trim();
    const isLoosePackage = /バラ/.test(rawDescription);
    const packageForm = detectPackageForm(rawDescription, isLoosePackage);
    let quantity = input.packageQuantity ?? null;
    let unit = normalizeUnit(input.packageUnit ?? null);
    if (quantity === null || unit === null) {
        const parsed = parseQuantityAndUnitFromDescription(rawDescription);
        if (quantity === null)
            quantity = parsed.quantity;
        if (unit === null)
            unit = parsed.unit;
    }
    const normalizedPackageLabel = quantity !== null && unit
        ? `${formatQuantity(quantity)}${unit}${isLoosePackage ? 'バラ' : ''}`
        : null;
    return {
        normalizedPackageLabel,
        packageForm,
        isLoosePackage,
        quantity,
        unit,
    };
}
function normalizeLooseHint(value) {
    const normalized = value.normalize('NFKC');
    return /バラ/.test(normalized);
}
function scorePackageMatch(options) {
    const rowUnit = options.rowUnit?.normalize('NFKC').replace(/\s+/g, '').toLowerCase() ?? '';
    if (!rowUnit)
        return 0;
    let score = 0;
    const normalizedLabel = options.normalizedPackageLabel?.normalize('NFKC').replace(/\s+/g, '').toLowerCase() ?? '';
    const description = options.packageDescription?.normalize('NFKC').replace(/\s+/g, '').toLowerCase() ?? '';
    if (normalizedLabel && rowUnit === normalizedLabel)
        score += 120;
    if (normalizedLabel && rowUnit.includes(normalizedLabel))
        score += 80;
    if (normalizedLabel && normalizedLabel.includes(rowUnit))
        score += 60;
    if (description && rowUnit === description)
        score += 80;
    if (description && rowUnit.includes(description))
        score += 50;
    if (description && description.includes(rowUnit))
        score += 30;
    const rowLoose = normalizeLooseHint(rowUnit);
    if (rowLoose && options.isLoosePackage)
        score += 20;
    if (rowLoose !== options.isLoosePackage)
        score -= 10;
    return score;
}
//# sourceMappingURL=package-utils.js.map