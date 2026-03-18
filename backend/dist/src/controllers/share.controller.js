"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareController = void 0;
const share_service_1 = require("../services/share.service");
const user_activity_service_1 = require("../services/user-activity.service");
class ShareController {
    static async share(req, res) {
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
            const result = await share_service_1.ShareService.shareFile(fileId, req.user.id, username, permission);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_SHARE', 'FILE', fileId, `Shared with ${username}`);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async sharedWithMe(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await share_service_1.ShareService.getSharedWithMe(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async sharedByMe(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await share_service_1.ShareService.getSharedByMe(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async fileShares(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.fileId);
            const result = await share_service_1.ShareService.getFileShares(fileId, req.user.id);
            res.json(result);
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
            const shareId = parseInt(req.params.id);
            const result = await share_service_1.ShareService.removeShare(shareId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async shareFolder(req, res) {
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
            const result = await share_service_1.ShareService.shareFolder(folderId, req.user.id, username, permission);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FOLDER_SHARE', 'FOLDER', folderId, `Shared with ${username}`);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async folderShares(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = parseInt(req.params.folderId);
            const result = await share_service_1.ShareService.getFolderShares(folderId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async removeFolderShare(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const shareId = parseInt(req.params.id);
            const result = await share_service_1.ShareService.removeFolderShare(shareId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}
exports.ShareController = ShareController;
//# sourceMappingURL=share.controller.js.map