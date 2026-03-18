import { Request, Response } from 'express';
import { FolderService } from '../services/folder.service';
import { UserActivityService } from '../services/user-activity.service';

export class FolderController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { name, parentId } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Folder name is required' });
        return;
      }

      const folder = await FolderService.createFolder(
        req.user.id,
        name,
        parentId ? parseInt(parentId) : undefined,
      );

      UserActivityService.log(req.user.id, 'FOLDER_CREATE', 'FOLDER', folder.id, name);
      res.status(201).json(folder);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const parentId = req.query.parentId
        ? parseInt(req.query.parentId as string)
        : undefined;

      const result = await FolderService.getFolderContents(req.user.id, parentId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async rename(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const folderId = parseInt(req.params.id as string);
      const { name } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Folder name is required' });
        return;
      }

      const folder = await FolderService.renameFolder(folderId, req.user.id, name);
      UserActivityService.log(req.user.id, 'FOLDER_RENAME', 'FOLDER', folderId, name);
      res.json(folder);
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

      const folderId = parseInt(req.params.id as string);
      const result = await FolderService.deleteFolder(folderId, req.user.id);
      UserActivityService.log(req.user.id, 'FOLDER_DELETE', 'FOLDER', folderId);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async breadcrumb(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const folderId = parseInt(req.params.id as string);
      const result = await FolderService.getFolderBreadcrumb(folderId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async move(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const folderId = parseInt(req.params.id as string);
      const { parentId } = req.body;

      const result = await FolderService.moveFolder(folderId, req.user.id, parentId ?? null);
      UserActivityService.log(req.user.id, 'FOLDER_MOVE', 'FOLDER', folderId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async allFolders(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const folders = await FolderService.getAllFolders(req.user.id);
      res.json(folders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async trash(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await FolderService.getTrashFolders(req.user.id, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async restore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const folderId = parseInt(req.params.id as string);
      const result = await FolderService.restoreFolder(folderId, req.user.id);
      UserActivityService.log(req.user.id, 'FOLDER_RESTORE', 'FOLDER', folderId);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async permanentDelete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const folderId = parseInt(req.params.id as string);
      const result = await FolderService.permanentDeleteFolder(folderId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const { folderIds } = req.body;
      if (!Array.isArray(folderIds)) { res.status(400).json({ error: 'folderIds required' }); return; }
      const result = await FolderService.bulkDelete(folderIds, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async trashContents(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const folderId = parseInt(req.params.id as string);
      const result = await FolderService.getTrashFolderContents(req.user.id, folderId);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}
