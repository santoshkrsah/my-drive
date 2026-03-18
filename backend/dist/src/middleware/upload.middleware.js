"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.validateUploadLimits = validateUploadLimits;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const prisma = new client_1.PrismaClient();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, config_1.config.upload.dir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const uniqueName = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, uniqueName);
    },
});
// Use a high hard limit (5 GB) so per-user limits enforced in validateUploadLimits take effect
const HARD_FILE_SIZE_LIMIT = 5 * 1024 * 1024 * 1024;
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: HARD_FILE_SIZE_LIMIT,
        files: 50, // allow up to 50 files; per-user limit is enforced in validateUploadLimits
    },
});
async function validateUploadLimits(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const files = req.files;
        if (!files || files.length === 0) {
            next();
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { maxUploadSize: true, maxFilesPerUpload: true, allowedExtensions: true },
        });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const errors = [];
        // Check max files per upload
        const maxFiles = user.maxFilesPerUpload ?? 10;
        if (files.length > maxFiles) {
            errors.push(`Maximum ${maxFiles} files per upload allowed`);
        }
        // Check individual file size
        const maxSize = user.maxUploadSize ? Number(user.maxUploadSize) : config_1.config.upload.maxFileSize;
        for (const file of files) {
            if (file.size > maxSize) {
                errors.push(`File "${file.originalname}" exceeds max upload size of ${Math.round(maxSize / (1024 * 1024))}MB`);
            }
        }
        // Check allowed extensions
        if (user.allowedExtensions) {
            let allowed;
            try {
                allowed = JSON.parse(user.allowedExtensions);
            }
            catch {
                allowed = user.allowedExtensions.split(',').map(e => e.trim().toLowerCase());
            }
            if (allowed.length > 0) {
                for (const file of files) {
                    const ext = path_1.default.extname(file.originalname).toLowerCase().replace('.', '');
                    if (!allowed.includes(ext)) {
                        errors.push(`File type ".${ext}" is not allowed. Allowed: ${allowed.join(', ')}`);
                    }
                }
            }
        }
        if (errors.length > 0) {
            // Clean up uploaded files
            for (const file of files) {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
            res.status(400).json({ error: errors.join('. ') });
            return;
        }
        next();
    }
    catch (error) {
        // Clean up uploaded files on error
        const files = req.files;
        if (files) {
            for (const file of files) {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
        }
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=upload.middleware.js.map