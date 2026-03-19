import { errorCodes, type ErrorCodeCategory, type ErrorCodeSeverity } from '../db/schema';
export declare const INITIAL_ERROR_CODES: ReadonlyArray<{
    code: string;
    category: ErrorCodeCategory;
    severity: ErrorCodeSeverity;
    titleJa: string;
    descriptionJa: string;
    resolutionJa?: string;
}>;
export interface ListErrorCodesOptions {
    category?: ErrorCodeCategory;
    severity?: ErrorCodeSeverity;
    search?: string;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
}
export interface ListErrorCodesResult {
    items: (typeof errorCodes.$inferSelect)[];
    total: number;
}
export interface CreateErrorCodeInput {
    code: string;
    category: ErrorCodeCategory;
    severity: ErrorCodeSeverity;
    titleJa: string;
    descriptionJa?: string | null;
    resolutionJa?: string | null;
}
export interface UpdateErrorCodeInput {
    category?: ErrorCodeCategory;
    severity?: ErrorCodeSeverity;
    titleJa?: string;
    descriptionJa?: string | null;
    resolutionJa?: string | null;
    isActive?: boolean;
}
/**
 * エラーコード一覧を取得する（フィルタ・ページネーション対応）
 */
export declare function listErrorCodes(options?: ListErrorCodesOptions): Promise<ListErrorCodesResult>;
/**
 * エラーコード文字列で1件取得する
 */
export declare function getErrorCodeByCode(code: string): Promise<(typeof errorCodes.$inferSelect) | null>;
/**
 * 新しいエラーコードを登録する
 */
export declare function createErrorCode(entry: CreateErrorCodeInput): Promise<(typeof errorCodes.$inferSelect) | null>;
/**
 * 既存エラーコードを更新する
 */
export declare function updateErrorCode(id: number, updates: UpdateErrorCodeInput): Promise<(typeof errorCodes.$inferSelect) | null>;
/**
 * 初期エラーコードをシードする（既存レコードはスキップ）
 */
export declare function seedInitialErrorCodes(): Promise<number>;
//# sourceMappingURL=error-code-service.d.ts.map