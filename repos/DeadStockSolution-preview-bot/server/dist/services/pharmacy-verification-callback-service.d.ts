import type { VerificationStatus } from './pharmacy-verification-service';
interface VerificationCallbackInput {
    pharmacyId: number;
    requestId: number;
    approved: boolean;
    reason: string;
}
interface VerificationCallbackResult {
    verificationStatus: VerificationStatus;
    pharmacyId: number;
    applied: boolean;
}
export declare function processVerificationCallback(input: VerificationCallbackInput): Promise<VerificationCallbackResult>;
export {};
//# sourceMappingURL=pharmacy-verification-callback-service.d.ts.map