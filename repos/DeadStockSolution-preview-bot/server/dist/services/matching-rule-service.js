"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingRuleVersionConflictError = exports.MatchingRuleValidationError = void 0;
exports.getActiveMatchingRuleProfile = getActiveMatchingRuleProfile;
exports.updateActiveMatchingRuleProfile = updateActiveMatchingRuleProfile;
exports.resetMatchingRuleProfileCacheForTest = resetMatchingRuleProfileCacheForTest;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const matching_score_service_1 = require("./matching-score-service");
const logger_1 = require("./logger");
const ACTIVE_PROFILE_CACHE_TTL_MS = 60_000;
const DEFAULT_PROFILE_NAME = 'default';
class MatchingRuleValidationError extends Error {
}
exports.MatchingRuleValidationError = MatchingRuleValidationError;
class MatchingRuleVersionConflictError extends Error {
}
exports.MatchingRuleVersionConflictError = MatchingRuleVersionConflictError;
let cachedProfile = null;
let cacheExpiresAt = 0;
function isUndefinedTableError(err) {
    return typeof err === 'object' && err !== null && err.code === '42P01';
}
function toFiniteNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function validateRange(name, value, min, max, integer = false) {
    if (!Number.isFinite(value)) {
        throw new MatchingRuleValidationError(`${name} は数値で指定してください`);
    }
    if (integer && !Number.isInteger(value)) {
        throw new MatchingRuleValidationError(`${name} は整数で指定してください`);
    }
    if (value < min || value > max) {
        throw new MatchingRuleValidationError(`${name} は ${min} 以上 ${max} 以下で指定してください`);
    }
    return value;
}
function buildFallbackProfile() {
    return {
        id: 0,
        profileName: DEFAULT_PROFILE_NAME,
        isActive: true,
        version: 1,
        createdAt: null,
        updatedAt: null,
        source: 'default_fallback',
        ...matching_score_service_1.DEFAULT_MATCHING_SCORING_RULES,
    };
}
function normalizeRulesFromDbRow(row) {
    try {
        const nameMatchThreshold = validateRange('nameMatchThreshold', toFiniteNumber(row.nameMatchThreshold) ?? NaN, 0, 1);
        const valueScoreMax = validateRange('valueScoreMax', toFiniteNumber(row.valueScoreMax) ?? NaN, 0, 200);
        const valueScoreDivisor = validateRange('valueScoreDivisor', toFiniteNumber(row.valueScoreDivisor) ?? NaN, 0.0001, 1_000_000);
        const balanceScoreMax = validateRange('balanceScoreMax', toFiniteNumber(row.balanceScoreMax) ?? NaN, 0, 200);
        const balanceScoreDiffFactor = validateRange('balanceScoreDiffFactor', toFiniteNumber(row.balanceScoreDiffFactor) ?? NaN, 0, 1_000);
        const distanceScoreMax = validateRange('distanceScoreMax', toFiniteNumber(row.distanceScoreMax) ?? NaN, 0, 200);
        const distanceScoreDivisor = validateRange('distanceScoreDivisor', toFiniteNumber(row.distanceScoreDivisor) ?? NaN, 0.0001, 1_000_000);
        const distanceScoreFallback = validateRange('distanceScoreFallback', toFiniteNumber(row.distanceScoreFallback) ?? NaN, 0, 200);
        const nearExpiryScoreMax = validateRange('nearExpiryScoreMax', toFiniteNumber(row.nearExpiryScoreMax) ?? NaN, 0, 200);
        const nearExpiryItemFactor = validateRange('nearExpiryItemFactor', toFiniteNumber(row.nearExpiryItemFactor) ?? NaN, 0, 100);
        const nearExpiryDays = validateRange('nearExpiryDays', toFiniteNumber(row.nearExpiryDays) ?? NaN, 1, 365, true);
        const diversityScoreMax = validateRange('diversityScoreMax', toFiniteNumber(row.diversityScoreMax) ?? NaN, 0, 200);
        const diversityItemFactor = validateRange('diversityItemFactor', toFiniteNumber(row.diversityItemFactor) ?? NaN, 0, 100);
        const favoriteBonus = validateRange('favoriteBonus', toFiniteNumber(row.favoriteBonus) ?? NaN, 0, 200);
        return {
            nameMatchThreshold,
            valueScoreMax,
            valueScoreDivisor,
            balanceScoreMax,
            balanceScoreDiffFactor,
            distanceScoreMax,
            distanceScoreDivisor,
            distanceScoreFallback,
            nearExpiryScoreMax,
            nearExpiryItemFactor,
            nearExpiryDays,
            diversityScoreMax,
            diversityItemFactor,
            favoriteBonus,
        };
    }
    catch (err) {
        logger_1.logger.error('Matching rule profile row validation failed', {
            error: err instanceof Error ? err.message : String(err),
            profileId: row.id,
        });
        return null;
    }
}
function toProfile(row, rules) {
    return {
        id: row.id,
        profileName: row.profileName,
        isActive: row.isActive,
        version: row.version,
        createdAt: row.createdAt ?? null,
        updatedAt: row.updatedAt ?? null,
        source: 'database',
        ...rules,
    };
}
function storeCache(profile) {
    cachedProfile = profile;
    cacheExpiresAt = Date.now() + ACTIVE_PROFILE_CACHE_TTL_MS;
    return profile;
}
function normalizeRulesForUpdate(input) {
    const normalized = {};
    if (input.nameMatchThreshold !== undefined) {
        normalized.nameMatchThreshold = validateRange('nameMatchThreshold', input.nameMatchThreshold, 0, 1);
    }
    if (input.valueScoreMax !== undefined) {
        normalized.valueScoreMax = validateRange('valueScoreMax', input.valueScoreMax, 0, 200);
    }
    if (input.valueScoreDivisor !== undefined) {
        normalized.valueScoreDivisor = validateRange('valueScoreDivisor', input.valueScoreDivisor, 0.0001, 1_000_000);
    }
    if (input.balanceScoreMax !== undefined) {
        normalized.balanceScoreMax = validateRange('balanceScoreMax', input.balanceScoreMax, 0, 200);
    }
    if (input.balanceScoreDiffFactor !== undefined) {
        normalized.balanceScoreDiffFactor = validateRange('balanceScoreDiffFactor', input.balanceScoreDiffFactor, 0, 1_000);
    }
    if (input.distanceScoreMax !== undefined) {
        normalized.distanceScoreMax = validateRange('distanceScoreMax', input.distanceScoreMax, 0, 200);
    }
    if (input.distanceScoreDivisor !== undefined) {
        normalized.distanceScoreDivisor = validateRange('distanceScoreDivisor', input.distanceScoreDivisor, 0.0001, 1_000_000);
    }
    if (input.distanceScoreFallback !== undefined) {
        normalized.distanceScoreFallback = validateRange('distanceScoreFallback', input.distanceScoreFallback, 0, 200);
    }
    if (input.nearExpiryScoreMax !== undefined) {
        normalized.nearExpiryScoreMax = validateRange('nearExpiryScoreMax', input.nearExpiryScoreMax, 0, 200);
    }
    if (input.nearExpiryItemFactor !== undefined) {
        normalized.nearExpiryItemFactor = validateRange('nearExpiryItemFactor', input.nearExpiryItemFactor, 0, 100);
    }
    if (input.nearExpiryDays !== undefined) {
        normalized.nearExpiryDays = validateRange('nearExpiryDays', input.nearExpiryDays, 1, 365, true);
    }
    if (input.diversityScoreMax !== undefined) {
        normalized.diversityScoreMax = validateRange('diversityScoreMax', input.diversityScoreMax, 0, 200);
    }
    if (input.diversityItemFactor !== undefined) {
        normalized.diversityItemFactor = validateRange('diversityItemFactor', input.diversityItemFactor, 0, 100);
    }
    if (input.favoriteBonus !== undefined) {
        normalized.favoriteBonus = validateRange('favoriteBonus', input.favoriteBonus, 0, 200);
    }
    return normalized;
}
function hasAnyRuleField(input) {
    return [
        input.nameMatchThreshold,
        input.valueScoreMax,
        input.valueScoreDivisor,
        input.balanceScoreMax,
        input.balanceScoreDiffFactor,
        input.distanceScoreMax,
        input.distanceScoreDivisor,
        input.distanceScoreFallback,
        input.nearExpiryScoreMax,
        input.nearExpiryItemFactor,
        input.nearExpiryDays,
        input.diversityScoreMax,
        input.diversityItemFactor,
        input.favoriteBonus,
    ].some((value) => value !== undefined);
}
async function ensureActiveProfileRow() {
    const [currentActive] = await database_1.db.select()
        .from(schema_1.matchingRuleProfiles)
        .where((0, drizzle_orm_1.eq)(schema_1.matchingRuleProfiles.isActive, true))
        .limit(1);
    if (currentActive) {
        return currentActive;
    }
    await database_1.db.insert(schema_1.matchingRuleProfiles)
        .values({
        profileName: DEFAULT_PROFILE_NAME,
        isActive: true,
        ...matching_score_service_1.DEFAULT_MATCHING_SCORING_RULES,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })
        .onConflictDoNothing({ target: schema_1.matchingRuleProfiles.profileName });
    const [activeAfterInsert] = await database_1.db.select()
        .from(schema_1.matchingRuleProfiles)
        .where((0, drizzle_orm_1.eq)(schema_1.matchingRuleProfiles.isActive, true))
        .limit(1);
    if (activeAfterInsert) {
        return activeAfterInsert;
    }
    const [firstRow] = await database_1.db.select()
        .from(schema_1.matchingRuleProfiles)
        .orderBy((0, drizzle_orm_1.asc)(schema_1.matchingRuleProfiles.id))
        .limit(1);
    if (!firstRow) {
        return null;
    }
    const [updatedFirst] = await database_1.db.update(schema_1.matchingRuleProfiles)
        .set({
        isActive: true,
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.matchingRuleProfiles.id, firstRow.id))
        .returning();
    return updatedFirst ?? firstRow;
}
async function getActiveMatchingRuleProfile(forceRefresh = false) {
    if (!forceRefresh && cachedProfile && cacheExpiresAt > Date.now()) {
        return cachedProfile;
    }
    try {
        const row = await ensureActiveProfileRow();
        if (!row) {
            logger_1.logger.warn('No matching rule profile row found, using fallback defaults');
            return storeCache(buildFallbackProfile());
        }
        const rules = normalizeRulesFromDbRow(row);
        if (!rules) {
            return storeCache(buildFallbackProfile());
        }
        return storeCache(toProfile(row, rules));
    }
    catch (err) {
        if (!isUndefinedTableError(err)) {
            logger_1.logger.error('Failed to load matching rule profile', {
                error: err instanceof Error ? err.message : String(err),
            });
        }
        else {
            logger_1.logger.warn('matching_rule_profiles table is missing; using fallback defaults');
        }
        return storeCache(buildFallbackProfile());
    }
}
async function updateActiveMatchingRuleProfile(input) {
    if (!hasAnyRuleField(input)) {
        throw new MatchingRuleValidationError('更新対象のスコア設定が指定されていません');
    }
    if (input.expectedVersion !== undefined) {
        validateRange('expectedVersion', input.expectedVersion, 1, 1_000_000, true);
    }
    const normalizedPatch = normalizeRulesForUpdate(input);
    try {
        const updated = await database_1.db.transaction(async (tx) => {
            const [currentActive] = await tx.select()
                .from(schema_1.matchingRuleProfiles)
                .where((0, drizzle_orm_1.eq)(schema_1.matchingRuleProfiles.isActive, true))
                .limit(1);
            let current = currentActive;
            if (!current) {
                await tx.insert(schema_1.matchingRuleProfiles)
                    .values({
                    profileName: DEFAULT_PROFILE_NAME,
                    isActive: true,
                    ...matching_score_service_1.DEFAULT_MATCHING_SCORING_RULES,
                    version: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
                    .onConflictDoNothing({ target: schema_1.matchingRuleProfiles.profileName });
                const [activeAfterInsert] = await tx.select()
                    .from(schema_1.matchingRuleProfiles)
                    .where((0, drizzle_orm_1.eq)(schema_1.matchingRuleProfiles.isActive, true))
                    .limit(1);
                current = activeAfterInsert;
            }
            if (!current) {
                throw new MatchingRuleValidationError('有効なマッチングルールプロファイルが存在しません');
            }
            if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
                throw new MatchingRuleVersionConflictError('マッチングルールが更新済みです。再取得してから再実行してください');
            }
            const [updatedRow] = await tx.update(schema_1.matchingRuleProfiles)
                .set({
                ...normalizedPatch,
                version: current.version + 1,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.matchingRuleProfiles.id, current.id), (0, drizzle_orm_1.eq)(schema_1.matchingRuleProfiles.version, current.version)))
                .returning();
            if (!updatedRow) {
                throw new MatchingRuleVersionConflictError('マッチングルールが更新済みです。再取得してから再実行してください');
            }
            return updatedRow;
        });
        const normalizedRules = normalizeRulesFromDbRow(updated);
        if (!normalizedRules) {
            throw new Error('更新後のマッチングルールが不正です');
        }
        return storeCache(toProfile(updated, normalizedRules));
    }
    catch (err) {
        if (err instanceof MatchingRuleValidationError || err instanceof MatchingRuleVersionConflictError) {
            throw err;
        }
        logger_1.logger.error('Failed to update matching rule profile', {
            error: err instanceof Error ? err.message : String(err),
        });
        throw new Error('マッチングルールの更新に失敗しました');
    }
}
function resetMatchingRuleProfileCacheForTest() {
    cachedProfile = null;
    cacheExpiresAt = 0;
}
//# sourceMappingURL=matching-rule-service.js.map