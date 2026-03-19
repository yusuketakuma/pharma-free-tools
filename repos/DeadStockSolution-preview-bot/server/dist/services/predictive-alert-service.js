"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPredictiveAlertsJob = runPredictiveAlertsJob;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const number_utils_1 = require("../utils/number-utils");
const string_utils_1 = require("../utils/string-utils");
const logger_1 = require("./logger");
const DEFAULT_NEAR_EXPIRY_DAYS = 45;
const DEFAULT_EXCESS_STOCK_MONTHS = 3;
const DEFAULT_PHARMACY_BATCH_SIZE = 200;
const DEFAULT_SIGNAL_PERSIST_CONCURRENCY = 8;
const PREDICTIVE_ALERT_NOTIFICATION_TYPE = 'proposal_status_changed';
function resolveNearExpiryDays(input) {
    if (typeof input === 'number' && Number.isInteger(input) && input >= 1 && input <= 180) {
        return input;
    }
    return (0, number_utils_1.parseBoundedInt)(process.env.PREDICTIVE_ALERT_NEAR_EXPIRY_DAYS, DEFAULT_NEAR_EXPIRY_DAYS, 1, 180);
}
function resolveExcessStockMonths(input) {
    if (typeof input === 'number' && Number.isInteger(input) && input >= 1 && input <= 12) {
        return input;
    }
    return (0, number_utils_1.parseBoundedInt)(process.env.PREDICTIVE_ALERT_EXCESS_STOCK_MONTHS, DEFAULT_EXCESS_STOCK_MONTHS, 1, 12);
}
function toDateIso(date) {
    return date.toISOString().slice(0, 10);
}
function to2(value) {
    return Math.round(value * 100) / 100;
}
function chunkArray(values, size) {
    if (values.length === 0) {
        return [];
    }
    const chunks = [];
    for (let index = 0; index < values.length; index += size) {
        chunks.push(values.slice(index, index + size));
    }
    return chunks;
}
function resolveStockMatchKey(row) {
    if (row.drugMasterPackageId)
        return `pkg:${row.drugMasterPackageId}`;
    if (row.drugMasterId)
        return `drug:${row.drugMasterId}`;
    const normalizedName = (0, string_utils_1.normalizeString)(row.drugName);
    if (!normalizedName)
        return null;
    return `name:${normalizedName}`;
}
function buildNearExpirySignal(row, nearExpiryDays) {
    return {
        pharmacyId: row.pharmacyId,
        alertType: 'near_expiry',
        title: '期限切迫在庫の予兆があります',
        message: `${row.itemCount}件の在庫が${nearExpiryDays}日以内に期限到来予定です。`,
        detail: {
            itemCount: row.itemCount,
            totalValue: to2(row.totalValue),
            nearExpiryDays,
            nearestExpiryDate: row.nearestExpiryDate,
        },
    };
}
function buildExcessStockSignal(row, excessStockMonths) {
    return {
        pharmacyId: row.pharmacyId,
        alertType: 'excess_stock',
        title: '過剰在庫の予兆があります',
        message: `${row.itemCount}件の在庫が想定使用量（${excessStockMonths}か月分）を超過しています。`,
        detail: {
            itemCount: row.itemCount,
            totalExcessValue: to2(row.totalExcessValue),
            excessStockMonths,
        },
    };
}
async function fetchNearExpiryAggregates(pharmacyIds, todayIso, expiryThresholdIso) {
    if (pharmacyIds.length === 0) {
        return [];
    }
    const rows = await database_1.db.select({
        pharmacyId: schema_1.deadStockItems.pharmacyId,
        itemCount: (0, drizzle_orm_1.sql) `count(*)::int`,
        totalValue: (0, drizzle_orm_1.sql) `coalesce(sum(coalesce(${schema_1.deadStockItems.yakkaTotal}, ${schema_1.deadStockItems.quantity} * ${schema_1.deadStockItems.yakkaUnitPrice})), 0)::float`,
        nearestExpiryDate: (0, drizzle_orm_1.sql) `min(${schema_1.deadStockItems.expirationDateIso})`,
    })
        .from(schema_1.deadStockItems)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.deadStockItems.pharmacyId, pharmacyIds), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true), (0, drizzle_orm_1.isNotNull)(schema_1.deadStockItems.expirationDateIso), (0, drizzle_orm_1.gte)(schema_1.deadStockItems.expirationDateIso, todayIso), (0, drizzle_orm_1.lte)(schema_1.deadStockItems.expirationDateIso, expiryThresholdIso)))
        .groupBy(schema_1.deadStockItems.pharmacyId);
    return rows.map((row) => ({
        pharmacyId: row.pharmacyId,
        itemCount: Number(row.itemCount ?? 0),
        totalValue: Number(row.totalValue ?? 0),
        nearestExpiryDate: row.nearestExpiryDate ?? null,
    })).filter((row) => row.itemCount > 0);
}
async function fetchExcessStockAggregates(pharmacyIds, excessStockMonths) {
    if (pharmacyIds.length === 0) {
        return [];
    }
    const [stockRows, usageRows] = await Promise.all([
        database_1.db.select({
            pharmacyId: schema_1.deadStockItems.pharmacyId,
            drugName: schema_1.deadStockItems.drugName,
            drugMasterId: schema_1.deadStockItems.drugMasterId,
            drugMasterPackageId: schema_1.deadStockItems.drugMasterPackageId,
            quantity: schema_1.deadStockItems.quantity,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
        })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.deadStockItems.pharmacyId, pharmacyIds), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true))),
        database_1.db.select({
            pharmacyId: schema_1.usedMedicationItems.pharmacyId,
            drugName: schema_1.usedMedicationItems.drugName,
            drugMasterId: schema_1.usedMedicationItems.drugMasterId,
            drugMasterPackageId: schema_1.usedMedicationItems.drugMasterPackageId,
            monthlyUsage: schema_1.usedMedicationItems.monthlyUsage,
        })
            .from(schema_1.usedMedicationItems)
            .where((0, drizzle_orm_1.inArray)(schema_1.usedMedicationItems.pharmacyId, pharmacyIds)),
    ]);
    const usageByPharmacyAndKey = new Map();
    for (const usageRow of usageRows) {
        const monthlyUsage = Number(usageRow.monthlyUsage ?? 0);
        if (!Number.isFinite(monthlyUsage) || monthlyUsage <= 0)
            continue;
        const key = resolveStockMatchKey(usageRow);
        if (!key)
            continue;
        const byKey = usageByPharmacyAndKey.get(usageRow.pharmacyId) ?? new Map();
        byKey.set(key, (byKey.get(key) ?? 0) + monthlyUsage);
        usageByPharmacyAndKey.set(usageRow.pharmacyId, byKey);
    }
    const stockByPharmacyAndKey = new Map();
    for (const stockRow of stockRows) {
        const key = resolveStockMatchKey(stockRow);
        if (!key)
            continue;
        const stockQuantity = Number(stockRow.quantity ?? 0);
        if (!Number.isFinite(stockQuantity) || stockQuantity <= 0)
            continue;
        const unitPrice = Number(stockRow.yakkaUnitPrice ?? 0);
        const stockValue = Number.isFinite(unitPrice) && unitPrice > 0 ? stockQuantity * unitPrice : 0;
        const byKey = stockByPharmacyAndKey.get(stockRow.pharmacyId) ?? new Map();
        const current = byKey.get(key) ?? { quantity: 0, totalValue: 0 };
        current.quantity += stockQuantity;
        current.totalValue += stockValue;
        byKey.set(key, current);
        stockByPharmacyAndKey.set(stockRow.pharmacyId, byKey);
    }
    const aggregates = new Map();
    for (const [pharmacyId, stockByKey] of stockByPharmacyAndKey.entries()) {
        const usageByKey = usageByPharmacyAndKey.get(pharmacyId);
        if (!usageByKey)
            continue;
        const current = aggregates.get(pharmacyId) ?? {
            pharmacyId,
            itemCount: 0,
            totalExcessValue: 0,
        };
        for (const [key, stockAggregate] of stockByKey.entries()) {
            const monthlyUsage = usageByKey.get(key);
            if (!monthlyUsage || monthlyUsage <= 0)
                continue;
            const thresholdQty = monthlyUsage * excessStockMonths;
            if (stockAggregate.quantity <= thresholdQty)
                continue;
            const excessQty = stockAggregate.quantity - thresholdQty;
            const avgUnitPrice = stockAggregate.quantity > 0
                ? stockAggregate.totalValue / stockAggregate.quantity
                : 0;
            const excessValue = avgUnitPrice > 0 ? excessQty * avgUnitPrice : 0;
            current.itemCount += 1;
            current.totalExcessValue = to2(current.totalExcessValue + excessValue);
        }
        if (current.itemCount > 0) {
            aggregates.set(pharmacyId, current);
        }
    }
    return [...aggregates.values()].filter((row) => row.itemCount > 0);
}
async function persistSignal(signal, dedupeDateKey) {
    return database_1.db.transaction(async (tx) => {
        const dedupeKey = `${signal.alertType}:${dedupeDateKey}`;
        const [insertedAlert] = await tx.insert(schema_1.predictiveAlerts)
            .values({
            pharmacyId: signal.pharmacyId,
            alertType: signal.alertType,
            title: signal.title,
            message: signal.message,
            detailJson: JSON.stringify(signal.detail),
            dedupeKey,
            detectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        })
            .onConflictDoNothing({ target: [schema_1.predictiveAlerts.pharmacyId, schema_1.predictiveAlerts.dedupeKey] })
            .returning({ id: schema_1.predictiveAlerts.id });
        if (!insertedAlert) {
            return 'duplicate';
        }
        const [notification] = await tx.insert(schema_1.notifications)
            .values({
            pharmacyId: signal.pharmacyId,
            type: PREDICTIVE_ALERT_NOTIFICATION_TYPE,
            title: signal.title,
            message: signal.message,
            referenceType: 'match',
            referenceId: null,
        })
            .returning({ id: schema_1.notifications.id });
        if (notification) {
            await tx.update(schema_1.predictiveAlerts)
                .set({ notificationId: notification.id })
                .where((0, drizzle_orm_1.eq)(schema_1.predictiveAlerts.id, insertedAlert.id));
        }
        return 'created';
    });
}
async function runPredictiveAlertsJob(options = {}) {
    const now = options.now ?? new Date();
    const nearExpiryDays = resolveNearExpiryDays(options.nearExpiryDays);
    const excessStockMonths = resolveExcessStockMonths(options.excessStockMonths);
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const expiryThreshold = new Date(todayUtc.getTime() + nearExpiryDays * 24 * 60 * 60 * 1000);
    const todayIso = toDateIso(todayUtc);
    const expiryThresholdIso = toDateIso(expiryThreshold);
    const dedupeDateKey = toDateIso(now);
    const pharmacyBatchSize = (0, number_utils_1.parseBoundedInt)(process.env.PREDICTIVE_ALERT_BATCH_SIZE, DEFAULT_PHARMACY_BATCH_SIZE, 20, 2_000);
    const signalPersistConcurrency = (0, number_utils_1.parseBoundedInt)(process.env.PREDICTIVE_ALERT_PERSIST_CONCURRENCY, DEFAULT_SIGNAL_PERSIST_CONCURRENCY, 1, 32);
    const activePharmacies = await database_1.db.select({ id: schema_1.pharmacies.id })
        .from(schema_1.pharmacies)
        .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true));
    const pharmacyIds = activePharmacies.map((row) => row.id);
    if (pharmacyIds.length === 0) {
        return {
            processedPharmacies: 0,
            generatedAlerts: 0,
            nearExpiryAlerts: 0,
            excessStockAlerts: 0,
            duplicateAlerts: 0,
            failedAlerts: 0,
            generatedAt: new Date().toISOString(),
        };
    }
    let generatedAlerts = 0;
    let duplicateAlerts = 0;
    let failedAlerts = 0;
    let nearExpiryAlerts = 0;
    let excessStockAlerts = 0;
    for (const pharmacyIdBatch of chunkArray(pharmacyIds, pharmacyBatchSize)) {
        const [nearExpiryRows, excessStockRows] = await Promise.all([
            fetchNearExpiryAggregates(pharmacyIdBatch, todayIso, expiryThresholdIso),
            fetchExcessStockAggregates(pharmacyIdBatch, excessStockMonths),
        ]);
        const signals = [
            ...nearExpiryRows.map((row) => buildNearExpirySignal(row, nearExpiryDays)),
            ...excessStockRows.map((row) => buildExcessStockSignal(row, excessStockMonths)),
        ];
        for (const signalBatch of chunkArray(signals, signalPersistConcurrency)) {
            const settled = await Promise.allSettled(signalBatch.map((signal) => persistSignal(signal, dedupeDateKey)));
            settled.forEach((result, index) => {
                const signal = signalBatch[index];
                if (result.status === 'rejected') {
                    failedAlerts += 1;
                    logger_1.logger.error('Failed to persist predictive alert signal', {
                        pharmacyId: signal.pharmacyId,
                        alertType: signal.alertType,
                        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
                    });
                    return;
                }
                if (result.value === 'duplicate') {
                    duplicateAlerts += 1;
                    return;
                }
                generatedAlerts += 1;
                if (signal.alertType === 'near_expiry') {
                    nearExpiryAlerts += 1;
                }
                else if (signal.alertType === 'excess_stock') {
                    excessStockAlerts += 1;
                }
            });
        }
    }
    return {
        processedPharmacies: pharmacyIds.length,
        generatedAlerts,
        nearExpiryAlerts,
        excessStockAlerts,
        duplicateAlerts,
        failedAlerts,
        generatedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=predictive-alert-service.js.map