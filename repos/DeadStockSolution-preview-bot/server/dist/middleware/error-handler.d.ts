import { Request, Response, NextFunction } from 'express';
export declare function getErrorMessage(err: unknown): string;
export declare function handleRouteError(err: unknown, logContext: string, responseMessage: string, res: Response): void;
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=error-handler.d.ts.map