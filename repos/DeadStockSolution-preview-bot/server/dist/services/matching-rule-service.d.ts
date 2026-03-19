import { MatchingScoringRules } from './matching-score-service';
export declare class MatchingRuleValidationError extends Error {
}
export declare class MatchingRuleVersionConflictError extends Error {
}
export interface MatchingRuleProfile extends MatchingScoringRules {
    id: number;
    profileName: string;
    isActive: boolean;
    version: number;
    createdAt: string | null;
    updatedAt: string | null;
    source: 'database' | 'default_fallback';
}
export interface MatchingRuleProfileUpdateInput extends Partial<MatchingScoringRules> {
    expectedVersion?: number;
}
export declare function getActiveMatchingRuleProfile(forceRefresh?: boolean): Promise<MatchingRuleProfile>;
export declare function updateActiveMatchingRuleProfile(input: MatchingRuleProfileUpdateInput): Promise<MatchingRuleProfile>;
export declare function resetMatchingRuleProfileCacheForTest(): void;
//# sourceMappingURL=matching-rule-service.d.ts.map