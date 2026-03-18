"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicLinkController = void 0;
const public_link_service_1 = require("../services/public-link.service");
class PublicLinkController {
    static async create(req, res) {
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
            const result = await public_link_service_1.PublicLinkService.createLink(fileId, req.user.id, {
                password,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                maxDownloads,
            });
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async listForFile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.fileId);
            const result = await public_link_service_1.PublicLinkService.getLinksForFile(fileId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async revoke(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const linkId = parseInt(req.params.id);
            const result = await public_link_service_1.PublicLinkService.revokeLink(linkId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async getPublicFile(req, res) {
        try {
            const token = req.params.token;
            const result = await public_link_service_1.PublicLinkService.getPublicFile(token);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async downloadPublicFile(req, res) {
        try {
            const token = req.params.token;
            const password = req.query.password;
            const file = await public_link_service_1.PublicLinkService.downloadPublicFile(token, password);
            res.download(file.filePath, file.originalName);
        }
        catch (error) {
            const status = error.message === 'Password required' || error.message === 'Invalid password' ? 401 : 404;
            res.status(status).json({ error: error.message });
        }
    }
}
exports.PublicLinkController = PublicLinkController;
//# sourceMappingURL=public-link.controller.js.map