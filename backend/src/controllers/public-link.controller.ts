import { Request, Response } from 'express';
import { PublicLinkService } from '../services/public-link.service';

export class PublicLinkController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { fileId, password, expiresAt, maxDownloads } = req.body;
      if (!fileId) {
        res.status(400).json({ error: 'fileId is required' });
        return;
      }

      const result = await PublicLinkService.createLink(fileId, req.user.id, {
        password,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        maxDownloads,
      });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async listForFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const fileId = parseInt(req.params.fileId as string);
      const result = await PublicLinkService.getLinksForFile(fileId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async revoke(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const linkId = parseInt(req.params.id as string);
      const result = await PublicLinkService.revokeLink(linkId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async getPublicFile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const result = await PublicLinkService.getPublicFile(token);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async downloadPublicFile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const password = req.query.password as string | undefined;

      const file = await PublicLinkService.downloadPublicFile(token, password);
      res.download(file.filePath, file.originalName);
    } catch (error: any) {
      const status = error.message === 'Password required' || error.message === 'Invalid password' ? 401 : 404;
      res.status(status).json({ error: error.message });
    }
  }
}
