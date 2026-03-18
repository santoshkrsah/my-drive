import { Request, Response } from 'express';
export declare class NotificationController {
    static list(req: Request, res: Response): Promise<void>;
    static unreadCount(req: Request, res: Response): Promise<void>;
    static markAsRead(req: Request, res: Response): Promise<void>;
    static markAllAsRead(req: Request, res: Response): Promise<void>;
    static send(req: Request, res: Response): Promise<void>;
    static deleteOne(req: Request, res: Response): Promise<void>;
    static deleteAll(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=notification.controller.d.ts.map