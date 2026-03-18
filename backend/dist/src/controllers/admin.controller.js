"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const client_1 = require("@prisma/client");
const user_service_1 = require("../services/user.service");
const file_service_1 = require("../services/file.service");
const log_service_1 = require("../services/log.service");
const auth_service_1 = require("../services/auth.service");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
function getIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.ip;
    return ip || '';
}
class AdminController {
    static async dashboard(_req, res) {
        try {
            const [totalUsers, activeUsers, bannedUsers, totalFiles, storageUsedAgg, quotaAgg, duplicateGroups] = await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { status: 'ACTIVE' } }),
                prisma.user.count({ where: { status: 'BANNED' } }),
                prisma.file.count({ where: { isDeleted: false } }),
                prisma.file.aggregate({
                    where: { pendingPurge: false },
                    _sum: { fileSize: true },
                }),
                prisma.user.aggregate({
                    where: { status: 'ACTIVE' },
                    _sum: { storageQuota: true },
                }),
                prisma.file.groupBy({
                    by: ['fileHash'],
                    where: { isDeleted: false, fileHash: { not: null } },
                    having: { fileHash: { _count: { gt: 1 } } },
                    _count: { fileHash: true },
                }),
            ]);
            const duplicateCount = duplicateGroups.reduce((sum, g) => sum + g._count.fileHash, 0);
            res.json({
                totalUsers,
                activeUsers,
                bannedUsers,
                totalFiles,
                duplicateCount,
                totalStorageUsed: (storageUsedAgg._sum.fileSize || BigInt(0)).toString(),
                totalStorageAllocated: (quotaAgg._sum.storageQuota || BigInt(0)).toString(),
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async listUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            const result = await user_service_1.UserService.getAllUsers(page, limit, search);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createUser(req, res) {
        try {
            const { name, email, username, password, role, storageQuota, maxUploadSize, maxFilesPerUpload, allowedExtensions } = req.body;
            if (!name || !email || !username || !password) {
                res.status(400).json({ error: 'Name, email, username, and password are required' });
                return;
            }
            const user = await user_service_1.UserService.createUser({
                name,
                email,
                username,
                password,
                role,
                storageQuota: storageQuota ? BigInt(storageQuota) : undefined,
                maxUploadSize: maxUploadSize ? BigInt(maxUploadSize) : undefined,
                maxFilesPerUpload: maxFilesPerUpload ? parseInt(maxFilesPerUpload) : undefined,
                allowedExtensions: allowedExtensions || undefined,
            });
            const adminId = req.user.impersonatedBy || req.user.id;
            await log_service_1.LogService.log(adminId, 'CREATE_USER', user.id, `Created user: ${username}`, getIp(req));
            res.status(201).json(user);
        }
        catch (error) {
            if (error.code === 'P2002') {
                res.status(409).json({ error: 'Username or email already exists' });
                return;
            }
            res.status(400).json({ error: error.message });
        }
    }
    static async updateUser(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { name, email, role, storageQuota, password, maxUploadSize, maxFilesPerUpload, allowedExtensions } = req.body;
            const user = await user_service_1.UserService.updateUser(id, {
                name,
                email,
                role,
                storageQuota: storageQuota ? BigInt(storageQuota) : undefined,
                password,
                maxUploadSize: maxUploadSize !== undefined ? (maxUploadSize ? BigInt(maxUploadSize) : null) : undefined,
                maxFilesPerUpload: maxFilesPerUpload !== undefined ? (maxFilesPerUpload ? parseInt(maxFilesPerUpload) : null) : undefined,
                allowedExtensions: allowedExtensions !== undefined ? (allowedExtensions || null) : undefined,
            });
            const adminId = req.user.impersonatedBy || req.user.id;
            await log_service_1.LogService.log(adminId, 'UPDATE_USER', id, `Updated user: ${user.username}`, getIp(req));
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteUser(req, res) {
        try {
            const id = parseInt(req.params.id);
            const permanent = req.query.permanent === 'true';
            const delayMinutes = parseInt(req.query.delayMinutes) || 60;
            const adminId = req.user.impersonatedBy || req.user.id;
            if (id === adminId) {
                res.status(400).json({ error: 'Cannot delete your own account' });
                return;
            }
            if (permanent) {
                const userFiles = await prisma.file.findMany({ where: { userId: id } });
                for (const file of userFiles) {
                    if (fs_1.default.existsSync(file.filePath)) {
                        fs_1.default.unlinkSync(file.filePath);
                    }
                }
            }
            const result = await user_service_1.UserService.deleteUser(id, permanent, delayMinutes);
            await log_service_1.LogService.log(adminId, permanent ? 'PERMANENT_DELETE_USER' : 'SOFT_DELETE_USER', id, `Deleted user (permanent: ${permanent})`, getIp(req));
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async banUser(req, res) {
        try {
            const id = parseInt(req.params.id);
            const adminId = req.user.impersonatedBy || req.user.id;
            if (id === adminId) {
                res.status(400).json({ error: 'Cannot ban your own account' });
                return;
            }
            await user_service_1.UserService.banUser(id);
            await log_service_1.LogService.log(adminId, 'BAN_USER', id, 'Banned user', getIp(req));
            res.json({ message: 'User banned successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async unbanUser(req, res) {
        try {
            const id = parseInt(req.params.id);
            await user_service_1.UserService.unbanUser(id);
            const adminId = req.user.impersonatedBy || req.user.id;
            await log_service_1.LogService.log(adminId, 'UNBAN_USER', id, 'Unbanned user', getIp(req));
            res.json({ message: 'User unbanned successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async impersonate(req, res) {
        try {
            const targetId = parseInt(req.params.id);
            const adminId = req.user.impersonatedBy || req.user.id;
            if (targetId === adminId) {
                res.status(400).json({ error: 'Cannot impersonate yourself' });
                return;
            }
            const targetUser = await auth_service_1.AuthService.getUserById(targetId);
            if (!targetUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const accessToken = auth_service_1.AuthService.generateAccessToken({
                userId: targetId,
                role: targetUser.role,
                impersonatedBy: adminId,
            });
            await log_service_1.LogService.log(adminId, 'IMPERSONATE', targetId, `Admin impersonated user: ${targetUser.username}`, getIp(req));
            res.json({
                accessToken,
                user: targetUser,
                impersonatedBy: adminId,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async stopImpersonation(req, res) {
        try {
            if (!req.user?.impersonatedBy) {
                res.status(400).json({ error: 'Not currently impersonating' });
                return;
            }
            const adminId = req.user.impersonatedBy;
            const admin = await auth_service_1.AuthService.getUserById(adminId);
            if (!admin) {
                res.status(404).json({ error: 'Admin user not found' });
                return;
            }
            const accessToken = auth_service_1.AuthService.generateAccessToken({
                userId: adminId,
                role: admin.role,
            });
            await log_service_1.LogService.log(adminId, 'STOP_IMPERSONATION', req.user.id, 'Admin stopped impersonation', getIp(req));
            res.json({
                accessToken,
                user: admin,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getUserFiles(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await file_service_1.FileService.getUserFiles(userId, page, limit, true);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const actionType = req.query.actionType;
            const result = await log_service_1.LogService.getLogs(page, limit, actionType);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async clearLogs(req, res) {
        try {
            await log_service_1.LogService.clearLogs();
            res.json({ success: true, message: 'All logs cleared successfully' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async listRecoverableFiles(req, res) {
        try {
            // Standalone files (not inside a pendingPurge folder)
            const fileWhere = {
                pendingPurge: true,
                OR: [{ folderId: null }, { folder: { pendingPurge: false } }],
            };
            // Top-level pending-purge folders (parent is not also pendingPurge)
            const folderWhere = {
                pendingPurge: true,
                OR: [{ parentId: null }, { parent: { pendingPurge: false } }],
            };
            const [files, folders] = await Promise.all([
                prisma.file.findMany({
                    where: fileWhere,
                    orderBy: { purgeAfter: 'asc' },
                    include: { user: { select: { id: true, name: true, username: true, email: true } } },
                }),
                prisma.folder.findMany({
                    where: folderWhere,
                    orderBy: { purgeAfter: 'asc' },
                    include: { user: { select: { id: true, name: true, username: true, email: true } } },
                }),
            ]);
            res.json({
                files: files.map(f => ({ ...f, fileSize: f.fileSize.toString() })),
                folders,
                total: files.length + folders.length,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async recoverFile(req, res) {
        try {
            const id = parseInt(req.params.id);
            const file = await prisma.file.findFirst({ where: { id, pendingPurge: true } });
            if (!file) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            await prisma.$transaction([
                prisma.file.update({
                    where: { id },
                    data: { pendingPurge: false, purgeAfter: null },
                }),
                prisma.user.update({
                    where: { id: file.userId },
                    data: { storageUsed: { increment: file.fileSize } },
                }),
            ]);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async recoverFolder(req, res) {
        try {
            const id = parseInt(req.params.id);
            const folder = await prisma.folder.findFirst({ where: { id, pendingPurge: true } });
            if (!folder) {
                res.status(404).json({ error: 'Folder not found' });
                return;
            }
            const recoverRecursive = async (folderId, userId) => {
                const files = await prisma.file.findMany({ where: { folderId, userId, pendingPurge: true } });
                const totalSize = files.reduce((s, f) => s + f.fileSize, BigInt(0));
                if (files.length > 0) {
                    await prisma.file.updateMany({
                        where: { id: { in: files.map(f => f.id) } },
                        data: { pendingPurge: false, purgeAfter: null },
                    });
                    await prisma.user.update({ where: { id: userId }, data: { storageUsed: { increment: totalSize } } });
                }
                await prisma.folder.update({
                    where: { id: folderId },
                    data: { pendingPurge: false, purgeAfter: null },
                });
                const children = await prisma.folder.findMany({ where: { parentId: folderId, userId } });
                for (const child of children)
                    await recoverRecursive(child.id, userId);
            };
            await recoverRecursive(id, folder.userId);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async recoverableUnviewedCount(_req, res) {
        try {
            const [fileCount, folderCount] = await Promise.all([
                prisma.file.count({ where: { pendingPurge: true, adminViewed: false } }),
                prisma.folder.count({ where: { pendingPurge: true, adminViewed: false } }),
            ]);
            res.json({ count: fileCount + folderCount });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async markRecoverableViewed(_req, res) {
        try {
            await Promise.all([
                prisma.file.updateMany({ where: { pendingPurge: true, adminViewed: false }, data: { adminViewed: true } }),
                prisma.folder.updateMany({ where: { pendingPurge: true, adminViewed: false }, data: { adminViewed: true } }),
            ]);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async purgeFile(req, res) {
        try {
            const id = parseInt(req.params.id);
            const file = await prisma.file.findFirst({ where: { id, pendingPurge: true } });
            if (!file) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            if (fs_1.default.existsSync(file.filePath))
                fs_1.default.unlinkSync(file.filePath);
            await prisma.file.delete({ where: { id } });
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async purgeFolder(req, res) {
        try {
            const id = parseInt(req.params.id);
            const folder = await prisma.folder.findFirst({ where: { id, pendingPurge: true } });
            if (!folder) {
                res.status(404).json({ error: 'Folder not found' });
                return;
            }
            const purgeRecursive = async (folderId) => {
                const files = await prisma.file.findMany({ where: { folderId } });
                for (const file of files) {
                    if (fs_1.default.existsSync(file.filePath))
                        fs_1.default.unlinkSync(file.filePath);
                }
                await prisma.file.deleteMany({ where: { folderId } });
                const children = await prisma.folder.findMany({ where: { parentId: folderId } });
                for (const child of children)
                    await purgeRecursive(child.id);
                await prisma.folder.delete({ where: { id: folderId } });
            };
            await purgeRecursive(id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async bulkRecover(req, res) {
        try {
            const { fileIds = [], folderIds = [] } = req.body;
            for (const fileId of fileIds) {
                const file = await prisma.file.findFirst({ where: { id: fileId, pendingPurge: true } });
                if (!file)
                    continue;
                await prisma.$transaction([
                    prisma.file.update({ where: { id: fileId }, data: { pendingPurge: false, purgeAfter: null } }),
                    prisma.user.update({ where: { id: file.userId }, data: { storageUsed: { increment: file.fileSize } } }),
                ]);
            }
            for (const folderId of folderIds) {
                const folder = await prisma.folder.findFirst({ where: { id: folderId, pendingPurge: true } });
                if (!folder)
                    continue;
                const recoverRecursive = async (fId, userId) => {
                    const files = await prisma.file.findMany({ where: { folderId: fId, userId, pendingPurge: true } });
                    const totalSize = files.reduce((s, f) => s + f.fileSize, BigInt(0));
                    if (files.length > 0) {
                        await prisma.file.updateMany({ where: { id: { in: files.map(f => f.id) } }, data: { pendingPurge: false, purgeAfter: null } });
                        await prisma.user.update({ where: { id: userId }, data: { storageUsed: { increment: totalSize } } });
                    }
                    await prisma.folder.update({ where: { id: fId }, data: { pendingPurge: false, purgeAfter: null } });
                    const children = await prisma.folder.findMany({ where: { parentId: fId, userId } });
                    for (const child of children)
                        await recoverRecursive(child.id, userId);
                };
                await recoverRecursive(folderId, folder.userId);
            }
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async bulkPurge(req, res) {
        try {
            const { fileIds = [], folderIds = [] } = req.body;
            for (const fileId of fileIds) {
                const file = await prisma.file.findFirst({ where: { id: fileId, pendingPurge: true } });
                if (!file)
                    continue;
                if (fs_1.default.existsSync(file.filePath))
                    fs_1.default.unlinkSync(file.filePath);
                await prisma.file.delete({ where: { id: fileId } });
            }
            const purgeRecursive = async (folderId) => {
                const files = await prisma.file.findMany({ where: { folderId } });
                for (const file of files) {
                    if (fs_1.default.existsSync(file.filePath))
                        fs_1.default.unlinkSync(file.filePath);
                }
                await prisma.file.deleteMany({ where: { folderId } });
                const children = await prisma.folder.findMany({ where: { parentId: folderId } });
                for (const child of children)
                    await purgeRecursive(child.id);
                await prisma.folder.delete({ where: { id: folderId } });
            };
            for (const folderId of folderIds) {
                const folder = await prisma.folder.findFirst({ where: { id: folderId, pendingPurge: true } });
                if (folder)
                    await purgeRecursive(folderId);
            }
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map