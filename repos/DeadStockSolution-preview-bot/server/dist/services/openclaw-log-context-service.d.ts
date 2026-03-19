interface ActionCount {
    action: string;
    count: number;
}
interface ReasonCount {
    reason: string;
    count: number;
}
interface ContextLogRow {
    action: string;
    detail: string | null;
    createdAt: string | null;
    pharmacyId: number | null;
}
export interface OpenClawLogContext {
    generatedAt: string;
    windowHours: number;
    monitoredImportActions: string[];
    importFailures: {
        total: number;
        byAction: ActionCount[];
        byReason: ReasonCount[];
        recent: ContextLogRow[];
    };
    pharmacyActivity: {
        pharmacyId: number;
        recent: ContextLogRow[];
    };
}
export declare function buildOpenClawLogContext(pharmacyId: number, now?: Date): Promise<OpenClawLogContext>;
export {};
//# sourceMappingURL=openclaw-log-context-service.d.ts.map