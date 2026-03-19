"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MATCHING_SCORING_RULES = void 0;
exports.setLimitedCacheEntry = setLimitedCacheEntry;
exports.roundTo2 = roundTo2;
exports.prepareDrugName = prepareDrugName;
exports.buildUsedMedIndex = buildUsedMedIndex;
exports.findBestDrugMatch = findBestDrugMatch;
exports.toStartOfDay = toStartOfDay;
exports.parseExpiryDate = parseExpiryDate;
exports.isExpiredDate = isExpiredDate;
exports.getNearExpiryCount = getNearExpiryCount;
exports.calculateCandidateScore = calculateCandidateScore;
exports.calculateMatchRate = calculateMatchRate;
const fastest_levenshtein_1 = require("fastest-levenshtein");
const string_utils_1 = require("../utils/string-utils");
const MAX_DRUG_MATCH_CACHE_SIZE = 2000;
const MAX_PARSED_EXPIRY_CACHE_SIZE = 5000;
exports.DEFAULT_MATCHING_SCORING_RULES = {
    nameMatchThreshold: 0.7,
    valueScoreMax: 55,
    valueScoreDivisor: 2500,
    balanceScoreMax: 20,
    balanceScoreDiffFactor: 1.5,
    distanceScoreMax: 15,
    distanceScoreDivisor: 8,
    distanceScoreFallback: 2,
    nearExpiryScoreMax: 10,
    nearExpiryItemFactor: 1.5,
    nearExpiryDays: 120,
    diversityScoreMax: 10,
    diversityItemFactor: 1.5,
    favoriteBonus: 15,
};
function setLimitedCacheEntry(cache, key, value, maxSize) {
    if (!cache.has(key) && cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        if (typeof oldestKey === 'string') {
            cache.delete(oldestKey);
        }
    }
    cache.set(key, value);
}
function roundTo2(value) {
    return Math.round(value * 100) / 100;
}
function normalizeDrugName(name) {
    return (0, string_utils_1.normalizeString)(name)
        .replace(/[0-9]+(?:\.[0-9]+)?(?:mg|ml|μg|mcg|g|％|%)/gi, '')
        .replace(/(錠|カプセル|散|シロップ|注射|外用|内服|点眼|軟膏)$/g, '')
        .trim();
}
function prepareDrugName(name) {
    const normalizedDrugName = normalizeDrugName(name);
    const tokenSet = normalizedDrugName ? createTokenSet(normalizedDrugName) : new Set();
    return { normalizedDrugName, tokenSet };
}
function createTokenSet(normalizedName) {
    const baseTokens = normalizedName
        .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 0);
    const tokenSet = new Set(baseTokens);
    const forNgram = baseTokens.length <= 1 ? (baseTokens[0] ?? normalizedName) : '';
    if (forNgram.length >= 3) {
        for (let i = 0; i < forNgram.length - 1; i++) {
            tokenSet.add(forNgram.slice(i, i + 2));
        }
    }
    if (tokenSet.size === 0 && normalizedName) {
        tokenSet.add(normalizedName);
    }
    return tokenSet;
}
function jaccardScore(tokensA, tokensB) {
    if (tokensA.size === 0 || tokensB.size === 0)
        return 0;
    const [smaller, larger] = tokensA.size <= tokensB.size
        ? [tokensA, tokensB]
        : [tokensB, tokensA];
    let intersection = 0;
    for (const token of smaller) {
        if (larger.has(token))
            intersection += 1;
    }
    const union = tokensA.size + tokensB.size - intersection;
    if (union === 0)
        return 0;
    return intersection / union;
}
function computeNameSimilarity(normalizedA, tokensA, nameB) {
    const normalizedB = nameB.normalizedName;
    if (!normalizedA || !normalizedB)
        return 0;
    if (normalizedA === normalizedB)
        return 1;
    if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA))
        return 0.9;
    const tokenScore = jaccardScore(tokensA, nameB.tokenSet);
    const maxLen = Math.max(normalizedA.length, normalizedB.length);
    if (maxLen === 0)
        return tokenScore;
    // Token overlap and string length can reject unlikely pairs before Levenshtein.
    if (tokenScore < 0.12 && Math.abs(normalizedA.length - nameB.length) > maxLen * 0.6) {
        return tokenScore;
    }
    const levScore = maxLen === 0 ? 0 : 1 - ((0, fastest_levenshtein_1.distance)(normalizedA, normalizedB) / maxLen);
    return Math.max(levScore, tokenScore);
}
function buildUsedMedIndex(rows) {
    const names = [];
    const exactNames = new Set();
    const tokenIndex = new Map();
    const lengthBuckets = new Map();
    for (const row of rows) {
        const normalizedName = normalizeDrugName(row.drugName);
        if (!normalizedName || exactNames.has(normalizedName))
            continue;
        exactNames.add(normalizedName);
        const tokenSet = createTokenSet(normalizedName);
        const index = names.length;
        names.push({
            normalizedName,
            tokenSet,
            length: normalizedName.length,
        });
        const lengthBucket = lengthBuckets.get(normalizedName.length);
        if (lengthBucket) {
            lengthBucket.push(index);
        }
        else {
            lengthBuckets.set(normalizedName.length, [index]);
        }
        for (const token of tokenSet) {
            if (token.length < 2)
                continue;
            const list = tokenIndex.get(token);
            if (list) {
                list.push(index);
            }
            else {
                tokenIndex.set(token, [index]);
            }
        }
    }
    return { exactNames, names, tokenIndex, lengthBuckets };
}
function collectCandidateIndices(normalizedDrugName, tokenSet, index) {
    const candidateIds = new Set();
    for (const token of tokenSet) {
        const matched = index.tokenIndex.get(token);
        if (!matched)
            continue;
        for (const id of matched) {
            candidateIds.add(id);
            if (candidateIds.size >= 500)
                break;
        }
        if (candidateIds.size >= 500)
            break;
    }
    // Ensure near-length alternatives are included when token hit is sparse.
    if (candidateIds.size > 0 && candidateIds.size < 25) {
        const targetLength = normalizedDrugName.length;
        for (let length = Math.max(0, targetLength - 2); length <= targetLength + 2; length += 1) {
            const nearLengthCandidates = index.lengthBuckets.get(length);
            if (!nearLengthCandidates)
                continue;
            for (const candidateIndex of nearLengthCandidates) {
                candidateIds.add(candidateIndex);
                if (candidateIds.size >= 200)
                    break;
            }
            if (candidateIds.size >= 200)
                break;
        }
    }
    if (candidateIds.size === 0 || candidateIds.size >= index.names.length * 0.9) {
        return null;
    }
    return [...candidateIds];
}
function findBestDrugMatch(drugName, index, cache) {
    const preparedDrugName = typeof drugName === 'string' ? prepareDrugName(drugName) : drugName;
    const { normalizedDrugName, tokenSet } = preparedDrugName;
    if (!normalizedDrugName)
        return { score: 0 };
    const cached = cache.get(normalizedDrugName);
    if (cached)
        return cached;
    if (index.exactNames.has(normalizedDrugName)) {
        const result = { score: 1 };
        setLimitedCacheEntry(cache, normalizedDrugName, result, MAX_DRUG_MATCH_CACHE_SIZE);
        return result;
    }
    let bestScore = 0;
    const candidateIndices = collectCandidateIndices(normalizedDrugName, tokenSet, index);
    if (candidateIndices) {
        for (const candidateIndex of candidateIndices) {
            const name = index.names[candidateIndex];
            if (!name)
                continue;
            const score = computeNameSimilarity(normalizedDrugName, tokenSet, name);
            if (score > bestScore) {
                bestScore = score;
                if (bestScore >= 0.98)
                    break;
            }
        }
    }
    else {
        for (const name of index.names) {
            const score = computeNameSimilarity(normalizedDrugName, tokenSet, name);
            if (score > bestScore) {
                bestScore = score;
                if (bestScore >= 0.98)
                    break;
            }
        }
    }
    const result = { score: bestScore };
    setLimitedCacheEntry(cache, normalizedDrugName, result, MAX_DRUG_MATCH_CACHE_SIZE);
    return result;
}
const parsedExpiryCache = new Map();
function toStartOfDay(date) {
    const normalized = new Date(date.getTime());
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}
function parseExpiryDate(value) {
    if (!value)
        return null;
    const raw = value.trim();
    if (!raw)
        return null;
    if (parsedExpiryCache.has(raw)) {
        return parsedExpiryCache.get(raw) ?? null;
    }
    const normalized = raw
        .replace(/[年月.\-]/g, '/')
        .replace(/日/g, '')
        .replace(/\s+/g, '');
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        setLimitedCacheEntry(parsedExpiryCache, raw, null, MAX_PARSED_EXPIRY_CACHE_SIZE);
        return null;
    }
    setLimitedCacheEntry(parsedExpiryCache, raw, parsed, MAX_PARSED_EXPIRY_CACHE_SIZE);
    return parsed;
}
function isExpiredDate(value, referenceDate = new Date()) {
    const expiry = parseExpiryDate(value);
    if (!expiry)
        return false;
    const today = toStartOfDay(referenceDate);
    const expiryDay = toStartOfDay(expiry);
    return expiryDay.getTime() < today.getTime();
}
function getNearExpiryCount(items, nearExpiryDays = exports.DEFAULT_MATCHING_SCORING_RULES.nearExpiryDays, referenceDate = new Date()) {
    const today = toStartOfDay(referenceDate);
    const thresholdDays = Math.max(1, Math.floor(nearExpiryDays));
    let count = 0;
    for (const item of items) {
        const expirySource = item.expirationDateIso ?? item.expirationDate;
        const expiry = parseExpiryDate(expirySource);
        if (!expiry)
            continue;
        const expiryDay = toStartOfDay(expiry);
        const diffDays = Math.floor((expiryDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays >= 0 && diffDays <= thresholdDays)
            count += 1;
    }
    return count;
}
function calculateCandidateScore(totalA, totalB, diff, distanceKm, itemsFromA, itemsFromB, scoringRules = exports.DEFAULT_MATCHING_SCORING_RULES, isFavorite = false, referenceDate = new Date()) {
    const valueScoreDivisor = Math.max(0.0001, scoringRules.valueScoreDivisor);
    const distanceScoreDivisor = Math.max(0.0001, scoringRules.distanceScoreDivisor);
    const nearExpiryDays = Math.max(1, Math.floor(scoringRules.nearExpiryDays));
    const minValue = Math.min(totalA, totalB);
    const valueScore = Math.min(scoringRules.valueScoreMax, minValue / valueScoreDivisor);
    const balanceScore = Math.max(0, scoringRules.balanceScoreMax - diff * scoringRules.balanceScoreDiffFactor);
    const distanceScore = distanceKm >= 9999
        ? scoringRules.distanceScoreFallback
        : Math.max(0, scoringRules.distanceScoreMax - distanceKm / distanceScoreDivisor);
    const nearExpiryScore = Math.min(scoringRules.nearExpiryScoreMax, (getNearExpiryCount(itemsFromA, nearExpiryDays, referenceDate)
        + getNearExpiryCount(itemsFromB, nearExpiryDays, referenceDate)) * scoringRules.nearExpiryItemFactor);
    const diversityScore = Math.min(scoringRules.diversityScoreMax, Math.min(itemsFromA.length, itemsFromB.length) * scoringRules.diversityItemFactor);
    const favoriteScore = isFavorite ? scoringRules.favoriteBonus : 0;
    return roundTo2(valueScore + balanceScore + distanceScore + nearExpiryScore + diversityScore + favoriteScore);
}
function calculateMatchRate(itemsA, itemsB) {
    const scores = [...itemsA, ...itemsB]
        .map((item) => item.matchScore ?? 0)
        .filter((score) => score > 0);
    if (scores.length === 0)
        return 0;
    return roundTo2((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100);
}
//# sourceMappingURL=matching-score-service.js.map