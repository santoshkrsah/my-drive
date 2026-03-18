import { Request, Response } from 'express';
import { ShareService } from '../services/share.service';
import { UserActivityService } from '../services/user-activity.service';

export class ShareController {
  static async share(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { fileId, username, permission } = req.body;
      if (!fileId || !username) {
        res.status(400).json({ error: 'fileId and username are required' });
        return;
      }

      const result = await ShareService.shareFile(fileId, req.user.id, username, permission);
      UserActivityService.log(req.user.id, 'FILE_SHARE', 'FILE', fileId, `Shared with ${username}`);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async sharedWithMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ShareService.getSharedWithMe(req.user.id, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async sharedByMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ShareService.getSharedByMe(req.user.id, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async fileShares(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const fileId = parseInt(req.params.fileId as string);
      const result = await ShareService.getFileShares(fileId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async remove(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const shareId = parseInt(req.params.id as string);
      const result = await ShareService.removeShare(shareId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async shareFolder(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { folderId, username, permission } = req.body;
      if (!folderId || !username) {
        res.status(400).json({ error: 'folderId and username are required' });
        return;
      }

      const result = await ShareService.shareFolder(folderId, req.user.id, username, permission);
      UserActivityService.log(req.user.id, 'FOLDER_SHARE', 'FOLDER', folderId, `Shared with ${username}`);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async folderShares(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const folderId = parseInt(req.params.folderId as string);
      const result = await ShareService.getFolderShares(folderId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async removeFolderShare(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const shareId = parseInt(req.params.id as string);
      const result = await ShareService.removeFolderShare(shareId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}
