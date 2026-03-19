import { MatchBusinessImpact, MatchCandidate, MatchItem, MatchPriorityBreakdown, MatchPriorityReason } from '../types';
export declare const DEFAULT_STAGNANT_STOCK_DAYS = 90;
export type DeadStockDisposalPriority = MatchPriorityBreakdown;
export declare function countStagnantItems(items: MatchItem[], now: Date, stagnantDays?: number): number;
export declare function countTraceableItems(items: MatchItem[]): number;
interface NearExpiryStats {
    countA: number;
    countB: number;
    valueSumA: number;
    valueSumB: number;
}
export declare function buildDeadStockDisposalPriority(candidate: Pick<MatchCandidate, 'itemsFromA' | 'itemsFromB' | 'totalValueA' | 'totalValueB'>, nearExpiryDays: number, now: Date, nearExpiryOut?: NearExpiryStats): DeadStockDisposalPriority;
export declare function buildBusinessImpact(candidate: Pick<MatchCandidate, 'itemsFromA' | 'itemsFromB' | 'totalValueA' | 'totalValueB'>, priority: DeadStockDisposalPriority, nearExpiryStats: NearExpiryStats): MatchBusinessImpact;
export declare function buildPriorityReasons(priority: DeadStockDisposalPriority): MatchPriorityReason[];
export declare function sortMatchCandidatesByPriority(candidates: MatchCandidate[], nearExpiryDays: number, now: Date): MatchCandidate[];
export {};
//# sourceMappingURL=matching-priority-service.d.ts.map