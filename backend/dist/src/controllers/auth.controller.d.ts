import { Request, Response } from 'express';
export declare class AuthController {
    static login(req: Request, res: Response): Promise<void>;
    static logout(_req: Request, res: Response): Promise<void>;
    static me(req: Request, res: Response): Promise<void>;
    static changePassword(req: Request, res: Response): Promise<void>;
    static refresh(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map