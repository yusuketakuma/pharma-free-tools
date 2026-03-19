import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare function invalidateAuthUserCache(userId: number): void;
export declare function clearAuthUserCacheForTests(): void;
export declare function requireLogin(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map