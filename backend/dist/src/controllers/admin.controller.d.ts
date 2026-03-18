import { Request, Response } from 'express';
export declare class AdminController {
    static dashboard(_req: Request, res: Response): Promise<void>;
    static listUsers(req: Request, res: Response): Promise<void>;
    static createUser(req: Request, res: Response): Promise<void>;
    static updateUser(req: Request, res: Response): Promise<void>;
    static deleteUser(req: Request, res: Response): Promise<void>;
    static banUser(req: Request, res: Response): Promise<void>;
    static unbanUser(req: Request, res: Response): Promise<void>;
    static impersonate(req: Request, res: Response): Promise<void>;
    static stopImpersonation(req: Request, res: Response): Promise<void>;
    static getUserFiles(req: Request, res: Response): Promise<void>;
    static getLogs(req: Request, res: Response): Promise<void>;
    static clearLogs(req: Request, res: Response): Promise<void>;
    static listRecoverableFiles(req: Request, res: Response): Promise<void>;
    static recoverFile(req: Request, res: Response): Promise<void>;
    static recoverFolder(req: Request, res: Response): Promise<void>;
    static recoverableUnviewedCount(_req: Request, res: Response): Promise<void>;
    static markRecoverableViewed(_req: Request, res: Response): Promise<void>;
    static purgeFile(req: Request, res: Response): Promise<void>;
    static purgeFolder(req: Request, res: Response): Promise<void>;
    static bulkRecover(req: Request, res: Response): Promise<void>;
    static bulkPurge(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=admin.controller.d.ts.map