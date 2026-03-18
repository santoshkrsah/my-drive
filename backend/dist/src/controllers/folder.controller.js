"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderController = void 0;
const folder_service_1 = require("../services/folder.service");
const user_activity_service_1 = require("../services/user-activity.service");
class FolderController {
    static async create(req, res) {
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
            const folder = await folder_service_1.FolderService.createFolder(req.user.id, name, parentId ? parseInt(parentId) : undefined);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FOLDER_CREATE', 'FOLDER', folder.id, name);
            res.status(201).json(folder);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async list(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const parentId = req.query.parentId
                ? parseInt(req.query.parentId)
                : undefined;
            const result = await folder_service_1.FolderService.getFolderContents(req.user.id, parentId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async rename(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.id);
            const { name } = req.body;
            if (!name) {
                res.status(400).json({ error: 'Folder name is required' });
                return;
            }
            const folder = await folder_service_1.FolderService.renameFolder(folderId, req.user.id, name);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FOLDER_RENAME', 'FOLDER', folderId, name);
            res.json(folder);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async remove(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.id);
            const result = await folder_service_1.FolderService.deleteFolder(folderId, req.user.id);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FOLDER_DELETE', 'FOLDER', folderId);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async breadcrumb(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.id);
            const result = await folder_service_1.FolderService.getFolderBreadcrumb(folderId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async move(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.id);
            const { parentId } = req.body;
            const result = await folder_service_1.FolderService.moveFolder(folderId, req.user.id, parentId ?? null);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FOLDER_MOVE', 'FOLDER', folderId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async allFolders(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folders = await folder_service_1.FolderService.getAllFolders(req.user.id);
            res.json(folders);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async trash(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await folder_service_1.FolderService.getTrashFolders(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async restore(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.id);
            const result = await folder_service_1.FolderService.restoreFolder(folderId, req.user.id);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FOLDER_RESTORE', 'FOLDER', folderId);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async permanentDelete(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.id);
            const result = await folder_service_1.FolderService.permanentDeleteFolder(folderId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async bulkDelete(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { folderIds } = req.body;
            if (!Array.isArray(folderIds)) {
                res.status(400).json({ error: 'folderIds required' });
                return;
            }
            const result = await folder_service_1.FolderService.bulkDelete(folderIds, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async trashContents(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.id);
            const result = await folder_service_1.FolderService.getTrashFolderContents(req.user.id, folderId);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}
exports.FolderController = FolderController;
//# sourceMappingURL=folder.controller.js.map