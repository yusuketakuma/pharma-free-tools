import { JwtPayload } from '../types';
export declare const JWT_SECRET_MISSING_ERROR_MESSAGE = "JWT_SECRET environment variable is not set";
export declare const JWT_SECRET_WEAK_ERROR_MESSAGE = "JWT_SECRET is too weak";
export declare function assertJwtSecretConfigured(): void;
export declare function isJwtSecretMissingError(err: unknown): err is Error;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function deriveSessionVersion(passwordHash: string): string;
export declare function generateToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
//# sourceMappingURL=auth-service.d.ts.map