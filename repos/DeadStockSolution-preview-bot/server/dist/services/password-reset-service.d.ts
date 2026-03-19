export declare function generateResetToken(): string;
export interface PasswordResetResult {
    success: boolean;
    pharmacyId: number;
}
export declare function createPasswordResetToken(email: string): Promise<{
    token: string;
    pharmacyName: string;
} | null>;
export declare function resetPasswordWithToken(token: string, newPassword: string): Promise<PasswordResetResult>;
//# sourceMappingURL=password-reset-service.d.ts.map