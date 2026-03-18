import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationService.getUserNotifications(req.user.id, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async unreadCount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const count = await NotificationService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const id = parseInt(req.params.id as string);
      await NotificationService.markAsRead(id, req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      await NotificationService.markAllAsRead(req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async send(req: Request, res: Response): Promise<void> {
    try {
      const { title, message, userIds, sendToAll } = req.body;

      if (!title || !message) {
        res.status(400).json({ error: 'Title and message are required' });
        return;
      }

      let result;
      if (sendToAll) {
        result = await NotificationService.createForAll(title, message);
      } else if (Array.isArray(userIds) && userIds.length > 0) {
        result = await NotificationService.createForUsers(userIds, title, message);
      } else {
        res.status(400).json({ error: 'Specify userIds or set sendToAll to true' });
        return;
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteOne(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const id = parseInt(req.params.id as string);
      await NotificationService.deleteNotification(id, req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      await NotificationService.deleteAllNotifications(req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
