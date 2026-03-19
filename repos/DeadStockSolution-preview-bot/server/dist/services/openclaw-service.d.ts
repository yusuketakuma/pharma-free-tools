export type OpenClawStatus = 'pending_handoff' | 'in_dialogue' | 'implementing' | 'completed';
type OpenClawBaseUrlError = 'missing' | 'invalid' | 'insecure';
type OpenClawConnectorMode = 'legacy_http' | 'gateway_cli';
export interface OpenClawConfig {
    mode: OpenClawConnectorMode;
    cliPath: string;
    baseUrl: string;
    baseUrlError: OpenClawBaseUrlError | null;
    apiKey: string;
    agentId: string;
    webhookSecret: string;
    implementationBranch: string;
}
export interface OpenClawHandoffInput {
    requestId: number;
    pharmacyId: number;
    requestText: string;
    context?: Record<string, unknown>;
}
export interface OpenClawHandoffResult {
    accepted: boolean;
    connectorConfigured: boolean;
    implementationBranch: string;
    status: OpenClawStatus;
    threadId: string | null;
    summary: string | null;
    note: string;
}
export interface GatewaySendInput {
    agentId: string;
    message: string;
    metadata?: unknown;
}
export declare function getOpenClawConfig(): OpenClawConfig;
export declare function sendToOpenClawGateway(input: GatewaySendInput): Promise<{
    summary: string;
}>;
export declare function isOpenClawStatus(value: unknown): value is OpenClawStatus;
export declare function canTransitionOpenClawStatus(current: OpenClawStatus, next: OpenClawStatus): boolean;
export declare function getOpenClawImplementationBranch(): string;
export declare function isOpenClawConnectorConfigured(): boolean;
export declare function isOpenClawWebhookConfigured(): boolean;
export declare function verifyOpenClawWebhookSignature({ receivedSignature, receivedTimestamp, rawBody, nowMs, }: {
    receivedSignature: string | undefined;
    receivedTimestamp: string | undefined;
    rawBody: string | undefined;
    nowMs?: number;
}): boolean;
export declare function consumeOpenClawWebhookReplay({ receivedSignature, receivedTimestamp, nowMs, }: {
    receivedSignature: string | undefined;
    receivedTimestamp: string | undefined;
    nowMs?: number;
}): boolean;
export declare function isOpenClawWebhookReplay({ receivedSignature, receivedTimestamp, nowMs, }: {
    receivedSignature: string | undefined;
    receivedTimestamp: string | undefined;
    nowMs?: number;
}): boolean;
export declare function releaseOpenClawWebhookReplay({ receivedSignature, receivedTimestamp, }: {
    receivedSignature: string | undefined;
    receivedTimestamp: string | undefined;
}): void;
export declare function resetOpenClawWebhookReplayCacheForTests(): void;
export declare function isImplementationBranchAllowed(branch: string | null | undefined): boolean;
export declare function handoffToOpenClaw(input: OpenClawHandoffInput): Promise<OpenClawHandoffResult>;
export {};
//# sourceMappingURL=openclaw-service.d.ts.map