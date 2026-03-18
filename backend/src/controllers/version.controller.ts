import { Request, Response } from 'express';
import { VersionService } from '../services/version.service';

export class VersionController {
  static async upload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const file = req.file as Express.Multer.File;
      if (!file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const fileId = parseInt(req.params.fileId as string);
      const result = await VersionService.uploadNewVersion(fileId, req.user.id, file);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === 'Storage quota exceeded') {
        res.status(400).json({ error: error.message });
      } else if (error.message === 'File not found' || error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async history(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const fileId = parseInt(req.params.fileId as string);
      const result = await VersionService.getVersionHistory(fileId, req.user.id);
      res.json({ versions: result });
    } catch (error: any) {
      if (error.message === 'File not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async restore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const fileId = parseInt(req.params.fileId as string);
      const versionId = parseInt(req.params.versionId as string);
      const result = await VersionService.restoreVersion(fileId, versionId, req.user.id);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'File not found' || error.message === 'Version not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const versionId = parseInt(req.params.versionId as string);
      const result = await VersionService.deleteVersion(versionId, req.user.id);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Version not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
