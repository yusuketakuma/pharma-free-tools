import { MatchItem } from '../types';
export interface MatchingScoringRules {
    nameMatchThreshold: number;
    valueScoreMax: number;
    valueScoreDivisor: number;
    balanceScoreMax: number;
    balanceScoreDiffFactor: number;
    distanceScoreMax: number;
    distanceScoreDivisor: number;
    distanceScoreFallback: number;
    nearExpiryScoreMax: number;
    nearExpiryItemFactor: number;
    nearExpiryDays: number;
    diversityScoreMax: number;
    diversityItemFactor: number;
    favoriteBonus: number;
}
export declare const DEFAULT_MATCHING_SCORING_RULES: MatchingScoringRules;
export interface UsedMedRow {
    pharmacyId: number;
    drugName: string;
}
export interface UsedMedName {
    normalizedName: string;
    tokenSet: Set<string>;
    length: number;
}
export interface UsedMedIndex {
    exactNames: Set<string>;
    names: UsedMedName[];
    tokenIndex: Map<string, number[]>;
    lengthBuckets: Map<number, number[]>;
}
export interface DrugMatchResult {
    score: number;
}
export interface PreparedDrugName {
    normalizedDrugName: string;
    tokenSet: Set<string>;
}
export declare function setLimitedCacheEntry<T>(cache: Map<string, T>, key: string, value: T, maxSize: number): void;
export declare function roundTo2(value: number): number;
export declare function prepareDrugName(name: string): PreparedDrugName;
export declare function buildUsedMedIndex(rows: UsedMedRow[]): UsedMedIndex;
export declare function findBestDrugMatch(drugName: string | PreparedDrugName, index: UsedMedIndex, cache: Map<string, DrugMatchResult>): DrugMatchResult;
export declare function toStartOfDay(date: Date): Date;
export declare function parseExpiryDate(value: string | null | undefined): Date | null;
export declare function isExpiredDate(value: string | null | undefined, referenceDate?: Date): boolean;
export declare function getNearExpiryCount(items: MatchItem[], nearExpiryDays?: number, referenceDate?: Date): number;
export declare function calculateCandidateScore(totalA: number, totalB: number, diff: number, distanceKm: number, itemsFromA: MatchItem[], itemsFromB: MatchItem[], scoringRules?: MatchingScoringRules, isFavorite?: boolean, referenceDate?: Date): number;
export declare function calculateMatchRate(itemsA: MatchItem[], itemsB: MatchItem[]): number;
//# sourceMappingURL=matching-score-service.d.ts.map