"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionController = void 0;
const version_service_1 = require("../services/version.service");
class VersionController {
    static async upload(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const file = req.file;
            if (!file) {
                res.status(400).json({ error: 'No file provided' });
                return;
            }
            const fileId = parseInt(req.params.fileId);
            const result = await version_service_1.VersionService.uploadNewVersion(fileId, req.user.id, file);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.message === 'Storage quota exceeded') {
                res.status(400).json({ error: error.message });
            }
            else if (error.message === 'File not found' || error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    static async history(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.fileId);
            const result = await version_service_1.VersionService.getVersionHistory(fileId, req.user.id);
            res.json({ versions: result });
        }
        catch (error) {
            if (error.message === 'File not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    static async restore(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.fileId);
            const versionId = parseInt(req.params.versionId);
            const result = await version_service_1.VersionService.restoreVersion(fileId, versionId, req.user.id);
            res.json(result);
        }
        catch (error) {
            if (error.message === 'File not found' || error.message === 'Version not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    static async delete(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const versionId = parseInt(req.params.versionId);
            const result = await version_service_1.VersionService.deleteVersion(versionId, req.user.id);
            res.json(result);
        }
        catch (error) {
            if (error.message === 'Version not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
}
exports.VersionController = VersionController;
//# sourceMappingURL=version.controller.js.map