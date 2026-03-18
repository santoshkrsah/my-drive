import { Request, Response } from 'express';
export declare class FileController {
    static upload(req: Request, res: Response): Promise<void>;
    static uploadFolder(req: Request, res: Response): Promise<void>;
    static list(req: Request, res: Response): Promise<void>;
    static download(req: Request, res: Response): Promise<void>;
    static softDelete(req: Request, res: Response): Promise<void>;
    static permanentDelete(req: Request, res: Response): Promise<void>;
    static restore(req: Request, res: Response): Promise<void>;
    static trash(req: Request, res: Response): Promise<void>;
    static storage(req: Request, res: Response): Promise<void>;
    static preview(req: Request, res: Response): Promise<void>;
    static officePreview(req: Request, res: Response): Promise<void>;
    static rename(req: Request, res: Response): Promise<void>;
    static move(req: Request, res: Response): Promise<void>;
    static search(req: Request, res: Response): Promise<void>;
    static bulkDelete(req: Request, res: Response): Promise<void>;
    static bulkMove(req: Request, res: Response): Promise<void>;
    static bulkDownload(req: Request, res: Response): Promise<void>;
    static checkDuplicate(req: Request, res: Response): Promise<void>;
    static getDuplicates(req: Request, res: Response): Promise<void>;
    static deleteAll(req: Request, res: Response): Promise<void>;
    static recent(req: Request, res: Response): Promise<void>;
    static starred(req: Request, res: Response): Promise<void>;
    static toggleStar(req: Request, res: Response): Promise<void>;
    static dashboard(req: Request, res: Response): Promise<void>;
    static emptyTrash(req: Request, res: Response): Promise<void>;
    static accessLog(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=file.controller.d.ts.map