interface BaseRow {
    drugCode: string | null;
    drugName: string;
    unit: string | null;
    yakkaUnitPrice: number | null;
}
type EnrichedRow<T> = T & {
    drugMasterId: number | null;
    drugMasterPackageId: number | null;
    packageLabel: string | null;
};
/**
 * 医薬品マスターからの自動補完処理
 * - drugCodeがある場合: YJコード/GS1コード/JANコードで検索
 * - yakkaUnitPriceが空の場合: マスターの薬価で補完
 * - unitが空の場合: マスターの単位で補完
 */
export declare function enrichWithDrugMaster<T extends BaseRow>(rows: T[], _type: 'dead_stock' | 'used_medication'): Promise<EnrichedRow<T>[]>;
export {};
//# sourceMappingURL=drug-master-enrichment.d.ts.map