import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: number;
    role: string;
    impersonatedBy?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                role: string;
                impersonatedBy?: number;
            };
        }
    }
}
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map