import { Agent } from 'undici';
interface ExternalUrlValidationResult {
    ok: boolean;
    reason: string | null;
    hostname: string | null;
    resolvedAddresses: string[];
}
export declare function validateExternalHttpsUrl(url: string): Promise<ExternalUrlValidationResult>;
export declare function assertExternalHttpsUrlSafe(url: string): Promise<void>;
export declare function createPinnedDnsAgent(hostname: string, allowedAddresses: string[]): Agent;
export {};
//# sourceMappingURL=network-utils.d.ts.map