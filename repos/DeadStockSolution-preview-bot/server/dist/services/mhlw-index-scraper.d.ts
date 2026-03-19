/** MHLW 薬価基準の4カテゴリ */
export declare const DRUG_CATEGORIES: readonly ["内用薬", "外用薬", "注射薬", "歯科用薬剤"];
export type DrugCategory = typeof DRUG_CATEGORIES[number];
export interface DiscoveredFile {
    category: DrugCategory;
    url: string;
    label: string;
}
export interface MhlwIndexResult {
    indexUrl: string;
    files: DiscoveredFile[];
}
/**
 * 親ポータルページから最新の「薬価基準収載品目リスト」インデックスページURLを発見
 */
export declare function extractLatestIndexUrl(html: string, baseUrl: string): string | null;
/**
 * インデックスページ HTML から Excel ファイル URL とカテゴリを抽出
 */
export declare function extractExcelUrls(html: string, baseUrl: string): DiscoveredFile[];
/**
 * MHLW ポータルから最新の薬価基準 Excel URL を自動発見する
 *
 * 1. 親ポータルを GET
 * 2. 最新インデックスページリンクを抽出
 * 3. インデックスページを GET
 * 4. Excel ファイル URL 4件を抽出
 */
export declare function discoverMhlwExcelUrls(portalUrl?: string): Promise<MhlwIndexResult>;
//# sourceMappingURL=mhlw-index-scraper.d.ts.map