export interface PaginationOptions {
    defaultPage?: number;
    defaultLimit?: number;
    maxLimit?: number;
    maxPage?: number;
}
export interface ParsedPagination {
    page: number;
    limit: number;
    offset: number;
}
export declare function parsePositiveInt(value: unknown): number | null;
export declare function parsePagination(pageValue: unknown, limitValue: unknown, options?: PaginationOptions): ParsedPagination;
export declare function normalizeSearchTerm(value: unknown, maxLength?: number): string | undefined;
export declare function isPositiveSafeInteger(value: unknown): value is number;
/** Escape LIKE wildcards for safe use in SQL LIKE patterns */
export declare function escapeLikeWildcards(value: string): string;
//# sourceMappingURL=request-utils.d.ts.map