export interface ParsedDrugRow {
    yjCode: string;
    drugName: string;
    genericName: string | null;
    specification: string | null;
    unit: string | null;
    yakkaPrice: number;
    manufacturer: string | null;
    category: string | null;
    therapeuticCategory: string | null;
    listedDate: string | null;
    transitionDeadline: string | null;
}
export interface ParsedPackageRow {
    yjCode: string;
    gs1Code: string | null;
    janCode: string | null;
    hotCode: string | null;
    packageDescription: string | null;
    packageQuantity: number | null;
    packageUnit: string | null;
}
export declare function parseYjCode(raw: string | null): string | null;
export declare function parseMhlwExcelData(rows: unknown[][]): ParsedDrugRow[];
/**
 * バッファから文字列に変換する（UTF-8 / Shift_JIS 自動判別）
 * MHLWのCSVはShift_JIS（CP932）の場合が多い
 */
export declare function decodeCsvBuffer(buffer: Buffer): string;
export declare function parseMhlwCsvData(csvContent: string): ParsedDrugRow[];
export declare function parsePackageCsvData(csvContent: string): ParsedPackageRow[];
export declare function parsePackageXmlData(xmlContent: string): ParsedPackageRow[];
export declare function parsePackageZipData(buffer: Buffer): Promise<ParsedPackageRow[]>;
export declare function parsePackageExcelData(rows: unknown[][]): ParsedPackageRow[];
/**
 * MHLW 薬価基準ファイル（Excel/CSV）をパースする共通エントリーポイント。
 * drug-master-scheduler と mhlw-multi-file-fetcher から使用。
 */
export declare function parseMhlwDrugFile(url: string, contentType: string | null, buffer: Buffer): Promise<ParsedDrugRow[]>;
//# sourceMappingURL=drug-master-parser-service.d.ts.map