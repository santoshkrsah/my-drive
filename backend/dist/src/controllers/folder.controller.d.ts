import { Request, Response } from 'express';
export declare class FolderController {
    static create(req: Request, res: Response): Promise<void>;
    static list(req: Request, res: Response): Promise<void>;
    static rename(req: Request, res: Response): Promise<void>;
    static remove(req: Request, res: Response): Promise<void>;
    static breadcrumb(req: Request, res: Response): Promise<void>;
    static move(req: Request, res: Response): Promise<void>;
    static allFolders(req: Request, res: Response): Promise<void>;
    static trash(req: Request, res: Response): Promise<void>;
    static restore(req: Request, res: Response): Promise<void>;
    static permanentDelete(req: Request, res: Response): Promise<void>;
    static bulkDelete(req: Request, res: Response): Promise<void>;
    static trashContents(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=folder.controller.d.ts.map