import { Request, Response } from 'express';
export declare class ShareController {
    static share(req: Request, res: Response): Promise<void>;
    static sharedWithMe(req: Request, res: Response): Promise<void>;
    static sharedByMe(req: Request, res: Response): Promise<void>;
    static fileShares(req: Request, res: Response): Promise<void>;
    static remove(req: Request, res: Response): Promise<void>;
    static shareFolder(req: Request, res: Response): Promise<void>;
    static folderShares(req: Request, res: Response): Promise<void>;
    static removeFolderShare(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=share.controller.d.ts.map