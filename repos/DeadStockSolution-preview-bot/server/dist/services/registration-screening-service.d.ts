export interface RegistrationScreeningInput {
    pharmacyName: string;
    prefecture: string;
    address: string;
    licenseNumber: string;
    permitLicenseNumber: string;
    permitPharmacyName: string;
    permitAddress: string;
}
export interface RegistrationScreeningResult {
    approved: boolean;
    screeningScore: number;
    reasons: string[];
    mismatches: string[];
}
export declare function evaluateRegistrationScreening(input: RegistrationScreeningInput): RegistrationScreeningResult;
//# sourceMappingURL=registration-screening-service.d.ts.map