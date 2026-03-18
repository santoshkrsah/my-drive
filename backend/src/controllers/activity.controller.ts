import { Request, Response } from 'express';
import { UserActivityService } from '../services/user-activity.service';

export class ActivityController {
  static async myActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const actionType = req.query.actionType as string | undefined;

      const result = await UserActivityService.getUserActivities(req.user.id, page, limit, actionType);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async clearMyActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      await UserActivityService.clearUserActivities(req.user.id);
      res.json({ success: true, message: 'All activity logs cleared successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
