import { NextFunction, Request, Response } from 'express';
export declare function generateCsrfToken(): string;
export declare function setCsrfCookie(res: Response, token: string): void;
export declare function clearCsrfCookie(res: Response): void;
export declare function ensureCsrfCookie(req: Request, res: Response): string;
export declare function csrfProtection(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=csrf.d.ts.map