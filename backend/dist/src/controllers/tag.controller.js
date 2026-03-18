"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagController = void 0;
const tag_service_1 = require("../services/tag.service");
class TagController {
    static async listTags(req, res) {
        try {
            const tags = await tag_service_1.TagService.listTags(req.user?.id);
            res.json({ tags });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createTag(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { name, color } = req.body;
            if (!name) {
                res.status(400).json({ error: 'Name is required' });
                return;
            }
            const isAdmin = req.user.role === 'SYSADMIN';
            const ownerUserId = isAdmin ? undefined : req.user.id;
            const tag = await tag_service_1.TagService.createTag(name.trim(), color || '#3b82f6', ownerUserId);
            res.status(201).json({ tag });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateTag(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const id = parseInt(req.params.id);
            const { name, color } = req.body;
            if (!name) {
                res.status(400).json({ error: 'Name is required' });
                return;
            }
            const tag = await tag_service_1.TagService.updateTag(id, name.trim(), color || '#3b82f6', req.user.id, req.user.role);
            res.json({ tag });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteTag(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const id = parseInt(req.params.id);
            await tag_service_1.TagService.deleteTag(id, req.user.id, req.user.role);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async addTagToFile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const { tagId } = req.body;
            await tag_service_1.TagService.addTagToFile(fileId, parseInt(tagId), req.user.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async removeTagFromFile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const tagId = parseInt(req.params.tagId);
            await tag_service_1.TagService.removeTagFromFile(fileId, tagId, req.user.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.TagController = TagController;
//# sourceMappingURL=tag.controller.js.map