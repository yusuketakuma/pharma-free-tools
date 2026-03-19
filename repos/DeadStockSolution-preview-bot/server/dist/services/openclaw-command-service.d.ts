export interface CommandDefinition {
    category: 'read' | 'write' | 'admin';
    descriptionJa: string;
    handler: (params: Record<string, unknown>) => Promise<unknown>;
}
export interface CommandRequest {
    command: string;
    parameters?: Record<string, unknown>;
    threadId?: string;
    reason?: string;
}
export interface CommandResult {
    id: number;
    command: string;
    status: 'completed' | 'failed' | 'rejected';
    result?: unknown;
    errorMessage?: string;
}
export declare const BUILTIN_COMMANDS: Record<string, CommandDefinition>;
export declare function isCommandAllowed(commandName: string): boolean;
export declare function executeCommand(request: CommandRequest, signature: string): Promise<CommandResult>;
export declare function listCommandHistory(limit?: number, offset?: number): Promise<{
    id: number;
    commandName: string;
    parameters: string | null;
    status: string;
    result: string | null;
    errorMessage: string | null;
    openclawThreadId: string | null;
    signature: string;
    receivedAt: string | null;
    completedAt: string | null;
}[]>;
//# sourceMappingURL=openclaw-command-service.d.ts.map