import type { BusinessHoursStatus } from '../types';
export type { BusinessHoursStatus };
interface BusinessHourEntry {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean | null;
    is24Hours?: boolean | null;
}
export interface SpecialBusinessHourEntry {
    id?: number;
    specialType?: string;
    startDate: string;
    endDate: string;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean | null;
    is24Hours?: boolean | null;
    note?: string | null;
    updatedAt?: string | null;
}
/**
 * Check if a pharmacy is currently open based on its business hours.
 * Returns open/closed status and whether it's closing soon (within 1 hour).
 *
 * - No weekly/special hours registered → assumed always open.
 * - Supports overnight spans (e.g. 22:00–06:00) where closeTime < openTime.
 */
export declare function getBusinessHoursStatus(hours: BusinessHourEntry[], specialHoursOrNow?: SpecialBusinessHourEntry[] | Date, nowArg?: Date): BusinessHoursStatus;
/**
 * Format business hours for a given day.
 */
export declare function formatDayHours(entry: BusinessHourEntry): string;
//# sourceMappingURL=business-hours-utils.d.ts.map