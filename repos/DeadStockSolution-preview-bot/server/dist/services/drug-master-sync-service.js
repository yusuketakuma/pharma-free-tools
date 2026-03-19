"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDrugMaster = syncDrugMaster;
exports.syncPackageData = syncPackageData;
exports.createSyncLog = createSyncLog;
exports.completeSyncLog = completeSyncLog;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const package_utils_1 = require("../utils/package-utils");
// ── 同期処理 ─────────────────────────────────────────
const BATCH_SIZE = 500;
function assertNoDuplicateYjCodes(parsedRows) {
    const seen = new Set();
    const duplicates = new Set();
    for (const row of parsedRows) {
        if (seen.has(row.yjCode)) {
            duplicates.add(row.yjCode);
            continue;
        }
        seen.add(row.yjCode);
    }
    if (duplicates.size > 0) {
        const duplicateSamples = [...duplicates].slice(0, 10);
        throw new Error(`YJコードが重複しています: ${duplicateSamples.join(', ')}`);
    }
    return parsedRows;
}
async function syncDrugMaster(parsedRows, syncLogId, revisionDate) {
    const normalizedRows = assertNoDuplicateYjCodes(parsedRows);
    const result = {
        itemsProcessed: 0,
        itemsAdded: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
    };
    await database_1.db.transaction(async (tx) => {
        const now = new Date().toISOString();
        // 全既存YJコードを取得
        const existingItems = await tx.select({
            id: schema_1.drugMaster.id,
            yjCode: schema_1.drugMaster.yjCode,
            drugName: schema_1.drugMaster.drugName,
            genericName: schema_1.drugMaster.genericName,
            specification: schema_1.drugMaster.specification,
            unit: schema_1.drugMaster.unit,
            yakkaPrice: schema_1.drugMaster.yakkaPrice,
            manufacturer: schema_1.drugMaster.manufacturer,
            category: schema_1.drugMaster.category,
            therapeuticCategory: schema_1.drugMaster.therapeuticCategory,
            isListed: schema_1.drugMaster.isListed,
            listedDate: schema_1.drugMaster.listedDate,
            transitionDeadline: schema_1.drugMaster.transitionDeadline,
            deletedDate: schema_1.drugMaster.deletedDate,
        }).from(schema_1.drugMaster);
        const existingMap = new Map(existingItems.map((item) => [item.yjCode, item]));
        const incomingCodes = new Set(normalizedRows.map((r) => r.yjCode));
        // バッチ処理: INSERT/UPDATE を蓄積して一括実行
        for (let i = 0; i < normalizedRows.length; i += BATCH_SIZE) {
            const batch = normalizedRows.slice(i, i + BATCH_SIZE);
            const toInsert = [];
            const priceHistoryToInsert = [];
            for (const row of batch) {
                const existing = existingMap.get(row.yjCode);
                result.itemsProcessed++;
                if (!existing) {
                    toInsert.push({
                        yjCode: row.yjCode,
                        drugName: row.drugName,
                        genericName: row.genericName,
                        specification: row.specification,
                        unit: row.unit,
                        yakkaPrice: String(row.yakkaPrice),
                        manufacturer: row.manufacturer,
                        category: row.category,
                        therapeuticCategory: row.therapeuticCategory,
                        isListed: true,
                        listedDate: row.listedDate,
                        transitionDeadline: row.transitionDeadline,
                        updatedAt: now,
                    });
                    priceHistoryToInsert.push({
                        yjCode: row.yjCode,
                        previousPrice: null,
                        newPrice: String(row.yakkaPrice),
                        revisionDate,
                        revisionType: 'new_listing',
                    });
                    result.itemsAdded++;
                }
                else {
                    // 既存品目の更新チェック（float精度を考慮）
                    const priceChanged = Math.abs(Number(existing.yakkaPrice) - row.yakkaPrice) > 0.001;
                    const wasDelisted = !existing.isListed;
                    const metadataChanged = existing.drugName !== row.drugName ||
                        existing.genericName !== row.genericName ||
                        existing.specification !== row.specification ||
                        existing.unit !== row.unit ||
                        existing.manufacturer !== row.manufacturer ||
                        existing.category !== row.category ||
                        existing.therapeuticCategory !== row.therapeuticCategory ||
                        existing.listedDate !== row.listedDate ||
                        existing.transitionDeadline !== row.transitionDeadline ||
                        existing.deletedDate !== null;
                    const shouldUpdate = priceChanged || wasDelisted || metadataChanged;
                    if (shouldUpdate) {
                        await tx.update(schema_1.drugMaster)
                            .set({
                            drugName: row.drugName,
                            genericName: row.genericName,
                            specification: row.specification,
                            unit: row.unit,
                            yakkaPrice: String(row.yakkaPrice),
                            manufacturer: row.manufacturer,
                            category: row.category,
                            therapeuticCategory: row.therapeuticCategory,
                            isListed: true,
                            listedDate: row.listedDate,
                            transitionDeadline: row.transitionDeadline,
                            deletedDate: null,
                            updatedAt: now,
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.drugMaster.yjCode, row.yjCode));
                        if (priceChanged) {
                            priceHistoryToInsert.push({
                                yjCode: row.yjCode,
                                previousPrice: existing.yakkaPrice,
                                newPrice: String(row.yakkaPrice),
                                revisionDate,
                                revisionType: wasDelisted ? 'new_listing' : 'price_revision',
                            });
                        }
                        result.itemsUpdated++;
                    }
                }
            }
            // バッチ INSERT 一括実行
            if (toInsert.length > 0) {
                await tx.insert(schema_1.drugMaster).values(toInsert);
            }
            if (priceHistoryToInsert.length > 0) {
                await tx.insert(schema_1.drugMasterPriceHistory).values(priceHistoryToInsert);
            }
        }
        // ファイルに含まれない既存品目を一括で経過措置 or 削除扱いにする
        const delistingCodes = [];
        const delistingPriceHistory = [];
        for (const [yjCode, existing] of existingMap) {
            if (!incomingCodes.has(yjCode) && existing.isListed) {
                delistingCodes.push(yjCode);
                delistingPriceHistory.push({
                    yjCode,
                    previousPrice: existing.yakkaPrice,
                    newPrice: null,
                    revisionDate,
                    revisionType: 'delisting',
                });
                result.itemsDeleted++;
            }
        }
        if (delistingCodes.length > 0) {
            // バッチで delisting UPDATE
            for (let i = 0; i < delistingCodes.length; i += BATCH_SIZE) {
                const codes = delistingCodes.slice(i, i + BATCH_SIZE);
                await tx.update(schema_1.drugMaster)
                    .set({ isListed: false, deletedDate: revisionDate, updatedAt: now })
                    .where((0, drizzle_orm_1.inArray)(schema_1.drugMaster.yjCode, codes));
            }
            // バッチで price history INSERT
            for (let i = 0; i < delistingPriceHistory.length; i += BATCH_SIZE) {
                const historyBatch = delistingPriceHistory.slice(i, i + BATCH_SIZE);
                await tx.insert(schema_1.drugMasterPriceHistory).values(historyBatch);
            }
        }
        await tx.update(schema_1.drugMasterSyncLogs)
            .set({
            itemsProcessed: result.itemsProcessed,
            itemsAdded: result.itemsAdded,
            itemsUpdated: result.itemsUpdated,
            itemsDeleted: result.itemsDeleted,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.drugMasterSyncLogs.id, syncLogId));
    });
    return result;
}
async function syncPackageData(parsedRows) {
    let added = 0;
    let updated = 0;
    // YJコード → drug_master.id のマップを構築（必要なコードだけフィルター）
    const yjCodes = [...new Set(parsedRows.map((r) => r.yjCode))];
    const masterItems = yjCodes.length > 0
        ? await database_1.db.select({ id: schema_1.drugMaster.id, yjCode: schema_1.drugMaster.yjCode })
            .from(schema_1.drugMaster)
            .where((0, drizzle_orm_1.inArray)(schema_1.drugMaster.yjCode, yjCodes))
        : [];
    const yjToId = new Map(masterItems.map((m) => [m.yjCode, m.id]));
    const relevantMasterIds = [...new Set(masterItems.map((m) => m.id))];
    const existingPackages = relevantMasterIds.length > 0
        ? await database_1.db.select({
            id: schema_1.drugMasterPackages.id,
            drugMasterId: schema_1.drugMasterPackages.drugMasterId,
            gs1Code: schema_1.drugMasterPackages.gs1Code,
            janCode: schema_1.drugMasterPackages.janCode,
            hotCode: schema_1.drugMasterPackages.hotCode,
            packageDescription: schema_1.drugMasterPackages.packageDescription,
            packageQuantity: schema_1.drugMasterPackages.packageQuantity,
            packageUnit: schema_1.drugMasterPackages.packageUnit,
            normalizedPackageLabel: schema_1.drugMasterPackages.normalizedPackageLabel,
            packageForm: schema_1.drugMasterPackages.packageForm,
            isLoosePackage: schema_1.drugMasterPackages.isLoosePackage,
        })
            .from(schema_1.drugMasterPackages)
            .where((0, drizzle_orm_1.inArray)(schema_1.drugMasterPackages.drugMasterId, relevantMasterIds))
        : [];
    const buckets = new Map();
    function ensureBucket(drugMasterId) {
        const existing = buckets.get(drugMasterId);
        if (existing)
            return existing;
        const created = {
            byGs1: new Map(),
            byJan: new Map(),
            byHot: new Map(),
        };
        buckets.set(drugMasterId, created);
        return created;
    }
    function addToBucket(pkg) {
        const bucket = ensureBucket(pkg.drugMasterId);
        if (pkg.gs1Code)
            bucket.byGs1.set(pkg.gs1Code, pkg);
        if (pkg.janCode)
            bucket.byJan.set(pkg.janCode, pkg);
        if (pkg.hotCode)
            bucket.byHot.set(pkg.hotCode, pkg);
    }
    function removeFromBucket(pkg) {
        const bucket = buckets.get(pkg.drugMasterId);
        if (!bucket)
            return;
        if (pkg.gs1Code)
            bucket.byGs1.delete(pkg.gs1Code);
        if (pkg.janCode)
            bucket.byJan.delete(pkg.janCode);
        if (pkg.hotCode)
            bucket.byHot.delete(pkg.hotCode);
    }
    function findExistingPackage(drugMasterId, row) {
        const bucket = buckets.get(drugMasterId);
        if (!bucket)
            return null;
        if (row.gs1Code) {
            const hit = bucket.byGs1.get(row.gs1Code);
            if (hit)
                return hit;
        }
        if (row.janCode) {
            const hit = bucket.byJan.get(row.janCode);
            if (hit)
                return hit;
        }
        if (row.hotCode) {
            const hit = bucket.byHot.get(row.hotCode);
            if (hit)
                return hit;
        }
        return null;
    }
    for (const pkg of existingPackages) {
        addToBucket(pkg);
    }
    await database_1.db.transaction(async (tx) => {
        for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
            const batch = parsedRows.slice(i, i + BATCH_SIZE);
            const toInsert = [];
            for (const row of batch) {
                const drugMasterId = yjToId.get(row.yjCode);
                if (!drugMasterId)
                    continue;
                const existingPkg = findExistingPackage(drugMasterId, row);
                if (existingPkg) {
                    const normalized = (0, package_utils_1.normalizePackageInfo)({
                        packageDescription: row.packageDescription,
                        packageQuantity: row.packageQuantity,
                        packageUnit: row.packageUnit,
                    });
                    const nextValues = {
                        gs1Code: row.gs1Code ?? existingPkg.gs1Code,
                        janCode: row.janCode ?? existingPkg.janCode,
                        hotCode: row.hotCode ?? existingPkg.hotCode,
                        packageDescription: row.packageDescription ?? existingPkg.packageDescription,
                        packageQuantity: row.packageQuantity ?? existingPkg.packageQuantity,
                        packageUnit: row.packageUnit ?? existingPkg.packageUnit,
                        normalizedPackageLabel: normalized.normalizedPackageLabel ?? existingPkg.normalizedPackageLabel,
                        packageForm: normalized.packageForm ?? existingPkg.packageForm,
                        isLoosePackage: normalized.isLoosePackage,
                        updatedAt: new Date().toISOString(),
                    };
                    await tx.update(schema_1.drugMasterPackages)
                        .set(nextValues)
                        .where((0, drizzle_orm_1.eq)(schema_1.drugMasterPackages.id, existingPkg.id));
                    removeFromBucket(existingPkg);
                    const { updatedAt: _updatedAt, ...cacheValues } = nextValues;
                    addToBucket({ ...existingPkg, ...cacheValues });
                    updated++;
                }
                else {
                    const normalized = (0, package_utils_1.normalizePackageInfo)({
                        packageDescription: row.packageDescription,
                        packageQuantity: row.packageQuantity,
                        packageUnit: row.packageUnit,
                    });
                    toInsert.push({
                        drugMasterId,
                        gs1Code: row.gs1Code,
                        janCode: row.janCode,
                        hotCode: row.hotCode,
                        packageDescription: row.packageDescription,
                        packageQuantity: row.packageQuantity,
                        packageUnit: row.packageUnit,
                        normalizedPackageLabel: normalized.normalizedPackageLabel,
                        packageForm: normalized.packageForm,
                        isLoosePackage: normalized.isLoosePackage,
                    });
                    added++;
                }
            }
            // バッチ INSERT 一括実行
            if (toInsert.length > 0) {
                const created = await tx.insert(schema_1.drugMasterPackages).values(toInsert).returning({
                    id: schema_1.drugMasterPackages.id,
                    drugMasterId: schema_1.drugMasterPackages.drugMasterId,
                    gs1Code: schema_1.drugMasterPackages.gs1Code,
                    janCode: schema_1.drugMasterPackages.janCode,
                    hotCode: schema_1.drugMasterPackages.hotCode,
                    packageDescription: schema_1.drugMasterPackages.packageDescription,
                    packageQuantity: schema_1.drugMasterPackages.packageQuantity,
                    packageUnit: schema_1.drugMasterPackages.packageUnit,
                    normalizedPackageLabel: schema_1.drugMasterPackages.normalizedPackageLabel,
                    packageForm: schema_1.drugMasterPackages.packageForm,
                    isLoosePackage: schema_1.drugMasterPackages.isLoosePackage,
                });
                for (const pkg of created) {
                    addToBucket(pkg);
                }
            }
        }
    });
    return { added, updated };
}
async function createSyncLog(syncType, sourceDescription, triggeredBy) {
    const [log] = await database_1.db.insert(schema_1.drugMasterSyncLogs).values({
        syncType,
        sourceDescription,
        status: 'running',
        triggeredBy,
        startedAt: new Date().toISOString(),
    }).returning();
    return log;
}
async function completeSyncLog(logId, status, result, errorMessage) {
    await database_1.db.update(schema_1.drugMasterSyncLogs)
        .set({
        status,
        itemsProcessed: result.itemsProcessed,
        itemsAdded: result.itemsAdded,
        itemsUpdated: result.itemsUpdated,
        itemsDeleted: result.itemsDeleted,
        errorMessage: errorMessage || null,
        completedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.drugMasterSyncLogs.id, logId));
}
//# sourceMappingURL=drug-master-sync-service.js.map