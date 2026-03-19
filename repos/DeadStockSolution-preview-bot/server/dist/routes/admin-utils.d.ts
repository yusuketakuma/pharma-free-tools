import { Response } from 'express';
import { AuthRequest } from '../types';
export declare function sendPaginated<T>(res: Response, data: T[], page: number, limit: number, total: number, extra?: Record<string, unknown>): void;
export declare function parseListPagination(req: AuthRequest, defaultLimit?: number): {
    page: number;
    limit: number;
    offset: number;
};
export declare function parseIdOrBadRequest(res: Response, rawId: string | string[] | undefined): number | null;
export { getErrorMessage } from '../middleware/error-handler';
export declare function handleAdminError(err: unknown, logContext: string, responseMessage: string, res: Response): void;
//# sourceMappingURL=admin-utils.d.ts.map