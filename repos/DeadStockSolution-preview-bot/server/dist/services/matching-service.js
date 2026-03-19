"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchesBatch = findMatchesBatch;
exports.findMatches = findMatches;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const business_hours_utils_1 = require("../utils/business-hours-utils");
const geo_utils_1 = require("../utils/geo-utils");
const matching_score_service_1 = require("./matching-score-service");
const matching_filter_service_1 = require("./matching-filter-service");
const matching_rule_service_1 = require("./matching-rule-service");
const matching_priority_service_1 = require("./matching-priority-service");
const RESERVATION_ACTIVE_STATUSES = ['proposed', 'accepted_a', 'accepted_b', 'confirmed'];
const MAX_COMPARISON_PHARMACIES_PER_SOURCE = resolveComparisonPharmacyLimit(process.env.MATCHING_MAX_COMPARISON_PHARMACIES_PER_SOURCE);
function resolveComparisonPharmacyLimit(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return Number.MAX_SAFE_INTEGER;
    }
    return Math.min(parsed, 1000);
}
function applyReservationsToStockRows(rows, reservedByItemId) {
    const adjusted = [];
    for (const row of rows) {
        const reservedQty = reservedByItemId.get(row.id) ?? 0;
        const availableQty = (0, matching_score_service_1.roundTo2)(Number(row.quantity) - reservedQty);
        if (!Number.isFinite(availableQty) || availableQty <= 0)
            continue;
        adjusted.push({
            ...row,
            quantity: availableQty,
        });
    }
    return adjusted;
}
async function fetchViablePharmacies(pharmacyId, firstOfMonth) {
    return database_1.db.select({
        id: schema_1.pharmacies.id,
        name: schema_1.pharmacies.name,
        phone: schema_1.pharmacies.phone,
        fax: schema_1.pharmacies.fax,
        latitude: schema_1.pharmacies.latitude,
        longitude: schema_1.pharmacies.longitude,
    })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.ne)(schema_1.pharmacies.id, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.uploads.id })
        .from(schema_1.uploads)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.uploads.uploadType, 'used_medication'), (0, drizzle_orm_1.gte)(schema_1.uploads.createdAt, firstOfMonth)))), (0, drizzle_orm_1.notExists)(database_1.db.select({ id: schema_1.pharmacyRelationships.id })
        .from(schema_1.pharmacyRelationships)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'blocked')), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'blocked'))))), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.deadStockItems.id })
        .from(schema_1.deadStockItems)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true)))), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.usedMedicationItems.id })
        .from(schema_1.usedMedicationItems)
        .where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, schema_1.pharmacies.id)))));
}
async function fetchReservationMap(allDeadStockIds) {
    const reservationRows = allDeadStockIds.length > 0
        ? await database_1.db.select({
            deadStockItemId: schema_1.deadStockReservations.deadStockItemId,
            reservedQty: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.deadStockReservations.reservedQuantity}), 0)`,
        })
            .from(schema_1.deadStockReservations)
            .innerJoin(schema_1.exchangeProposals, (0, drizzle_orm_1.eq)(schema_1.deadStockReservations.proposalId, schema_1.exchangeProposals.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.deadStockReservations.deadStockItemId, allDeadStockIds), (0, drizzle_orm_1.inArray)(schema_1.exchangeProposals.status, RESERVATION_ACTIVE_STATUSES)))
            .groupBy(schema_1.deadStockReservations.deadStockItemId)
        : [];
    const reservedByItemId = new Map();
    for (const row of reservationRows) {
        reservedByItemId.set(row.deadStockItemId, Number(row.reservedQty ?? 0));
    }
    return reservedByItemId;
}
function buildMatchItems(preparedStocks, usedMedIndex, matchCache, nameMatchThreshold) {
    const items = [];
    for (const { stock, preparedDrugName } of preparedStocks) {
        const price = Number(stock.yakkaUnitPrice);
        if (!price || price <= 0)
            continue;
        const expirySource = stock.expirationDateIso ?? stock.expirationDate;
        if ((0, matching_score_service_1.isExpiredDate)(expirySource))
            continue;
        const match = (0, matching_score_service_1.findBestDrugMatch)(preparedDrugName, usedMedIndex, matchCache);
        if (match.score < nameMatchThreshold)
            continue;
        items.push({
            deadStockItemId: stock.id,
            drugName: stock.drugName,
            quantity: stock.quantity,
            unit: stock.unit,
            yakkaUnitPrice: price,
            yakkaValue: (0, matching_score_service_1.roundTo2)(price * stock.quantity),
            expirationDate: stock.expirationDate,
            expirationDateIso: stock.expirationDateIso,
            lotNumber: stock.lotNumber,
            stockCreatedAt: stock.createdAt,
            matchScore: (0, matching_score_service_1.roundTo2)(match.score),
        });
    }
    return items;
}
function getFirstOfMonthIso(now) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
function buildBlockedPairSet(rows) {
    const blockedPairs = new Set();
    for (const row of rows) {
        blockedPairs.add(`${row.pharmacyId}:${row.targetPharmacyId}`);
    }
    return blockedPairs;
}
function isBlockedPair(blockedPairs, pharmacyAId, pharmacyBId) {
    return blockedPairs.has(`${pharmacyAId}:${pharmacyBId}`) || blockedPairs.has(`${pharmacyBId}:${pharmacyAId}`);
}
function buildUsedMedIndexByPharmacy(rowsByPharmacy) {
    const indexByPharmacy = new Map();
    for (const [pharmacyId, rows] of rowsByPharmacy.entries()) {
        if (rows.length === 0)
            continue;
        indexByPharmacy.set(pharmacyId, (0, matching_score_service_1.buildUsedMedIndex)(rows));
    }
    return indexByPharmacy;
}
function buildPreparedDeadStockByPharmacy(rowsByPharmacy) {
    const preparedByPharmacy = new Map();
    const preparedDrugNameCache = new Map();
    for (const [pharmacyId, rows] of rowsByPharmacy.entries()) {
        if (rows.length === 0)
            continue;
        const preparedRows = rows.map((stock) => {
            const cached = preparedDrugNameCache.get(stock.drugName);
            if (cached) {
                return { stock, preparedDrugName: cached };
            }
            const preparedDrugName = (0, matching_score_service_1.prepareDrugName)(stock.drugName);
            preparedDrugNameCache.set(stock.drugName, preparedDrugName);
            return { stock, preparedDrugName };
        });
        preparedByPharmacy.set(pharmacyId, preparedRows);
    }
    return preparedByPharmacy;
}
function clampPharmacyComparisonPool(sortedPharmacies, favoriteIds) {
    if (sortedPharmacies.length <= MAX_COMPARISON_PHARMACIES_PER_SOURCE) {
        return sortedPharmacies;
    }
    const selected = sortedPharmacies.slice(0, MAX_COMPARISON_PHARMACIES_PER_SOURCE);
    const selectedIds = new Set(selected.map((pharmacy) => pharmacy.id));
    for (const pharmacy of sortedPharmacies) {
        if (favoriteIds.has(pharmacy.id) && !selectedIds.has(pharmacy.id)) {
            selected.push(pharmacy);
        }
    }
    return selected;
}
async function findMatchesBatch(pharmacyIds) {
    const sourcePharmacyIds = [...new Set(pharmacyIds)];
    const matchesByPharmacy = new Map();
    if (sourcePharmacyIds.length === 0)
        return matchesByPharmacy;
    const now = new Date();
    const firstOfMonth = getFirstOfMonthIso(now);
    const matchingRuleProfile = await (0, matching_rule_service_1.getActiveMatchingRuleProfile)();
    const currentPharmacies = await database_1.db.select({
        id: schema_1.pharmacies.id,
        name: schema_1.pharmacies.name,
        latitude: schema_1.pharmacies.latitude,
        longitude: schema_1.pharmacies.longitude,
    })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, sourcePharmacyIds));
    const currentPharmacyById = new Map(currentPharmacies.map((pharmacy) => [pharmacy.id, pharmacy]));
    const existingSourcePharmacyIds = [];
    for (const pharmacyId of sourcePharmacyIds) {
        if (currentPharmacyById.has(pharmacyId)) {
            existingSourcePharmacyIds.push(pharmacyId);
        }
        else {
            matchesByPharmacy.set(pharmacyId, []);
        }
    }
    if (existingSourcePharmacyIds.length === 0)
        return matchesByPharmacy;
    const favoriteRows = await database_1.db.select({
        pharmacyId: schema_1.pharmacyRelationships.pharmacyId,
        targetPharmacyId: schema_1.pharmacyRelationships.targetPharmacyId,
    })
        .from(schema_1.pharmacyRelationships)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.pharmacyRelationships.pharmacyId, existingSourcePharmacyIds), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'favorite')));
    const favoriteIdsByPharmacy = new Map();
    for (const row of favoriteRows) {
        const favorites = favoriteIdsByPharmacy.get(row.pharmacyId) ?? new Set();
        favorites.add(row.targetPharmacyId);
        favoriteIdsByPharmacy.set(row.pharmacyId, favorites);
    }
    const viablePharmacyPool = await database_1.db.select({
        id: schema_1.pharmacies.id,
        name: schema_1.pharmacies.name,
        phone: schema_1.pharmacies.phone,
        fax: schema_1.pharmacies.fax,
        latitude: schema_1.pharmacies.latitude,
        longitude: schema_1.pharmacies.longitude,
    })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.uploads.id })
        .from(schema_1.uploads)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploads.pharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.uploads.uploadType, 'used_medication'), (0, drizzle_orm_1.gte)(schema_1.uploads.createdAt, firstOfMonth)))), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.deadStockItems.id })
        .from(schema_1.deadStockItems)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, schema_1.pharmacies.id), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true)))), (0, drizzle_orm_1.exists)(database_1.db.select({ id: schema_1.usedMedicationItems.id })
        .from(schema_1.usedMedicationItems)
        .where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, schema_1.pharmacies.id)))));
    const viablePharmacyPoolIds = viablePharmacyPool.map((pharmacy) => pharmacy.id);
    const blockedRelationshipRows = existingSourcePharmacyIds.length > 0 && viablePharmacyPoolIds.length > 0
        ? await database_1.db.select({
            pharmacyId: schema_1.pharmacyRelationships.pharmacyId,
            targetPharmacyId: schema_1.pharmacyRelationships.targetPharmacyId,
        })
            .from(schema_1.pharmacyRelationships)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'blocked'), (0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.pharmacyRelationships.pharmacyId, existingSourcePharmacyIds), (0, drizzle_orm_1.inArray)(schema_1.pharmacyRelationships.targetPharmacyId, viablePharmacyPoolIds)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.pharmacyRelationships.pharmacyId, viablePharmacyPoolIds), (0, drizzle_orm_1.inArray)(schema_1.pharmacyRelationships.targetPharmacyId, existingSourcePharmacyIds)))))
        : [];
    const blockedPairs = buildBlockedPairSet(blockedRelationshipRows);
    const allRelevantPharmacyIds = [...new Set([...existingSourcePharmacyIds, ...viablePharmacyPoolIds])];
    const [allDeadStockRows, allUsedMedRows] = await Promise.all([
        database_1.db.select({
            id: schema_1.deadStockItems.id,
            pharmacyId: schema_1.deadStockItems.pharmacyId,
            drugName: schema_1.deadStockItems.drugName,
            quantity: schema_1.deadStockItems.quantity,
            unit: schema_1.deadStockItems.unit,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
            expirationDate: schema_1.deadStockItems.expirationDate,
            expirationDateIso: schema_1.deadStockItems.expirationDateIso,
            lotNumber: schema_1.deadStockItems.lotNumber,
            createdAt: schema_1.deadStockItems.createdAt,
        })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.deadStockItems.pharmacyId, allRelevantPharmacyIds), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true)))
            .orderBy(schema_1.deadStockItems.id),
        database_1.db.select({
            pharmacyId: schema_1.usedMedicationItems.pharmacyId,
            drugName: schema_1.usedMedicationItems.drugName,
        })
            .from(schema_1.usedMedicationItems)
            .where((0, drizzle_orm_1.inArray)(schema_1.usedMedicationItems.pharmacyId, allRelevantPharmacyIds))
            .orderBy(schema_1.usedMedicationItems.id),
    ]);
    const allDeadStockIds = [...new Set(allDeadStockRows.map((row) => row.id))];
    const reservedByItemId = await fetchReservationMap(allDeadStockIds);
    const adjustedAllDeadStock = applyReservationsToStockRows(allDeadStockRows, reservedByItemId);
    const [allBusinessHours, allSpecialHours] = await Promise.all([
        database_1.db.select({
            pharmacyId: schema_1.pharmacyBusinessHours.pharmacyId,
            dayOfWeek: schema_1.pharmacyBusinessHours.dayOfWeek,
            openTime: schema_1.pharmacyBusinessHours.openTime,
            closeTime: schema_1.pharmacyBusinessHours.closeTime,
            isClosed: schema_1.pharmacyBusinessHours.isClosed,
            is24Hours: schema_1.pharmacyBusinessHours.is24Hours,
        })
            .from(schema_1.pharmacyBusinessHours)
            .where((0, drizzle_orm_1.inArray)(schema_1.pharmacyBusinessHours.pharmacyId, viablePharmacyPoolIds)),
        database_1.db.select({
            pharmacyId: schema_1.pharmacySpecialHours.pharmacyId,
            id: schema_1.pharmacySpecialHours.id,
            specialType: schema_1.pharmacySpecialHours.specialType,
            startDate: schema_1.pharmacySpecialHours.startDate,
            endDate: schema_1.pharmacySpecialHours.endDate,
            openTime: schema_1.pharmacySpecialHours.openTime,
            closeTime: schema_1.pharmacySpecialHours.closeTime,
            isClosed: schema_1.pharmacySpecialHours.isClosed,
            is24Hours: schema_1.pharmacySpecialHours.is24Hours,
            note: schema_1.pharmacySpecialHours.note,
            updatedAt: schema_1.pharmacySpecialHours.updatedAt,
        })
            .from(schema_1.pharmacySpecialHours)
            .where((0, drizzle_orm_1.inArray)(schema_1.pharmacySpecialHours.pharmacyId, viablePharmacyPoolIds)),
    ]);
    const businessHoursByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(allBusinessHours);
    const specialHoursByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(allSpecialHours);
    const deadStockByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(adjustedAllDeadStock);
    const usedMedsByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(allUsedMedRows);
    const preparedDeadStockByPharmacy = buildPreparedDeadStockByPharmacy(deadStockByPharmacy);
    const usedMedIndexByPharmacy = buildUsedMedIndexByPharmacy(usedMedsByPharmacy);
    for (const sourcePharmacyId of existingSourcePharmacyIds) {
        const currentPharmacy = currentPharmacyById.get(sourcePharmacyId);
        if (!currentPharmacy)
            throw new Error('薬局が見つかりません');
        const myPreparedDeadStock = preparedDeadStockByPharmacy.get(sourcePharmacyId) ?? [];
        const myUsedMedIndex = usedMedIndexByPharmacy.get(sourcePharmacyId);
        if (myPreparedDeadStock.length === 0 || !myUsedMedIndex) {
            matchesByPharmacy.set(sourcePharmacyId, []);
            continue;
        }
        const viablePharmacies = viablePharmacyPool.filter((pharmacy) => (pharmacy.id !== sourcePharmacyId &&
            !isBlockedPair(blockedPairs, sourcePharmacyId, pharmacy.id)));
        if (viablePharmacies.length === 0) {
            matchesByPharmacy.set(sourcePharmacyId, []);
            continue;
        }
        const favoriteIds = favoriteIdsByPharmacy.get(sourcePharmacyId) ?? new Set();
        const pharmaciesWithDistance = clampPharmacyComparisonPool(viablePharmacies
            .map((pharmacy) => ({
            ...pharmacy,
            distance: (currentPharmacy.latitude !== null &&
                currentPharmacy.longitude !== null &&
                pharmacy.latitude !== null &&
                pharmacy.longitude !== null)
                ? (0, geo_utils_1.haversineDistance)(currentPharmacy.latitude, currentPharmacy.longitude, pharmacy.latitude, pharmacy.longitude)
                : 9999,
        }))
            .sort((a, b) => a.distance - b.distance || a.id - b.id), favoriteIds);
        const candidates = [];
        for (const otherPharmacy of pharmaciesWithDistance) {
            const theirPreparedDeadStock = preparedDeadStockByPharmacy.get(otherPharmacy.id) ?? [];
            const theirUsedMedIndex = usedMedIndexByPharmacy.get(otherPharmacy.id);
            if (theirPreparedDeadStock.length === 0 || !theirUsedMedIndex)
                continue;
            const myToTheirCache = new Map();
            const theirToMyCache = new Map();
            const itemsFromA = buildMatchItems(myPreparedDeadStock, theirUsedMedIndex, myToTheirCache, matchingRuleProfile.nameMatchThreshold);
            const itemsFromB = buildMatchItems(theirPreparedDeadStock, myUsedMedIndex, theirToMyCache, matchingRuleProfile.nameMatchThreshold);
            if (itemsFromA.length === 0 || itemsFromB.length === 0)
                continue;
            const { balancedA, balancedB, totalA, totalB } = (0, matching_filter_service_1.balanceValues)(itemsFromA, itemsFromB);
            if (balancedA.length === 0 || balancedB.length === 0)
                continue;
            const minValue = Math.min(totalA, totalB);
            if (minValue < matching_filter_service_1.MIN_EXCHANGE_VALUE)
                continue;
            const diff = (0, matching_score_service_1.roundTo2)(Math.abs(totalA - totalB));
            if (diff > matching_filter_service_1.VALUE_TOLERANCE)
                continue;
            const isFavorite = favoriteIds.has(otherPharmacy.id);
            const score = (0, matching_score_service_1.calculateCandidateScore)(totalA, totalB, diff, otherPharmacy.distance, balancedA, balancedB, matchingRuleProfile, isFavorite);
            const matchRate = (0, matching_score_service_1.calculateMatchRate)(balancedA, balancedB);
            const pharmacyHours = businessHoursByPharmacy.get(otherPharmacy.id) ?? [];
            const pharmacySpecialHours = specialHoursByPharmacy.get(otherPharmacy.id) ?? [];
            const businessStatus = (0, business_hours_utils_1.getBusinessHoursStatus)(pharmacyHours, pharmacySpecialHours, now);
            candidates.push({
                pharmacyId: otherPharmacy.id,
                pharmacyName: otherPharmacy.name,
                pharmacyPhone: otherPharmacy.phone,
                pharmacyFax: otherPharmacy.fax,
                distance: (0, matching_score_service_1.roundTo2)(otherPharmacy.distance),
                itemsFromA: balancedA,
                itemsFromB: balancedB,
                totalValueA: (0, matching_score_service_1.roundTo2)(totalA),
                totalValueB: (0, matching_score_service_1.roundTo2)(totalB),
                valueDifference: diff,
                score,
                matchRate,
                businessStatus,
                isFavorite,
            });
        }
        matchesByPharmacy.set(sourcePharmacyId, (0, matching_priority_service_1.sortMatchCandidatesByPriority)(candidates, matchingRuleProfile.nearExpiryDays, now)
            .slice(0, matching_filter_service_1.MAX_CANDIDATES));
    }
    return matchesByPharmacy;
}
async function findMatches(pharmacyId) {
    const matchingRuleProfile = await (0, matching_rule_service_1.getActiveMatchingRuleProfile)();
    const [currentPharmacy] = await database_1.db.select({
        id: schema_1.pharmacies.id,
        name: schema_1.pharmacies.name,
        latitude: schema_1.pharmacies.latitude,
        longitude: schema_1.pharmacies.longitude,
    })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, pharmacyId))
        .limit(1);
    if (!currentPharmacy)
        throw new Error('薬局が見つかりません');
    const [myDeadStock, myUsedMeds] = await Promise.all([
        database_1.db.select({
            id: schema_1.deadStockItems.id,
            pharmacyId: schema_1.deadStockItems.pharmacyId,
            drugName: schema_1.deadStockItems.drugName,
            quantity: schema_1.deadStockItems.quantity,
            unit: schema_1.deadStockItems.unit,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
            expirationDate: schema_1.deadStockItems.expirationDate,
            expirationDateIso: schema_1.deadStockItems.expirationDateIso,
            lotNumber: schema_1.deadStockItems.lotNumber,
            createdAt: schema_1.deadStockItems.createdAt,
        })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true)))
            .orderBy(schema_1.deadStockItems.id),
        database_1.db.select({
            pharmacyId: schema_1.usedMedicationItems.pharmacyId,
            drugName: schema_1.usedMedicationItems.drugName,
        })
            .from(schema_1.usedMedicationItems)
            .where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, pharmacyId))
            .orderBy(schema_1.usedMedicationItems.id),
    ]);
    if (myDeadStock.length === 0 || myUsedMeds.length === 0) {
        return [];
    }
    const now = new Date();
    const firstOfMonth = getFirstOfMonthIso(now);
    const favoriteRows = await database_1.db.select({
        targetPharmacyId: schema_1.pharmacyRelationships.targetPharmacyId,
    })
        .from(schema_1.pharmacyRelationships)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, pharmacyId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'favorite')));
    const favoriteIds = new Set(favoriteRows.map((row) => row.targetPharmacyId));
    const viablePharmacies = await fetchViablePharmacies(pharmacyId, firstOfMonth);
    if (viablePharmacies.length === 0)
        return [];
    const viablePharmacyIds = viablePharmacies.map((pharmacy) => pharmacy.id);
    const [allOtherDeadStock, allOtherUsedMeds] = await Promise.all([
        database_1.db.select({
            id: schema_1.deadStockItems.id,
            pharmacyId: schema_1.deadStockItems.pharmacyId,
            drugName: schema_1.deadStockItems.drugName,
            quantity: schema_1.deadStockItems.quantity,
            unit: schema_1.deadStockItems.unit,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
            expirationDate: schema_1.deadStockItems.expirationDate,
            expirationDateIso: schema_1.deadStockItems.expirationDateIso,
            lotNumber: schema_1.deadStockItems.lotNumber,
            createdAt: schema_1.deadStockItems.createdAt,
        })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.deadStockItems.pharmacyId, viablePharmacyIds), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true)))
            .orderBy(schema_1.deadStockItems.id),
        database_1.db.select({
            pharmacyId: schema_1.usedMedicationItems.pharmacyId,
            drugName: schema_1.usedMedicationItems.drugName,
        })
            .from(schema_1.usedMedicationItems)
            .where((0, drizzle_orm_1.inArray)(schema_1.usedMedicationItems.pharmacyId, viablePharmacyIds))
            .orderBy(schema_1.usedMedicationItems.id),
    ]);
    const allDeadStockIds = [...new Set([...myDeadStock, ...allOtherDeadStock].map((row) => row.id))];
    const reservedByItemId = await fetchReservationMap(allDeadStockIds);
    const adjustedMyDeadStock = applyReservationsToStockRows(myDeadStock, reservedByItemId);
    if (adjustedMyDeadStock.length === 0) {
        return [];
    }
    const adjustedOtherDeadStock = applyReservationsToStockRows(allOtherDeadStock, reservedByItemId);
    const [allBusinessHours, allSpecialHours] = await Promise.all([
        database_1.db.select({
            pharmacyId: schema_1.pharmacyBusinessHours.pharmacyId,
            dayOfWeek: schema_1.pharmacyBusinessHours.dayOfWeek,
            openTime: schema_1.pharmacyBusinessHours.openTime,
            closeTime: schema_1.pharmacyBusinessHours.closeTime,
            isClosed: schema_1.pharmacyBusinessHours.isClosed,
            is24Hours: schema_1.pharmacyBusinessHours.is24Hours,
        })
            .from(schema_1.pharmacyBusinessHours)
            .where((0, drizzle_orm_1.inArray)(schema_1.pharmacyBusinessHours.pharmacyId, viablePharmacyIds)),
        database_1.db.select({
            pharmacyId: schema_1.pharmacySpecialHours.pharmacyId,
            id: schema_1.pharmacySpecialHours.id,
            specialType: schema_1.pharmacySpecialHours.specialType,
            startDate: schema_1.pharmacySpecialHours.startDate,
            endDate: schema_1.pharmacySpecialHours.endDate,
            openTime: schema_1.pharmacySpecialHours.openTime,
            closeTime: schema_1.pharmacySpecialHours.closeTime,
            isClosed: schema_1.pharmacySpecialHours.isClosed,
            is24Hours: schema_1.pharmacySpecialHours.is24Hours,
            note: schema_1.pharmacySpecialHours.note,
            updatedAt: schema_1.pharmacySpecialHours.updatedAt,
        })
            .from(schema_1.pharmacySpecialHours)
            .where((0, drizzle_orm_1.inArray)(schema_1.pharmacySpecialHours.pharmacyId, viablePharmacyIds)),
    ]);
    const businessHoursByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(allBusinessHours);
    const specialHoursByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(allSpecialHours);
    const deadStockByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(adjustedOtherDeadStock);
    const usedMedsByPharmacy = (0, matching_filter_service_1.groupByPharmacy)(allOtherUsedMeds);
    const allDeadStockByPharmacy = new Map(deadStockByPharmacy);
    allDeadStockByPharmacy.set(pharmacyId, adjustedMyDeadStock);
    const allUsedMedsByPharmacy = new Map(usedMedsByPharmacy);
    allUsedMedsByPharmacy.set(pharmacyId, myUsedMeds);
    const preparedDeadStockByPharmacy = buildPreparedDeadStockByPharmacy(allDeadStockByPharmacy);
    const usedMedIndexByPharmacy = buildUsedMedIndexByPharmacy(allUsedMedsByPharmacy);
    const myPreparedDeadStock = preparedDeadStockByPharmacy.get(pharmacyId) ?? [];
    const myUsedMedIndex = usedMedIndexByPharmacy.get(pharmacyId);
    if (myPreparedDeadStock.length === 0 || !myUsedMedIndex) {
        return [];
    }
    const pharmaciesWithDistance = clampPharmacyComparisonPool(viablePharmacies
        .map((pharmacy) => ({
        ...pharmacy,
        distance: (currentPharmacy.latitude !== null &&
            currentPharmacy.longitude !== null &&
            pharmacy.latitude !== null &&
            pharmacy.longitude !== null)
            ? (0, geo_utils_1.haversineDistance)(currentPharmacy.latitude, currentPharmacy.longitude, pharmacy.latitude, pharmacy.longitude)
            : 9999,
    }))
        .sort((a, b) => a.distance - b.distance || a.id - b.id), favoriteIds);
    const candidates = [];
    for (const otherPharmacy of pharmaciesWithDistance) {
        const theirPreparedDeadStock = preparedDeadStockByPharmacy.get(otherPharmacy.id) ?? [];
        const theirUsedMedIndex = usedMedIndexByPharmacy.get(otherPharmacy.id);
        if (theirPreparedDeadStock.length === 0 || !theirUsedMedIndex)
            continue;
        const myToTheirCache = new Map();
        const theirToMyCache = new Map();
        const itemsFromA = buildMatchItems(myPreparedDeadStock, theirUsedMedIndex, myToTheirCache, matchingRuleProfile.nameMatchThreshold);
        const itemsFromB = buildMatchItems(theirPreparedDeadStock, myUsedMedIndex, theirToMyCache, matchingRuleProfile.nameMatchThreshold);
        if (itemsFromA.length === 0 || itemsFromB.length === 0)
            continue;
        const { balancedA, balancedB, totalA, totalB } = (0, matching_filter_service_1.balanceValues)(itemsFromA, itemsFromB);
        if (balancedA.length === 0 || balancedB.length === 0)
            continue;
        const minValue = Math.min(totalA, totalB);
        if (minValue < matching_filter_service_1.MIN_EXCHANGE_VALUE)
            continue;
        const diff = (0, matching_score_service_1.roundTo2)(Math.abs(totalA - totalB));
        if (diff > matching_filter_service_1.VALUE_TOLERANCE)
            continue;
        const isFavorite = favoriteIds.has(otherPharmacy.id);
        const score = (0, matching_score_service_1.calculateCandidateScore)(totalA, totalB, diff, otherPharmacy.distance, balancedA, balancedB, matchingRuleProfile, isFavorite);
        const matchRate = (0, matching_score_service_1.calculateMatchRate)(balancedA, balancedB);
        const pharmacyHours = businessHoursByPharmacy.get(otherPharmacy.id) ?? [];
        const pharmacySpecialHours = specialHoursByPharmacy.get(otherPharmacy.id) ?? [];
        const businessStatus = {
            ...(0, business_hours_utils_1.getBusinessHoursStatus)(pharmacyHours, pharmacySpecialHours, now),
            isConfigured: pharmacyHours.length > 0 || pharmacySpecialHours.length > 0,
        };
        candidates.push({
            pharmacyId: otherPharmacy.id,
            pharmacyName: otherPharmacy.name,
            pharmacyPhone: otherPharmacy.phone,
            pharmacyFax: otherPharmacy.fax,
            distance: (0, matching_score_service_1.roundTo2)(otherPharmacy.distance),
            itemsFromA: balancedA,
            itemsFromB: balancedB,
            totalValueA: (0, matching_score_service_1.roundTo2)(totalA),
            totalValueB: (0, matching_score_service_1.roundTo2)(totalB),
            valueDifference: diff,
            score,
            matchRate,
            businessStatus,
            isFavorite,
        });
    }
    return (0, matching_priority_service_1.sortMatchCandidatesByPriority)(candidates, matchingRuleProfile.nearExpiryDays, now)
        .slice(0, matching_filter_service_1.MAX_CANDIDATES);
}
//# sourceMappingURL=matching-service.js.map