"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewDeadStockDiff = previewDeadStockDiff;
exports.applyDeadStockDiff = applyDeadStockDiff;
exports.previewUsedMedicationDiff = previewUsedMedicationDiff;
exports.applyUsedMedicationDiff = applyUsedMedicationDiff;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const array_utils_1 = require("../utils/array-utils");
const upload_diff_utils_1 = require("../utils/upload-diff-utils");
const DIFF_INSERT_BATCH_SIZE = 500;
const DIFF_UPDATE_BATCH_SIZE = 250;
async function insertDeadStockInBatches(tx, rows) {
    for (let i = 0; i < rows.length; i += DIFF_INSERT_BATCH_SIZE) {
        const batch = rows.slice(i, i + DIFF_INSERT_BATCH_SIZE);
        await tx.insert(schema_1.deadStockItems).values(batch);
    }
}
async function insertUsedMedicationInBatches(tx, rows) {
    for (let i = 0; i < rows.length; i += DIFF_INSERT_BATCH_SIZE) {
        const batch = rows.slice(i, i + DIFF_INSERT_BATCH_SIZE);
        await tx.insert(schema_1.usedMedicationItems).values(batch);
    }
}
async function updateDeadStockInBatches(tx, pharmacyId, uploadId, updatedPairs) {
    const batches = (0, array_utils_1.splitIntoChunks)(updatedPairs, DIFF_UPDATE_BATCH_SIZE);
    for (const batch of batches) {
        const updateRowsSql = drizzle_orm_1.sql.join(batch.map(({ current, item }) => (0, drizzle_orm_1.sql) `(
      ${current.id},
      ${uploadId},
      ${item.drugMasterId ?? null},
      ${item.drugMasterPackageId ?? null},
      ${item.packageLabel ?? null},
      ${item.quantity},
      ${item.unit},
      ${item.yakkaUnitPrice !== null ? String(item.yakkaUnitPrice) : null},
      ${item.yakkaTotal !== null ? String(item.yakkaTotal) : null},
      ${item.expirationDate},
      ${item.normalizedDate},
      ${item.lotNumber}
    )`), (0, drizzle_orm_1.sql) `, `);
        await tx.execute((0, drizzle_orm_1.sql) `
      WITH updates (
        id,
        upload_id,
        drug_master_id,
        drug_master_package_id,
        package_label,
        quantity,
        unit,
        yakka_unit_price,
        yakka_total,
        expiration_date,
        expiration_date_iso,
        lot_number
      ) AS (
        VALUES ${updateRowsSql}
      )
      UPDATE dead_stock_items AS target
      SET
        upload_id = updates.upload_id,
        drug_master_id = updates.drug_master_id,
        drug_master_package_id = updates.drug_master_package_id,
        package_label = updates.package_label,
        quantity = updates.quantity,
        unit = updates.unit,
        yakka_unit_price = updates.yakka_unit_price,
        yakka_total = updates.yakka_total,
        expiration_date = updates.expiration_date,
        expiration_date_iso = updates.expiration_date_iso,
        lot_number = updates.lot_number,
        is_available = true
      FROM updates
      WHERE target.id = updates.id
        AND target.pharmacy_id = ${pharmacyId}
    `);
    }
}
async function updateUsedMedicationInBatches(tx, pharmacyId, uploadId, updatedPairs) {
    const batches = (0, array_utils_1.splitIntoChunks)(updatedPairs, DIFF_UPDATE_BATCH_SIZE);
    for (const batch of batches) {
        const updateRowsSql = drizzle_orm_1.sql.join(batch.map(({ current, item }) => (0, drizzle_orm_1.sql) `(
      ${current.id},
      ${uploadId},
      ${item.drugMasterId ?? null},
      ${item.drugMasterPackageId ?? null},
      ${item.packageLabel ?? null},
      ${item.monthlyUsage},
      ${item.unit},
      ${item.yakkaUnitPrice !== null ? String(item.yakkaUnitPrice) : null}
    )`), (0, drizzle_orm_1.sql) `, `);
        await tx.execute((0, drizzle_orm_1.sql) `
      WITH updates (
        id,
        upload_id,
        drug_master_id,
        drug_master_package_id,
        package_label,
        monthly_usage,
        unit,
        yakka_unit_price
      ) AS (
        VALUES ${updateRowsSql}
      )
      UPDATE used_medication_items AS target
      SET
        upload_id = updates.upload_id,
        drug_master_id = updates.drug_master_id,
        drug_master_package_id = updates.drug_master_package_id,
        package_label = updates.package_label,
        monthly_usage = updates.monthly_usage,
        unit = updates.unit,
        yakka_unit_price = updates.yakka_unit_price
      FROM updates
      WHERE target.id = updates.id
        AND target.pharmacy_id = ${pharmacyId}
    `);
    }
}
function prepareDeadStockIncoming(incoming) {
    const deduped = new Map();
    for (const item of incoming) {
        const normalizedDate = (0, upload_diff_utils_1.normalizeDate)(item.expirationDate);
        const key = (0, upload_diff_utils_1.deadStockKey)({
            drugCode: item.drugCode,
            drugName: item.drugName,
            unit: item.unit,
            expirationDate: normalizedDate,
            lotNumber: item.lotNumber,
        });
        deduped.set(key, { ...item, normalizedDate });
    }
    return [...deduped.values()];
}
function hasDeadStockRowChanged(current, item) {
    return ((current.drugMasterId ?? null) !== (item.drugMasterId ?? null) ||
        (current.drugMasterPackageId ?? null) !== (item.drugMasterPackageId ?? null) ||
        (0, upload_diff_utils_1.normalizeString)(current.packageLabel) !== (0, upload_diff_utils_1.normalizeString)(item.packageLabel) ||
        !(0, upload_diff_utils_1.equalNullableNumber)(current.quantity, (0, upload_diff_utils_1.normalizeNullableNumber)(item.quantity)) ||
        !(0, upload_diff_utils_1.equalNullableNumber)(current.yakkaUnitPrice, (0, upload_diff_utils_1.normalizeNullableNumber)(item.yakkaUnitPrice)) ||
        !(0, upload_diff_utils_1.equalNullableNumber)(current.yakkaTotal, (0, upload_diff_utils_1.normalizeNullableNumber)(item.yakkaTotal)) ||
        (0, upload_diff_utils_1.normalizeString)(current.unit) !== (0, upload_diff_utils_1.normalizeString)(item.unit) ||
        (0, upload_diff_utils_1.normalizeString)(current.lotNumber) !== (0, upload_diff_utils_1.normalizeString)(item.lotNumber) ||
        (0, upload_diff_utils_1.normalizeString)(current.expirationDateIso ?? current.expirationDate) !== (0, upload_diff_utils_1.normalizeString)(item.normalizedDate) ||
        current.isAvailable !== true);
}
function hasUsedMedicationRowChanged(current, item) {
    return ((current.drugMasterId ?? null) !== (item.drugMasterId ?? null) ||
        (current.drugMasterPackageId ?? null) !== (item.drugMasterPackageId ?? null) ||
        (0, upload_diff_utils_1.normalizeString)(current.packageLabel) !== (0, upload_diff_utils_1.normalizeString)(item.packageLabel) ||
        !(0, upload_diff_utils_1.equalNullableNumber)(current.monthlyUsage, (0, upload_diff_utils_1.normalizeNullableNumber)(item.monthlyUsage)) ||
        !(0, upload_diff_utils_1.equalNullableNumber)(current.yakkaUnitPrice, (0, upload_diff_utils_1.normalizeNullableNumber)(item.yakkaUnitPrice)));
}
async function selectDeadStockExisting(reader, pharmacyId) {
    return reader.select({
        id: schema_1.deadStockItems.id,
        drugCode: schema_1.deadStockItems.drugCode,
        drugName: schema_1.deadStockItems.drugName,
        drugMasterId: schema_1.deadStockItems.drugMasterId,
        drugMasterPackageId: schema_1.deadStockItems.drugMasterPackageId,
        packageLabel: schema_1.deadStockItems.packageLabel,
        quantity: schema_1.deadStockItems.quantity,
        unit: schema_1.deadStockItems.unit,
        yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
        yakkaTotal: schema_1.deadStockItems.yakkaTotal,
        expirationDate: schema_1.deadStockItems.expirationDate,
        expirationDateIso: schema_1.deadStockItems.expirationDateIso,
        lotNumber: schema_1.deadStockItems.lotNumber,
        isAvailable: schema_1.deadStockItems.isAvailable,
    })
        .from(schema_1.deadStockItems)
        .where((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, pharmacyId));
}
async function selectUsedMedicationExisting(reader, pharmacyId) {
    return reader.select({
        id: schema_1.usedMedicationItems.id,
        drugCode: schema_1.usedMedicationItems.drugCode,
        drugName: schema_1.usedMedicationItems.drugName,
        drugMasterId: schema_1.usedMedicationItems.drugMasterId,
        drugMasterPackageId: schema_1.usedMedicationItems.drugMasterPackageId,
        packageLabel: schema_1.usedMedicationItems.packageLabel,
        unit: schema_1.usedMedicationItems.unit,
        monthlyUsage: schema_1.usedMedicationItems.monthlyUsage,
        yakkaUnitPrice: schema_1.usedMedicationItems.yakkaUnitPrice,
    })
        .from(schema_1.usedMedicationItems)
        .where((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, pharmacyId));
}
function analyzeDeadStockDiff(existing, dedupedIncoming) {
    const existingByKey = (0, upload_diff_utils_1.buildExistingByKey)(existing, (row) => (0, upload_diff_utils_1.deadStockKey)({
        drugCode: row.drugCode,
        drugName: row.drugName,
        unit: row.unit,
        expirationDate: row.expirationDateIso ?? row.expirationDate,
        lotNumber: row.lotNumber,
    }));
    const insertedItems = [];
    const updatedPairs = [];
    let unchanged = 0;
    const seenExistingIds = new Set();
    for (const item of dedupedIncoming) {
        const key = (0, upload_diff_utils_1.deadStockKey)({
            drugCode: item.drugCode,
            drugName: item.drugName,
            unit: item.unit,
            expirationDate: item.normalizedDate,
            lotNumber: item.lotNumber,
        });
        const current = existingByKey.get(key);
        if (!current) {
            insertedItems.push(item);
            continue;
        }
        seenExistingIds.add(current.id);
        if (hasDeadStockRowChanged(current, item)) {
            updatedPairs.push({ current, item });
            continue;
        }
        unchanged += 1;
    }
    return {
        insertedItems,
        updatedPairs,
        unchanged,
        seenExistingIds,
    };
}
function collectDeadStockDeactivateIds(existing, seenExistingIds) {
    return existing
        .filter((row) => row.isAvailable && !seenExistingIds.has(row.id))
        .map((row) => row.id);
}
function analyzeUsedMedicationDiff(existing, dedupedIncoming) {
    const existingByKey = (0, upload_diff_utils_1.buildExistingByKey)(existing, (row) => (0, upload_diff_utils_1.usedMedicationKey)({
        drugCode: row.drugCode,
        drugName: row.drugName,
        unit: row.unit,
    }));
    const insertedItems = [];
    const updatedPairs = [];
    let unchanged = 0;
    const seenExistingIds = new Set();
    for (const item of dedupedIncoming) {
        const key = (0, upload_diff_utils_1.usedMedicationKey)(item);
        const current = existingByKey.get(key);
        if (!current) {
            insertedItems.push(item);
            continue;
        }
        seenExistingIds.add(current.id);
        if (hasUsedMedicationRowChanged(current, item)) {
            updatedPairs.push({ current, item });
            continue;
        }
        unchanged += 1;
    }
    return {
        insertedItems,
        updatedPairs,
        unchanged,
        seenExistingIds,
    };
}
function collectUsedMedicationDeleteIds(existing, seenExistingIds) {
    return existing
        .filter((row) => !seenExistingIds.has(row.id))
        .map((row) => row.id);
}
async function previewDeadStockDiff(pharmacyId, incoming, options) {
    const dedupedIncoming = prepareDeadStockIncoming(incoming);
    const existing = await selectDeadStockExisting(database_1.db, pharmacyId);
    const diffPlan = analyzeDeadStockDiff(existing, dedupedIncoming);
    const deactivated = options.deleteMissing
        ? collectDeadStockDeactivateIds(existing, diffPlan.seenExistingIds).length
        : 0;
    return {
        inserted: diffPlan.insertedItems.length,
        updated: diffPlan.updatedPairs.length,
        deactivated,
        unchanged: diffPlan.unchanged,
        totalIncoming: dedupedIncoming.length,
    };
}
async function applyDeadStockDiff(tx, pharmacyId, uploadId, incoming, options) {
    const dedupedIncoming = prepareDeadStockIncoming(incoming);
    const existing = await selectDeadStockExisting(tx, pharmacyId);
    const diffPlan = analyzeDeadStockDiff(existing, dedupedIncoming);
    const insertRows = diffPlan.insertedItems.map((item) => ({
        pharmacyId,
        uploadId,
        drugCode: item.drugCode,
        drugName: item.drugName,
        drugMasterId: item.drugMasterId ?? null,
        drugMasterPackageId: item.drugMasterPackageId ?? null,
        packageLabel: item.packageLabel ?? null,
        quantity: item.quantity,
        unit: item.unit,
        yakkaUnitPrice: item.yakkaUnitPrice !== null ? String(item.yakkaUnitPrice) : null,
        yakkaTotal: item.yakkaTotal !== null ? String(item.yakkaTotal) : null,
        expirationDate: item.expirationDate,
        expirationDateIso: item.normalizedDate,
        lotNumber: item.lotNumber,
        isAvailable: true,
    }));
    if (diffPlan.updatedPairs.length > 0) {
        await updateDeadStockInBatches(tx, pharmacyId, uploadId, diffPlan.updatedPairs);
    }
    if (insertRows.length > 0) {
        await insertDeadStockInBatches(tx, insertRows);
    }
    let deactivated = 0;
    if (options.deleteMissing) {
        const toDeactivateIds = collectDeadStockDeactivateIds(existing, diffPlan.seenExistingIds);
        if (toDeactivateIds.length > 0) {
            await tx.update(schema_1.deadStockItems)
                .set({ isAvailable: false })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.pharmacyId, pharmacyId), (0, drizzle_orm_1.inArray)(schema_1.deadStockItems.id, toDeactivateIds)));
            deactivated = toDeactivateIds.length;
        }
    }
    return {
        inserted: diffPlan.insertedItems.length,
        updated: diffPlan.updatedPairs.length,
        deactivated,
        unchanged: diffPlan.unchanged,
        totalIncoming: dedupedIncoming.length,
    };
}
async function previewUsedMedicationDiff(pharmacyId, incoming, options) {
    const dedupedIncoming = (0, upload_diff_utils_1.dedupeIncomingByKey)(incoming, upload_diff_utils_1.usedMedicationKey);
    const existing = await selectUsedMedicationExisting(database_1.db, pharmacyId);
    const diffPlan = analyzeUsedMedicationDiff(existing, dedupedIncoming);
    const deactivated = options.deleteMissing
        ? collectUsedMedicationDeleteIds(existing, diffPlan.seenExistingIds).length
        : 0;
    return {
        inserted: diffPlan.insertedItems.length,
        updated: diffPlan.updatedPairs.length,
        deactivated,
        unchanged: diffPlan.unchanged,
        totalIncoming: dedupedIncoming.length,
    };
}
async function applyUsedMedicationDiff(tx, pharmacyId, uploadId, incoming, options) {
    const dedupedIncoming = (0, upload_diff_utils_1.dedupeIncomingByKey)(incoming, upload_diff_utils_1.usedMedicationKey);
    const existing = await selectUsedMedicationExisting(tx, pharmacyId);
    const diffPlan = analyzeUsedMedicationDiff(existing, dedupedIncoming);
    const insertRows = diffPlan.insertedItems.map((item) => ({
        pharmacyId,
        uploadId,
        drugCode: item.drugCode,
        drugName: item.drugName,
        drugMasterId: item.drugMasterId ?? null,
        drugMasterPackageId: item.drugMasterPackageId ?? null,
        packageLabel: item.packageLabel ?? null,
        monthlyUsage: item.monthlyUsage,
        unit: item.unit,
        yakkaUnitPrice: item.yakkaUnitPrice !== null ? String(item.yakkaUnitPrice) : null,
    }));
    if (diffPlan.updatedPairs.length > 0) {
        await updateUsedMedicationInBatches(tx, pharmacyId, uploadId, diffPlan.updatedPairs);
    }
    if (insertRows.length > 0) {
        await insertUsedMedicationInBatches(tx, insertRows);
    }
    let deactivated = 0;
    if (options.deleteMissing) {
        const toDeleteIds = collectUsedMedicationDeleteIds(existing, diffPlan.seenExistingIds);
        if (toDeleteIds.length > 0) {
            await tx.delete(schema_1.usedMedicationItems)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.usedMedicationItems.pharmacyId, pharmacyId), (0, drizzle_orm_1.inArray)(schema_1.usedMedicationItems.id, toDeleteIds)));
            deactivated = toDeleteIds.length;
        }
    }
    return {
        inserted: diffPlan.insertedItems.length,
        updated: diffPlan.updatedPairs.length,
        deactivated,
        unchanged: diffPlan.unchanged,
        totalIncoming: dedupedIncoming.length,
    };
}
//# sourceMappingURL=upload-diff-service.js.map