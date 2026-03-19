export type VerificationStatus = 'pending_verification' | 'verified' | 'rejected';
export declare const PHARMACY_VERIFICATION_REQUEST_TYPE = "pharmacy_verification";
export declare const PHARMACY_REVERIFICATION_REQUEST_TYPE = "pharmacy_reverification";
export type PharmacyVerificationRequestType = typeof PHARMACY_VERIFICATION_REQUEST_TYPE | typeof PHARMACY_REVERIFICATION_REQUEST_TYPE;
export declare function isVerificationRequestType(value: unknown): value is PharmacyVerificationRequestType;
declare const REVERIFICATION_FIELD_LIST: readonly ["email", "name", "postalCode", "address", "phone", "fax", "licenseNumber", "prefecture"];
export type ReverificationField = typeof REVERIFICATION_FIELD_LIST[number];
export declare function isVerified(status: VerificationStatus): boolean;
export declare function isPendingVerification(status: VerificationStatus): boolean;
export declare function canLogin(_status: VerificationStatus, isActive: boolean): boolean;
export declare function detectChangedReverificationFields(currentValues: Partial<Record<ReverificationField, unknown>>, updates: Record<string, unknown>): ReverificationField[];
export declare class ReverificationTriggerError extends Error {
    constructor(message: string);
}
export declare function sendReverificationTriggerErrorResponse(res: {
    status(code: number): {
        json(body: unknown): void;
    };
}, errorMessage: string, latestVersion: number | null): void;
export interface ReverificationTriggerOptions {
    currentVerificationRequestId?: number | null;
    triggeredBy?: 'admin' | 'user';
}
export interface ReverificationTriggerResult {
    requestId: number;
    reusedExistingRequest: boolean;
}
/**
 * プロフィール変更時の再認証トリガー。
 * - user_requests にリクエスト投入
 * - pharmacies.verificationStatus を pending_verification に更新
 * - OpenClaw へのハンドオフは非同期で実行（API応答をブロックしない）
 */
export declare function triggerReverification(pharmacyId: number, changedFields: string[], options?: ReverificationTriggerOptions): Promise<ReverificationTriggerResult>;
export {};
//# sourceMappingURL=pharmacy-verification-service.d.ts.map