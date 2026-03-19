"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTopCandidateDigest = buildTopCandidateDigest;
exports.buildSnapshotHashInput = buildSnapshotHashInput;
exports.createCandidateHash = createCandidateHash;
exports.createSnapshotPayload = createSnapshotPayload;
exports.calculateSnapshotDiff = calculateSnapshotDiff;
exports.saveMatchSnapshotAndNotifyOnChange = saveMatchSnapshotAndNotifyOnChange;
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const matching_score_service_1 = require("./matching-score-service");
function safeNumber(value) {
    if (typeof value !== 'number' || Number.isNaN(value))
        return 0;
    return (0, matching_score_service_1.roundTo2)(value);
}
function roundTo3(value) {
    return Math.round(value * 1000) / 1000;
}
function normalizeHashItems(items) {
    return items
        .map((item) => ({
        deadStockItemId: item.deadStockItemId,
        quantity: roundTo3(Number(item.quantity)),
    }))
        .sort((a, b) => a.deadStockItemId - b.deadStockItemId || a.quantity - b.quantity);
}
function buildTopCandidateDigest(candidates, limit = 10) {
    return candidates
        .slice(0, limit)
        .map((candidate) => ({
        pharmacyId: candidate.pharmacyId,
        score: safeNumber(candidate.score),
        matchRate: safeNumber(candidate.matchRate),
        valueDifference: safeNumber(candidate.valueDifference),
        totalValueA: safeNumber(candidate.totalValueA),
        totalValueB: safeNumber(candidate.totalValueB),
        itemCountA: candidate.itemsFromA.length,
        itemCountB: candidate.itemsFromB.length,
        mutualStagnantItems: safeNumber(candidate.priorityBreakdown?.mutualStagnantItems),
        mutualNearExpiryItems: safeNumber(candidate.priorityBreakdown?.mutualNearExpiryItems),
        estimatedWasteAvoidanceYen: safeNumber(candidate.businessImpact?.estimatedWasteAvoidanceYen),
        estimatedWorkingCapitalReleaseYen: safeNumber(candidate.businessImpact?.estimatedWorkingCapitalReleaseYen),
    }));
}
function buildSnapshotHashInput(candidates, limit = 10) {
    return candidates
        .slice(0, limit)
        .map((candidate) => ({
        pharmacyId: candidate.pharmacyId,
        totalValueA: safeNumber(candidate.totalValueA),
        totalValueB: safeNumber(candidate.totalValueB),
        valueDifference: safeNumber(candidate.valueDifference),
        itemsFromA: normalizeHashItems(candidate.itemsFromA),
        itemsFromB: normalizeHashItems(candidate.itemsFromB),
    }));
}
function createCandidateHash(hashEntries) {
    const serialized = JSON.stringify(hashEntries);
    return crypto_1.default.createHash('sha256').update(serialized).digest('hex');
}
function createNotificationDedupeKey(params) {
    const { triggerPharmacyId, triggerUploadType, candidateCountAfter, diffSerialized } = params;
    const payload = `${triggerPharmacyId}:${triggerUploadType}:${candidateCountAfter}:${diffSerialized}`;
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
function createSnapshotPayload(candidates) {
    const topCandidates = buildTopCandidateDigest(candidates, 10);
    const hashEntries = buildSnapshotHashInput(candidates, 10);
    return {
        hash: createCandidateHash(hashEntries),
        candidateCount: candidates.length,
        topCandidates,
    };
}
function calculateSnapshotDiff(beforeTopCandidates, afterTopCandidates, beforeCount, afterCount) {
    const beforeIds = new Set(beforeTopCandidates.map((item) => item.pharmacyId));
    const afterIds = new Set(afterTopCandidates.map((item) => item.pharmacyId));
    const addedPharmacyIds = [...afterIds].filter((id) => !beforeIds.has(id));
    const removedPharmacyIds = [...beforeIds].filter((id) => !afterIds.has(id));
    return {
        addedPharmacyIds,
        removedPharmacyIds,
        beforeCount,
        afterCount,
    };
}
async function saveMatchSnapshotAndNotifyOnChange(params) {
    const { pharmacyId, triggerPharmacyId, triggerUploadType, candidates, notifyEnabled } = params;
    const next = createSnapshotPayload(candidates);
    const [current] = await database_1.db.select({
        id: schema_1.matchCandidateSnapshots.id,
        candidateHash: schema_1.matchCandidateSnapshots.candidateHash,
        candidateCount: schema_1.matchCandidateSnapshots.candidateCount,
        topCandidatesJson: schema_1.matchCandidateSnapshots.topCandidatesJson,
    })
        .from(schema_1.matchCandidateSnapshots)
        .where((0, drizzle_orm_1.eq)(schema_1.matchCandidateSnapshots.pharmacyId, pharmacyId))
        .limit(1);
    const beforeCount = Number(current?.candidateCount ?? 0);
    const changed = !current || current.candidateHash !== next.hash || beforeCount !== next.candidateCount;
    if (current) {
        await database_1.db.update(schema_1.matchCandidateSnapshots)
            .set({
            candidateHash: next.hash,
            candidateCount: next.candidateCount,
            topCandidatesJson: JSON.stringify(next.topCandidates),
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.matchCandidateSnapshots.id, current.id));
    }
    else {
        await database_1.db.insert(schema_1.matchCandidateSnapshots).values({
            pharmacyId,
            candidateHash: next.hash,
            candidateCount: next.candidateCount,
            topCandidatesJson: JSON.stringify(next.topCandidates),
            updatedAt: new Date().toISOString(),
        });
    }
    if (changed) {
        // 通知設定を確認: OFF なら通知レコードをスキップ
        // notifyEnabled が事前に渡されていればDBクエリをスキップ（N+1防止）
        let shouldNotify;
        if (notifyEnabled !== undefined) {
            shouldNotify = notifyEnabled;
        }
        else {
            const [pharmacy] = await database_1.db.select({ matchingAutoNotifyEnabled: schema_1.pharmacies.matchingAutoNotifyEnabled })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId))
                .limit(1);
            shouldNotify = pharmacy?.matchingAutoNotifyEnabled !== false;
        }
        if (shouldNotify) {
            const beforeTopCandidates = current?.topCandidatesJson
                ? JSON.parse(current.topCandidatesJson)
                : [];
            const diff = calculateSnapshotDiff(beforeTopCandidates, next.topCandidates, beforeCount, next.candidateCount);
            const diffSerialized = JSON.stringify(diff);
            const dedupeKey = createNotificationDedupeKey({
                triggerPharmacyId,
                triggerUploadType,
                candidateCountAfter: next.candidateCount,
                diffSerialized,
            });
            await database_1.db.insert(schema_1.matchNotifications).values({
                pharmacyId,
                triggerPharmacyId,
                triggerUploadType,
                candidateCountBefore: beforeCount,
                candidateCountAfter: next.candidateCount,
                diffJson: diffSerialized,
                dedupeKey,
                isRead: false,
            }).onConflictDoNothing({
                target: [schema_1.matchNotifications.pharmacyId, schema_1.matchNotifications.dedupeKey],
            });
        }
    }
    return {
        changed,
        beforeCount,
        afterCount: next.candidateCount,
    };
}
//# sourceMappingURL=matching-snapshot-service.js.map