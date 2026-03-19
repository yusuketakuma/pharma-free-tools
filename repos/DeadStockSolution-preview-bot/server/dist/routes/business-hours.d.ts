declare const router: import("express-serve-static-core").Router;
declare const SPECIAL_TYPES: readonly ["holiday_closed", "long_holiday_closed", "temporary_closed", "special_open"];
type SpecialType = typeof SPECIAL_TYPES[number];
export interface BusinessHourInput {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
    is24Hours: boolean;
}
export interface SpecialHourInput {
    specialType: SpecialType;
    startDate: string;
    endDate: string;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
    is24Hours: boolean;
    note: string | null;
}
export declare function validateBusinessHours(hours: unknown): {
    valid: BusinessHourInput[];
} | {
    error: string;
};
export declare function validateSpecialBusinessHours(specialHours: unknown): {
    valid: SpecialHourInput[];
    provided: boolean;
} | {
    error: string;
};
/**
 * 指定薬局の営業時間設定（週次 + 特例 + version）を取得する共通関数。
 * GET /settings と PUT / の 409 conflict レスポンスの両方で使用する。
 * NOTE: version は pharmacies テーブルの version を共用しており、
 * アカウント情報更新でも version がインクリメントされるため、
 * 営業時間以外の変更でも 409 が発生しうる（意図的な設計）。
 */
export declare function fetchBusinessHourSettings(pharmacyId: number): Promise<{
    hours: {
        dayOfWeek: number;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean | null;
        is24Hours: boolean | null;
    }[];
    specialHours: {
        id: number;
        specialType: "holiday_closed" | "long_holiday_closed" | "temporary_closed" | "special_open";
        startDate: string;
        endDate: string;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean;
        is24Hours: boolean;
        note: string | null;
    }[];
    version: number;
}>;
export default router;
//# sourceMappingURL=business-hours.d.ts.map