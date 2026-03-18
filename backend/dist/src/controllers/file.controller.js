"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const path_1 = __importDefault(require("path"));
const file_service_1 = require("../services/file.service");
const folder_service_1 = require("../services/folder.service");
const user_activity_service_1 = require("../services/user-activity.service");
class FileController {
    static async upload(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const files = req.files;
            if (!files || files.length === 0) {
                res.status(400).json({ error: 'No files provided' });
                return;
            }
            const results = [];
            const folderId = req.body.folderId ? parseInt(req.body.folderId) : undefined;
            for (const file of files) {
                const result = await file_service_1.FileService.uploadFile(req.user.id, file, folderId);
                results.push(result);
            }
            res.status(201).json({ files: results });
            for (const r of results) {
                user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_UPLOAD', 'FILE', r.id, r.originalName);
            }
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async uploadFolder(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const files = req.files;
            if (!files || files.length === 0) {
                res.status(400).json({ error: 'No files provided' });
                return;
            }
            const parentFolderId = req.body.folderId ? parseInt(req.body.folderId) : undefined;
            let relativePaths = [];
            try {
                relativePaths = JSON.parse(req.body.relativePaths || '[]');
            }
            catch { /* ignore */ }
            // Ensure paths array aligns with files array
            while (relativePaths.length < files.length)
                relativePaths.push(files[relativePaths.length].originalname);
            // Cache: "parentId:segment/..." → folder id to avoid redundant DB calls
            const folderCache = new Map();
            const getOrCreate = async (parts, depth, parentId) => {
                const key = `${parentId ?? 'root'}:${parts.slice(0, depth + 1).join('/')}`;
                if (folderCache.has(key))
                    return folderCache.get(key);
                const folder = await folder_service_1.FolderService.getOrCreateFolder(req.user.id, parts[depth], parentId);
                folderCache.set(key, folder.id);
                return folder.id;
            };
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const parts = (relativePaths[i] || file.originalname).split('/').filter(Boolean);
                let currentParentId = parentFolderId;
                // parts[0..n-2] are folder segments; parts[n-1] is the filename
                for (let j = 0; j < parts.length - 1; j++) {
                    currentParentId = await getOrCreate(parts, j, currentParentId);
                }
                const result = await file_service_1.FileService.uploadFile(req.user.id, file, currentParentId);
                results.push(result);
            }
            res.status(201).json({ files: results });
            for (const r of results) {
                user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_UPLOAD', 'FILE', r.id, r.originalName);
            }
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const folderId = req.query.folderId ? parseInt(req.query.folderId) : undefined;
            const sortBy = req.query.sortBy || 'uploadDate';
            const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';
            const result = await file_service_1.FileService.getUserFiles(req.user.id, page, limit, false, folderId, sortBy, sortDir);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async download(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const file = await file_service_1.FileService.getFileById(fileId);
            if (!file) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            if (file.isDeleted) {
                res.status(404).json({ error: 'File is in trash' });
                return;
            }
            const hasAccess = file.userId === req.user.id || await file_service_1.FileService.hasSharedAccess(fileId, req.user.id, 'DOWNLOAD');
            if (!hasAccess) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            file_service_1.FileService.updateLastAccessed(fileId);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_DOWNLOAD', 'FILE', fileId, file.originalName);
            res.download(file.filePath, file.originalName);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async softDelete(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const file = await file_service_1.FileService.getFileById(fileId);
            const result = await file_service_1.FileService.softDeleteFile(fileId, req.user.id);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_DELETE', 'FILE', fileId, file?.originalName);
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
            const fileId = parseInt(req.params.id);
            const result = await file_service_1.FileService.permanentDeleteFile(fileId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async restore(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const file = await file_service_1.FileService.getFileById(fileId);
            const result = await file_service_1.FileService.restoreFile(fileId, req.user.id);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_RESTORE', 'FILE', fileId, file?.originalName);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
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
            const result = await file_service_1.FileService.getTrashFiles(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async storage(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const result = await file_service_1.FileService.getStorageUsage(req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async preview(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const file = await file_service_1.FileService.getFileById(fileId);
            if (!file) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            if (file.isDeleted && file.userId !== req.user.id) {
                res.status(404).json({ error: 'File is in trash' });
                return;
            }
            const hasAccess = file.userId === req.user.id || await file_service_1.FileService.hasSharedAccess(fileId, req.user.id, 'VIEW');
            if (!hasAccess) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            file_service_1.FileService.updateLastAccessed(fileId);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_PREVIEW', 'FILE', fileId, file.originalName);
            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
            res.sendFile(path_1.default.resolve(file.filePath));
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async officePreview(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const file = await file_service_1.FileService.getFileById(fileId);
            if (!file) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            const hasAccess = file.userId === req.user.id || await file_service_1.FileService.hasSharedAccess(fileId, req.user.id, 'VIEW');
            if (!hasAccess) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            const mime = file.mimeType.toLowerCase();
            const isWord = mime.includes('wordprocessingml') || mime === 'application/msword';
            const isExcel = mime.includes('spreadsheetml') ||
                mime === 'application/vnd.ms-excel' ||
                mime.includes('opendocument.spreadsheet');
            if (isWord) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const mammoth = require('mammoth');
                const { value: bodyHtml } = await mammoth.convertToHtml({ path: path_1.default.resolve(file.filePath) });
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:28px 36px;line-height:1.75;color:#1e293b;}h1,h2,h3,h4{margin-top:1.4em;margin-bottom:0.4em;}table{border-collapse:collapse;width:100%;margin:1em 0;}td,th{border:1px solid #cbd5e1;padding:6px 12px;}th{background:#f1f5f9;font-weight:600;}tr:nth-child(even){background:#f8fafc;}p{margin:0.5em 0;}img{max-width:100%;}</style></head><body>${bodyHtml}</body></html>`;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(html);
            }
            else if (isExcel) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const XLSX = require('xlsx');
                const workbook = XLSX.readFile(path_1.default.resolve(file.filePath));
                const sheetTabs = workbook.SheetNames.map((name, i) => {
                    const ws = workbook.Sheets[name];
                    const tableHtml = XLSX.utils.sheet_to_html(ws);
                    return `<div class="sheet" id="sheet-${i}" style="${i === 0 ? '' : 'display:none'}">${tableHtml}</div>`;
                }).join('');
                const tabButtons = workbook.SheetNames.map((name, i) => `<button class="tab ${i === 0 ? 'active' : ''}" onclick="showSheet(${i},this)">${name}</button>`).join('');
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;margin:0;font-size:13px;}.tabs{background:#f1f5f9;padding:8px 8px 0;border-bottom:1px solid #e2e8f0;display:flex;gap:2px;flex-wrap:wrap;}.tab{background:none;border:1px solid #e2e8f0;border-bottom:none;padding:6px 14px;cursor:pointer;border-radius:4px 4px 0 0;color:#475569;font-size:12px;}.tab.active{background:#fff;color:#1d4ed8;font-weight:600;border-bottom:1px solid #fff;margin-bottom:-1px;}.sheet{padding:8px;overflow:auto;}table{border-collapse:collapse;min-width:100%;}td,th{border:1px solid #e2e8f0;padding:4px 10px;white-space:nowrap;}th{background:#f8fafc;font-weight:600;}</style></head><body><div class="tabs">${tabButtons}</div>${sheetTabs}<script>function showSheet(i,btn){document.querySelectorAll('.sheet').forEach(function(s){s.style.display='none';});document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});document.getElementById('sheet-'+i).style.display='';btn.classList.add('active');}</script></body></html>`;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(html);
            }
            else {
                res.status(415).json({ error: 'Preview not supported for this file type' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Preview failed' });
        }
    }
    static async rename(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const { name } = req.body;
            if (!name) {
                res.status(400).json({ error: 'File name is required' });
                return;
            }
            const result = await file_service_1.FileService.renameFile(fileId, req.user.id, name, req.user.role);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_RENAME', 'FILE', fileId, name);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async move(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const { folderId } = req.body;
            const result = await file_service_1.FileService.moveFile(fileId, req.user.id, folderId ?? null);
            user_activity_service_1.UserActivityService.log(req.user.id, 'FILE_MOVE', 'FILE', fileId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async search(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const q = req.query.q ?? '';
            const fileType = req.query.fileType;
            const dateFrom = req.query.dateFrom;
            const dateTo = req.query.dateTo;
            const sizeMin = req.query.sizeMin ? parseFloat(req.query.sizeMin) : undefined;
            const sizeMax = req.query.sizeMax ? parseFloat(req.query.sizeMax) : undefined;
            const tagIds = req.query.tagIds
                ? req.query.tagIds.split(',').map(Number).filter(Boolean)
                : undefined;
            const result = await file_service_1.FileService.searchFiles(req.user.id, q, fileType, dateFrom, dateTo, sizeMin, sizeMax, tagIds);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async bulkDelete(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { fileIds } = req.body;
            if (!Array.isArray(fileIds) || fileIds.length === 0) {
                res.status(400).json({ error: 'fileIds array is required' });
                return;
            }
            const result = await file_service_1.FileService.bulkDelete(fileIds, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async bulkMove(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { fileIds, folderId } = req.body;
            if (!Array.isArray(fileIds) || fileIds.length === 0) {
                res.status(400).json({ error: 'fileIds array is required' });
                return;
            }
            const result = await file_service_1.FileService.bulkMove(fileIds, req.user.id, folderId ?? null);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async bulkDownload(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { fileIds } = req.body;
            if (!Array.isArray(fileIds) || fileIds.length === 0) {
                res.status(400).json({ error: 'fileIds array is required' });
                return;
            }
            const files = await file_service_1.FileService.getBulkFiles(fileIds, req.user.id);
            if (files.length === 0) {
                res.status(404).json({ error: 'No files found' });
                return;
            }
            const archiver = require('archiver');
            const archive = archiver('zip', { zlib: { level: 5 } });
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="download.zip"');
            archive.pipe(res);
            for (const file of files) {
                archive.file(file.filePath, { name: file.originalName });
            }
            await archive.finalize();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async checkDuplicate(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const hash = req.query.hash;
            if (!hash) {
                res.status(400).json({ error: 'File hash is required' });
                return;
            }
            const result = await file_service_1.FileService.checkDuplicate(req.user.id, hash);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getDuplicates(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const result = await file_service_1.FileService.getDuplicateFiles(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async deleteAll(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const folderId = req.body.folderId ? parseInt(req.body.folderId) : undefined;
            const result = await file_service_1.FileService.deleteAllInFolder(req.user.id, folderId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async recent(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const limit = parseInt(req.query.limit) || 20;
            const result = await file_service_1.FileService.getRecentFiles(req.user.id, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async starred(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await file_service_1.FileService.getStarredFiles(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async toggleStar(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const result = await file_service_1.FileService.toggleStar(fileId, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async dashboard(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const result = await file_service_1.FileService.getUserDashboard(req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async emptyTrash(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const [fileResult, folderResult] = await Promise.all([
                file_service_1.FileService.emptyTrash(req.user.id),
                folder_service_1.FolderService.emptyTrash(req.user.id),
            ]);
            res.json({
                deletedFiles: fileResult.deleted,
                deletedFolders: folderResult.deleted,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async accessLog(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const fileId = parseInt(req.params.id);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await file_service_1.FileService.getFileAccessLog(fileId, req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}
exports.FileController = FileController;
//# sourceMappingURL=file.controller.js.map