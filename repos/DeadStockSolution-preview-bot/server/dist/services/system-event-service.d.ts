import { type SystemEventLevel, type SystemEventSource } from '../db/schema';
interface SystemEventInput {
    source: SystemEventSource;
    level?: SystemEventLevel;
    eventType: string;
    message: string;
    detail?: unknown;
    occurredAt?: string;
    errorCode?: string;
}
interface HttpErrorSnapshotInput {
    method: string;
    path: string;
    status: number;
    requestId?: string;
    errorCode?: string;
}
export declare function recordSystemEvent(input: SystemEventInput): Promise<boolean>;
export declare function recordHttpUnhandledError(input: HttpErrorSnapshotInput): Promise<boolean>;
export declare function recordUnhandledRejection(reason: unknown): Promise<boolean>;
export declare function recordUncaughtException(err: unknown): Promise<boolean>;
export interface VercelDeployEventInput {
    eventType: string;
    level: SystemEventLevel;
    message: string;
    deploymentId?: string | null;
    url?: string | null;
    payload?: unknown;
}
export declare function recordVercelDeployEvent(input: VercelDeployEventInput): Promise<boolean>;
export {};
//# sourceMappingURL=system-event-service.d.ts.map