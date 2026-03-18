import { Request, Response } from 'express';
export declare class PublicLinkController {
    static create(req: Request, res: Response): Promise<void>;
    static listForFile(req: Request, res: Response): Promise<void>;
    static revoke(req: Request, res: Response): Promise<void>;
    static getPublicFile(req: Request, res: Response): Promise<void>;
    static downloadPublicFile(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=public-link.controller.d.ts.map