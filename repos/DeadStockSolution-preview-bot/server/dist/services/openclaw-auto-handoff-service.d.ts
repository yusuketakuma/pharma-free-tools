import { type OpenClawStatus } from './openclaw-service';
interface ImportFailureActionCount {
    action: string;
    count: number;
}
interface ImportFailureReasonCount {
    reason: string;
    count: number;
}
export interface ImportFailureAlertForOpenClaw {
    detectedAt: string;
    windowMinutes: number;
    threshold: number;
    totalFailures: number;
    monitoredActions: string[];
    latestFailureAt: string | null;
    failureByAction: ImportFailureActionCount[];
    failureByReason: ImportFailureReasonCount[];
}
export interface OpenClawAutoHandoffResult {
    triggered: boolean;
    accepted: boolean;
    requestId: number | null;
    status: OpenClawStatus | 'pending_handoff';
    reason: string;
}
export declare function handoffImportFailureAlertToOpenClaw(payload: ImportFailureAlertForOpenClaw): Promise<OpenClawAutoHandoffResult>;
export {};
//# sourceMappingURL=openclaw-auto-handoff-service.d.ts.map