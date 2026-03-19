"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateTrustScores = recalculateTrustScores;
exports.recalculateTrustScoreForPharmacy = recalculateTrustScoreForPharmacy;
exports.triggerTrustScoreRecalculation = triggerTrustScoreRecalculation;
exports.listTrustScores = listTrustScores;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const logger_1 = require("./logger");
const PRIOR_MEAN = 3;
const PRIOR_WEIGHT = 5;
let trustScoreRecalcJob = null;
function to2(value) {
    return Math.round(value * 100) / 100;
}
function toTrustScore(avgRating, ratingCount) {
    const shrinked = ((avgRating * ratingCount) + (PRIOR_MEAN * PRIOR_WEIGHT)) / (ratingCount + PRIOR_WEIGHT);
    return to2((shrinked / 5) * 100);
}
function toPositiveRate(positiveCount, ratingCount) {
    if (ratingCount <= 0)
        return 0;
    return to2((positiveCount / ratingCount) * 100);
}
async function fetchAggregatesForTargets(targetIds) {
    const query = database_1.db.select({
        toPharmacyId: schema_1.exchangeFeedback.toPharmacyId,
        avgRating: (0, drizzle_orm_1.sql) `coalesce(avg(${schema_1.exchangeFeedback.rating}), 0)`,
        ratingCount: (0, drizzle_orm_1.sql) `count(*)`,
        positiveCount: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.exchangeFeedback.rating} >= 4 then 1 else 0 end)`,
    })
        .from(schema_1.exchangeFeedback)
        .groupBy(schema_1.exchangeFeedback.toPharmacyId);
    if (!targetIds || targetIds.length === 0) {
        return query;
    }
    return query.where((0, drizzle_orm_1.inArray)(schema_1.exchangeFeedback.toPharmacyId, targetIds));
}
async function recalculateTrustScores(targetPharmacyIds) {
    const targetIds = targetPharmacyIds && targetPharmacyIds.length > 0
        ? [...new Set(targetPharmacyIds)]
        : null;
    const [activePharmacyRows, aggregateRows] = await Promise.all([
        targetIds
            ? database_1.db.select({ id: schema_1.pharmacies.id })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, targetIds))
            : database_1.db.select({ id: schema_1.pharmacies.id }).from(schema_1.pharmacies),
        fetchAggregatesForTargets(targetIds ?? undefined),
    ]);
    const aggregateMap = new Map();
    for (const row of aggregateRows) {
        aggregateMap.set(row.toPharmacyId, row);
    }
    const now = new Date().toISOString();
    for (const pharmacy of activePharmacyRows) {
        const aggregate = aggregateMap.get(pharmacy.id);
        const ratingCount = Number(aggregate?.ratingCount ?? 0);
        const avgRating = Number(aggregate?.avgRating ?? 0);
        const positiveCount = Number(aggregate?.positiveCount ?? 0);
        const trustScore = ratingCount > 0 ? toTrustScore(avgRating, ratingCount) : 60;
        const positiveRate = ratingCount > 0 ? toPositiveRate(positiveCount, ratingCount) : 0;
        await database_1.db.insert(schema_1.pharmacyTrustScores).values({
            pharmacyId: pharmacy.id,
            trustScore: String(trustScore),
            ratingCount,
            positiveRate: String(positiveRate),
            updatedAt: now,
        }).onConflictDoUpdate({
            target: [schema_1.pharmacyTrustScores.pharmacyId],
            set: {
                trustScore: String(trustScore),
                ratingCount,
                positiveRate: String(positiveRate),
                updatedAt: now,
            },
        });
    }
}
async function recalculateTrustScoreForPharmacy(pharmacyId) {
    await recalculateTrustScores([pharmacyId]);
}
function triggerTrustScoreRecalculation() {
    if (trustScoreRecalcJob) {
        return { started: false, startedAt: trustScoreRecalcJob.startedAt };
    }
    const startedAt = new Date().toISOString();
    const jobPromise = recalculateTrustScores()
        .then(() => {
        logger_1.logger.info('Trust score recalculation completed');
    })
        .catch((err) => {
        logger_1.logger.error('Trust score recalculation failed', {
            error: err instanceof Error ? err.message : String(err),
        });
    })
        .finally(() => {
        if (trustScoreRecalcJob?.promise === jobPromise) {
            trustScoreRecalcJob = null;
        }
    });
    trustScoreRecalcJob = {
        startedAt,
        promise: jobPromise,
    };
    return { started: true, startedAt };
}
async function listTrustScores(page, limit) {
    const offset = (page - 1) * limit;
    const trustScoreOrder = (0, drizzle_orm_1.sql) `coalesce(${schema_1.pharmacyTrustScores.trustScore}, 60)`;
    const ratingCountOrder = (0, drizzle_orm_1.sql) `coalesce(${schema_1.pharmacyTrustScores.ratingCount}, 0)`;
    const [rows, [totalRow]] = await Promise.all([
        database_1.db.select({
            id: schema_1.pharmacies.id,
            email: schema_1.pharmacies.email,
            name: schema_1.pharmacies.name,
            prefecture: schema_1.pharmacies.prefecture,
            phone: schema_1.pharmacies.phone,
            fax: schema_1.pharmacies.fax,
            isActive: schema_1.pharmacies.isActive,
            isAdmin: schema_1.pharmacies.isAdmin,
            isTestAccount: schema_1.pharmacies.isTestAccount,
            createdAt: schema_1.pharmacies.createdAt,
            trustScore: schema_1.pharmacyTrustScores.trustScore,
            ratingCount: schema_1.pharmacyTrustScores.ratingCount,
            positiveRate: schema_1.pharmacyTrustScores.positiveRate,
        })
            .from(schema_1.pharmacies)
            .leftJoin(schema_1.pharmacyTrustScores, (0, drizzle_orm_1.eq)(schema_1.pharmacyTrustScores.pharmacyId, schema_1.pharmacies.id))
            .orderBy((0, drizzle_orm_1.desc)(trustScoreOrder), (0, drizzle_orm_1.desc)(ratingCountOrder), (0, drizzle_orm_1.asc)(schema_1.pharmacies.id))
            .limit(limit)
            .offset(offset),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.pharmacies),
    ]);
    return {
        data: rows.map((row) => ({
            ...row,
            isActive: Boolean(row.isActive),
            isAdmin: Boolean(row.isAdmin),
            isTestAccount: Boolean(row.isTestAccount),
            trustScore: Number(row.trustScore ?? 60),
            ratingCount: Number(row.ratingCount ?? 0),
            positiveRate: Number(row.positiveRate ?? 0),
        })),
        total: Number(totalRow?.count ?? 0),
    };
}
//# sourceMappingURL=trust-score-service.js.map