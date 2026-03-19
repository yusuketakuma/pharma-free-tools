"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDrugMaster = searchDrugMaster;
exports.lookupByCode = lookupByCode;
exports.getDrugMasterStats = getDrugMasterStats;
exports.getDrugDetail = getDrugDetail;
exports.getSyncLogs = getSyncLogs;
exports.updateDrugMasterItem = updateDrugMasterItem;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const kana_utils_1 = require("../utils/kana-utils");
const package_utils_1 = require("../utils/package-utils");
// ── 検索・照会 ──────────────────────────────────────
/** LIKE パターン中の % と _ をエスケープする */
function escapeLikePattern(term) {
    return term.replace(/%/g, '\\%').replace(/_/g, '\\_');
}
async function searchDrugMaster(query, limit = 20) {
    if (!query.trim())
        return [];
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const normalized = (0, kana_utils_1.normalizeKana)(query);
    const hiragana = (0, kana_utils_1.katakanaToHiragana)(normalized);
    const katakana = (0, kana_utils_1.hiraganaToKatakana)(normalized);
    const likeTerms = new Set([normalized, hiragana, katakana]);
    const nameConditions = [...likeTerms].map((term) => (0, drizzle_orm_1.like)(schema_1.drugMaster.drugName, `%${escapeLikePattern(term)}%`));
    const genericConditions = [...likeTerms].map((term) => (0, drizzle_orm_1.like)(schema_1.drugMaster.genericName, `%${escapeLikePattern(term)}%`));
    // YJコード直接検索も対応
    const isCodeSearch = /^[A-Z0-9]+$/i.test(query.trim());
    const codeCondition = isCodeSearch ? (0, drizzle_orm_1.like)(schema_1.drugMaster.yjCode, `%${escapeLikePattern(query.trim())}%`) : null;
    const allConditions = [...nameConditions, ...genericConditions];
    if (codeCondition)
        allConditions.push(codeCondition);
    return database_1.db.select({
        id: schema_1.drugMaster.id,
        yjCode: schema_1.drugMaster.yjCode,
        drugName: schema_1.drugMaster.drugName,
        genericName: schema_1.drugMaster.genericName,
        specification: schema_1.drugMaster.specification,
        unit: schema_1.drugMaster.unit,
        yakkaPrice: schema_1.drugMaster.yakkaPrice,
        manufacturer: schema_1.drugMaster.manufacturer,
        category: schema_1.drugMaster.category,
        isListed: schema_1.drugMaster.isListed,
        transitionDeadline: schema_1.drugMaster.transitionDeadline,
    })
        .from(schema_1.drugMaster)
        .where((0, drizzle_orm_1.or)(...allConditions))
        .limit(safeLimit);
}
async function lookupByCode(code) {
    const cleaned = code.replace(/[\s\-]/g, '').normalize('NFKC');
    // YJコード（12桁）直接検索
    const byYj = await database_1.db.select()
        .from(schema_1.drugMaster)
        .where((0, drizzle_orm_1.eq)(schema_1.drugMaster.yjCode, cleaned))
        .limit(1);
    if (byYj[0])
        return byYj[0];
    // GS1/JAN/HOTコードで包装テーブルを検索
    const pkgResult = await database_1.db.select({
        drugMasterId: schema_1.drugMasterPackages.drugMasterId,
    })
        .from(schema_1.drugMasterPackages)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.drugMasterPackages.gs1Code, cleaned), (0, drizzle_orm_1.eq)(schema_1.drugMasterPackages.janCode, cleaned), (0, drizzle_orm_1.eq)(schema_1.drugMasterPackages.hotCode, cleaned)))
        .limit(1);
    if (pkgResult[0]) {
        const master = await database_1.db.select()
            .from(schema_1.drugMaster)
            .where((0, drizzle_orm_1.eq)(schema_1.drugMaster.id, pkgResult[0].drugMasterId))
            .limit(1);
        return master[0] || null;
    }
    return null;
}
async function getDrugMasterStats() {
    const [totalResult] = await database_1.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema_1.drugMaster);
    const [listedResult] = await database_1.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema_1.drugMaster).where((0, drizzle_orm_1.eq)(schema_1.drugMaster.isListed, true));
    const [transitionResult] = await database_1.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema_1.drugMaster)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drugMaster.isListed, true), (0, drizzle_orm_1.sql) `${schema_1.drugMaster.transitionDeadline} IS NOT NULL`));
    const [delistedResult] = await database_1.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema_1.drugMaster).where((0, drizzle_orm_1.eq)(schema_1.drugMaster.isListed, false));
    const [lastSync] = await database_1.db.select({ startedAt: schema_1.drugMasterSyncLogs.startedAt })
        .from(schema_1.drugMasterSyncLogs)
        .where((0, drizzle_orm_1.eq)(schema_1.drugMasterSyncLogs.status, 'success'))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.drugMasterSyncLogs.startedAt))
        .limit(1);
    return {
        totalItems: totalResult.value,
        listedItems: listedResult.value,
        transitionItems: transitionResult.value,
        delistedItems: delistedResult.value,
        lastSyncAt: lastSync?.startedAt || null,
    };
}
async function getDrugDetail(yjCode) {
    const [drug] = await database_1.db.select().from(schema_1.drugMaster).where((0, drizzle_orm_1.eq)(schema_1.drugMaster.yjCode, yjCode));
    if (!drug)
        return null;
    const packageRows = await database_1.db.select().from(schema_1.drugMasterPackages)
        .where((0, drizzle_orm_1.eq)(schema_1.drugMasterPackages.drugMasterId, drug.id));
    const packages = packageRows.map((pkg) => {
        const normalized = (0, package_utils_1.normalizePackageInfo)({
            packageDescription: pkg.packageDescription,
            packageQuantity: pkg.packageQuantity,
            packageUnit: pkg.packageUnit,
        });
        return {
            ...pkg,
            normalizedPackageLabel: pkg.normalizedPackageLabel ?? normalized.normalizedPackageLabel,
            packageForm: pkg.packageForm ?? normalized.packageForm,
            isLoosePackage: pkg.isLoosePackage ?? normalized.isLoosePackage,
        };
    });
    const priceHistory = await database_1.db.select().from(schema_1.drugMasterPriceHistory)
        .where((0, drizzle_orm_1.eq)(schema_1.drugMasterPriceHistory.yjCode, yjCode))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.drugMasterPriceHistory.revisionDate));
    return { ...drug, packages, priceHistory };
}
async function getSyncLogs(limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return database_1.db.select()
        .from(schema_1.drugMasterSyncLogs)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.drugMasterSyncLogs.startedAt))
        .limit(safeLimit);
}
async function updateDrugMasterItem(yjCode, updates) {
    const { yakkaPrice, ...rest } = updates;
    const setValues = { ...rest, updatedAt: new Date().toISOString() };
    if (yakkaPrice !== undefined) {
        setValues.yakkaPrice = String(yakkaPrice);
    }
    const [updated] = await database_1.db.update(schema_1.drugMaster)
        .set(setValues)
        .where((0, drizzle_orm_1.eq)(schema_1.drugMaster.yjCode, yjCode))
        .returning();
    return updated || null;
}
//# sourceMappingURL=drug-master-lookup-service.js.map