import { MatchItem } from '../types';
export declare const MIN_EXCHANGE_VALUE = 10000;
export declare const VALUE_TOLERANCE = 10;
export declare const MAX_CANDIDATES = 30;
export interface BalancedValueResult {
    balancedA: MatchItem[];
    balancedB: MatchItem[];
    totalA: number;
    totalB: number;
}
export declare function balanceValues(itemsA: MatchItem[], itemsB: MatchItem[]): BalancedValueResult;
export declare function groupByPharmacy<T extends {
    pharmacyId: number;
}>(rows: T[]): Map<number, T[]>;
//# sourceMappingURL=matching-filter-service.d.ts.map