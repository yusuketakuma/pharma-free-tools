type LogPayload = Record<string, unknown> | (() => Record<string, unknown>);
export declare const logger: {
    debug(msg: string, data?: LogPayload): void;
    info(msg: string, data?: LogPayload): void;
    warn(msg: string, data?: LogPayload): void;
    error(msg: string, data?: LogPayload): void;
};
export {};
//# sourceMappingURL=logger.d.ts.map