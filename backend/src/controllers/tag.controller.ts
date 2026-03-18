import { Request, Response } from 'express';
import { TagService } from '../services/tag.service';

export class TagController {
  static async listTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await TagService.listTags(req.user?.id);
      res.json({ tags });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createTag(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const { name, color } = req.body;
      if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
      const isAdmin = req.user.role === 'SYSADMIN';
      const ownerUserId = isAdmin ? undefined : req.user.id;
      const tag = await TagService.createTag(name.trim(), color || '#3b82f6', ownerUserId);
      res.status(201).json({ tag });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateTag(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const id = parseInt(req.params.id as string);
      const { name, color } = req.body;
      if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
      const tag = await TagService.updateTag(id, name.trim(), color || '#3b82f6', req.user.id, req.user.role);
      res.json({ tag });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const id = parseInt(req.params.id as string);
      await TagService.deleteTag(id, req.user.id, req.user.role);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async addTagToFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const fileId = parseInt(req.params.id as string);
      const { tagId } = req.body;
      await TagService.addTagToFile(fileId, parseInt(tagId), req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async removeTagFromFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const fileId = parseInt(req.params.id as string);
      const tagId = parseInt(req.params.tagId as string);
      await TagService.removeTagFromFile(fileId, tagId, req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
