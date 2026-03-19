"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichWithDrugMaster = enrichWithDrugMaster;
const database_1 = require("../config/database");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const string_utils_1 = require("../utils/string-utils");
const package_utils_1 = require("../utils/package-utils");
function normalizeDrugCode(value) {
    return value.replace(/[\s\-]/g, '').normalize('NFKC');
}
/**
 * 医薬品マスターからの自動補完処理
 * - drugCodeがある場合: YJコード/GS1コード/JANコードで検索
 * - yakkaUnitPriceが空の場合: マスターの薬価で補完
 * - unitが空の場合: マスターの単位で補完
 */
async function enrichWithDrugMaster(rows, _type) {
    // マスターが空なら何もしない
    const [masterCheck] = await database_1.db.select({ id: schema_1.drugMaster.id }).from(schema_1.drugMaster).limit(1);
    if (!masterCheck) {
        return rows.map((r) => ({ ...r, drugMasterId: null, drugMasterPackageId: null, packageLabel: null }));
    }
    // drugCodeを持つ行のコードをまとめて検索
    const codesInRows = new Set();
    for (const row of rows) {
        if (row.drugCode) {
            codesInRows.add(normalizeDrugCode(row.drugCode));
        }
    }
    // コード→マスター情報のキャッシュ構築
    const codeCache = new Map();
    const toNum = (v) => Number(v ?? 0);
    const masterById = new Map();
    const packageCandidatesByMaster = new Map();
    const loadedPackageCandidateMasterIds = new Set();
    function toPackageCandidate(pkg) {
        const normalized = (0, package_utils_1.normalizePackageInfo)({
            packageDescription: pkg.packageDescription,
            packageQuantity: pkg.packageQuantity,
            packageUnit: pkg.packageUnit,
        });
        return {
            id: pkg.id,
            drugMasterId: pkg.drugMasterId,
            packageDescription: pkg.packageDescription,
            packageQuantity: pkg.packageQuantity,
            packageUnit: pkg.packageUnit,
            normalizedPackageLabel: pkg.normalizedPackageLabel ?? normalized.normalizedPackageLabel,
            packageForm: pkg.packageForm ?? normalized.packageForm,
            isLoosePackage: pkg.isLoosePackage ?? normalized.isLoosePackage,
        };
    }
    async function loadPackageCandidatesForMasterIds(masterIds) {
        const targetMasterIds = [...new Set(masterIds)]
            .filter((id) => !loadedPackageCandidateMasterIds.has(id));
        if (targetMasterIds.length === 0)
            return;
        const rows = await database_1.db.select({
            id: schema_1.drugMasterPackages.id,
            drugMasterId: schema_1.drugMasterPackages.drugMasterId,
            packageDescription: schema_1.drugMasterPackages.packageDescription,
            packageQuantity: schema_1.drugMasterPackages.packageQuantity,
            packageUnit: schema_1.drugMasterPackages.packageUnit,
            normalizedPackageLabel: schema_1.drugMasterPackages.normalizedPackageLabel,
            packageForm: schema_1.drugMasterPackages.packageForm,
            isLoosePackage: schema_1.drugMasterPackages.isLoosePackage,
        })
            .from(schema_1.drugMasterPackages)
            .where((0, drizzle_orm_1.inArray)(schema_1.drugMasterPackages.drugMasterId, targetMasterIds));
        const grouped = new Map();
        for (const row of rows) {
            const candidate = toPackageCandidate(row);
            const list = grouped.get(candidate.drugMasterId) ?? [];
            list.push(candidate);
            grouped.set(candidate.drugMasterId, list);
        }
        for (const id of targetMasterIds) {
            packageCandidatesByMaster.set(id, grouped.get(id) ?? []);
            loadedPackageCandidateMasterIds.add(id);
        }
    }
    async function findPackageByUnit(drugMasterId, rowUnit) {
        if (!rowUnit)
            return null;
        await loadPackageCandidatesForMasterIds([drugMasterId]);
        const candidates = packageCandidatesByMaster.get(drugMasterId) ?? [];
        if (candidates.length === 0)
            return null;
        let best = null;
        let bestScore = 0;
        for (const candidate of candidates) {
            const score = (0, package_utils_1.scorePackageMatch)({
                rowUnit,
                normalizedPackageLabel: candidate.normalizedPackageLabel,
                packageDescription: candidate.packageDescription,
                isLoosePackage: candidate.isLoosePackage,
            });
            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        }
        return bestScore >= 40 ? best : null;
    }
    if (codesInRows.size > 0) {
        const normalizedCodes = [...codesInRows];
        // YJコードで直接検索（削除済も含む：デッドストックリストに削除済薬品が含まれることがある）
        const matchedMasterRows = await database_1.db.select({
            id: schema_1.drugMaster.id,
            yjCode: schema_1.drugMaster.yjCode,
            yakkaPrice: schema_1.drugMaster.yakkaPrice,
            unit: schema_1.drugMaster.unit,
        })
            .from(schema_1.drugMaster)
            .where((0, drizzle_orm_1.inArray)(schema_1.drugMaster.yjCode, normalizedCodes));
        for (const m of matchedMasterRows) {
            const master = {
                id: m.id,
                yakkaPrice: toNum(m.yakkaPrice),
                unit: m.unit,
            };
            masterById.set(m.id, master);
            codeCache.set(m.yjCode, {
                id: master.id,
                yakkaPrice: master.yakkaPrice,
                unit: master.unit,
                drugMasterPackageId: null,
                packageLabel: null,
            });
        }
        // GS1/JAN/HOTコードで包装テーブルも検索
        const unresolvedCodes = normalizedCodes.filter((code) => !codeCache.has(code));
        if (unresolvedCodes.length > 0) {
            const matchedPackages = await database_1.db.select({
                id: schema_1.drugMasterPackages.id,
                gs1Code: schema_1.drugMasterPackages.gs1Code,
                janCode: schema_1.drugMasterPackages.janCode,
                hotCode: schema_1.drugMasterPackages.hotCode,
                drugMasterId: schema_1.drugMasterPackages.drugMasterId,
                packageDescription: schema_1.drugMasterPackages.packageDescription,
                packageQuantity: schema_1.drugMasterPackages.packageQuantity,
                packageUnit: schema_1.drugMasterPackages.packageUnit,
                normalizedPackageLabel: schema_1.drugMasterPackages.normalizedPackageLabel,
                packageForm: schema_1.drugMasterPackages.packageForm,
                isLoosePackage: schema_1.drugMasterPackages.isLoosePackage,
            })
                .from(schema_1.drugMasterPackages)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.inArray)(schema_1.drugMasterPackages.gs1Code, unresolvedCodes), (0, drizzle_orm_1.inArray)(schema_1.drugMasterPackages.janCode, unresolvedCodes), (0, drizzle_orm_1.inArray)(schema_1.drugMasterPackages.hotCode, unresolvedCodes)));
            const packageByCode = new Map();
            const packageMasterIds = new Set();
            for (const pkg of matchedPackages) {
                const candidate = toPackageCandidate(pkg);
                if (pkg.gs1Code)
                    packageByCode.set(normalizeDrugCode(pkg.gs1Code), candidate);
                if (pkg.janCode)
                    packageByCode.set(normalizeDrugCode(pkg.janCode), candidate);
                if (pkg.hotCode)
                    packageByCode.set(normalizeDrugCode(pkg.hotCode), candidate);
                packageMasterIds.add(candidate.drugMasterId);
            }
            const unresolvedMasterIds = [...packageMasterIds]
                .filter((masterId) => !masterById.has(masterId));
            if (unresolvedMasterIds.length > 0) {
                const packageMasterRows = await database_1.db.select({
                    id: schema_1.drugMaster.id,
                    yakkaPrice: schema_1.drugMaster.yakkaPrice,
                    unit: schema_1.drugMaster.unit,
                })
                    .from(schema_1.drugMaster)
                    .where((0, drizzle_orm_1.inArray)(schema_1.drugMaster.id, unresolvedMasterIds));
                for (const m of packageMasterRows) {
                    masterById.set(m.id, {
                        id: m.id,
                        yakkaPrice: toNum(m.yakkaPrice),
                        unit: m.unit,
                    });
                }
            }
            for (const code of unresolvedCodes) {
                const packageCandidate = packageByCode.get(code);
                if (!packageCandidate)
                    continue;
                const master = masterById.get(packageCandidate.drugMasterId);
                if (!master)
                    continue;
                codeCache.set(code, {
                    id: master.id,
                    yakkaPrice: master.yakkaPrice,
                    unit: master.unit,
                    drugMasterPackageId: packageCandidate.id,
                    packageLabel: packageCandidate.normalizedPackageLabel ?? packageCandidate.packageDescription,
                });
            }
        }
    }
    // 名前でのファジーマッチ用マスターデータ（コードで解決できなかった行用）
    const nameCache = new Map();
    let masterByNormalizedName = null;
    async function loadNameCache() {
        if (masterByNormalizedName)
            return;
        const all = await database_1.db.select({
            id: schema_1.drugMaster.id,
            drugName: schema_1.drugMaster.drugName,
            yakkaPrice: schema_1.drugMaster.yakkaPrice,
            unit: schema_1.drugMaster.unit,
        }).from(schema_1.drugMaster);
        const byName = new Map();
        for (const m of all) {
            const normalizedName = (0, string_utils_1.normalizeString)(m.drugName);
            if (byName.has(normalizedName))
                continue;
            byName.set(normalizedName, {
                id: m.id,
                yakkaPrice: toNum(m.yakkaPrice),
                unit: m.unit,
                drugMasterPackageId: null,
                packageLabel: null,
            });
        }
        masterByNormalizedName = byName;
    }
    async function findByName(drugName) {
        if (nameCache.has(drugName)) {
            return nameCache.get(drugName) ?? null;
        }
        await loadNameCache();
        const normalized = (0, string_utils_1.normalizeString)(drugName);
        const exact = masterByNormalizedName?.get(normalized) ?? null;
        nameCache.set(drugName, exact);
        return exact;
    }
    // 各行を処理
    const results = [];
    for (const row of rows) {
        let masterInfo = null;
        // 1. コードでの検索
        if (row.drugCode) {
            const cleaned = normalizeDrugCode(row.drugCode);
            masterInfo = codeCache.get(cleaned) || null;
        }
        // 2. 名前でのマッチ（コードで見つからない場合）
        if (!masterInfo) {
            masterInfo = await findByName(row.drugName);
        }
        let packageInfo = null;
        if (masterInfo && !masterInfo.drugMasterPackageId && row.unit) {
            packageInfo = await findPackageByUnit(masterInfo.id, row.unit);
        }
        // 自動補完
        const enriched = {
            ...row,
            drugMasterId: masterInfo?.id ?? null,
            drugMasterPackageId: packageInfo?.id ?? masterInfo?.drugMasterPackageId ?? null,
            packageLabel: packageInfo?.normalizedPackageLabel
                ?? packageInfo?.packageDescription
                ?? masterInfo?.packageLabel
                ?? null,
        };
        if (masterInfo) {
            if (enriched.yakkaUnitPrice === null || enriched.yakkaUnitPrice === undefined) {
                enriched.yakkaUnitPrice = masterInfo.yakkaPrice;
                // dead_stock の場合、yakkaTotal も再計算
                if ('quantity' in enriched && 'yakkaTotal' in enriched) {
                    const ds = enriched;
                    ds.yakkaTotal = masterInfo.yakkaPrice * ds.quantity;
                }
            }
            if (!enriched.unit && masterInfo.unit) {
                enriched.unit = masterInfo.unit;
            }
        }
        results.push(enriched);
    }
    return results;
}
//# sourceMappingURL=drug-master-enrichment.js.map