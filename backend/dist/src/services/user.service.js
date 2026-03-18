"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UserService {
    static async createUser(input) {
        const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
        const user = await prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                username: input.username,
                passwordHash,
                role: input.role || client_1.Role.USER,
                storageQuota: input.storageQuota || BigInt(5368709120),
                maxUploadSize: input.maxUploadSize,
                maxFilesPerUpload: input.maxFilesPerUpload,
                allowedExtensions: input.allowedExtensions,
            },
        });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            storageQuota: user.storageQuota.toString(),
            storageUsed: user.storageUsed.toString(),
            status: user.status,
            createdAt: user.createdAt,
            maxUploadSize: user.maxUploadSize?.toString() || null,
            maxFilesPerUpload: user.maxFilesPerUpload,
            allowedExtensions: user.allowedExtensions,
        };
    }
    static async updateUser(id, input) {
        const data = {};
        if (input.name)
            data.name = input.name;
        if (input.email)
            data.email = input.email;
        if (input.role)
            data.role = input.role;
        if (input.storageQuota !== undefined)
            data.storageQuota = input.storageQuota;
        if (input.password)
            data.passwordHash = await bcryptjs_1.default.hash(input.password, 12);
        if (input.maxUploadSize !== undefined)
            data.maxUploadSize = input.maxUploadSize;
        if (input.maxFilesPerUpload !== undefined)
            data.maxFilesPerUpload = input.maxFilesPerUpload;
        if (input.allowedExtensions !== undefined)
            data.allowedExtensions = input.allowedExtensions;
        const user = await prisma.user.update({
            where: { id },
            data,
        });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            storageQuota: user.storageQuota.toString(),
            storageUsed: user.storageUsed.toString(),
            status: user.status,
            createdAt: user.createdAt,
            maxUploadSize: user.maxUploadSize?.toString() || null,
            maxFilesPerUpload: user.maxFilesPerUpload,
            allowedExtensions: user.allowedExtensions,
        };
    }
    static async deleteUser(id, permanent = false, delayMinutes = 60) {
        if (permanent) {
            // Remove share records that reference this user without cascade
            // (FileShare/FolderShare reference User directly with no onDelete cascade)
            await prisma.fileShare.deleteMany({ where: { OR: [{ sharedByUserId: id }, { sharedWithUserId: id }] } });
            await prisma.folderShare.deleteMany({ where: { OR: [{ sharedByUserId: id }, { sharedWithUserId: id }] } });
            await prisma.activityLog.deleteMany({ where: { OR: [{ adminId: id }, { targetUserId: id }] } });
            // Delete user — cascade removes files, folders, notifications, tags, user activities
            await prisma.user.delete({ where: { id } });
            return { deleted: true, permanent: true };
        }
        await prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.DELETED, scheduledDeletionAt: new Date(Date.now() + delayMinutes * 60 * 1000) },
        });
        return { deleted: true, permanent: false };
    }
    static async banUser(id) {
        return prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.BANNED },
        });
    }
    static async unbanUser(id) {
        return prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.ACTIVE },
        });
    }
    static async getAllUsers(page = 1, limit = 20, search) {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { username: { contains: search } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    role: true,
                    storageQuota: true,
                    storageUsed: true,
                    status: true,
                    createdAt: true,
                    maxUploadSize: true,
                    maxFilesPerUpload: true,
                    allowedExtensions: true,
                    scheduledDeletionAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);
        // Compute actual storage usage from files for each user
        const userIds = users.map(u => u.id);
        const storageAggregations = await prisma.file.groupBy({
            by: ['userId'],
            where: {
                userId: { in: userIds },
                pendingPurge: false,
            },
            _sum: { fileSize: true },
        });
        const storageMap = new Map();
        for (const agg of storageAggregations) {
            storageMap.set(agg.userId, agg._sum.fileSize ?? BigInt(0));
        }
        return {
            users: users.map(u => ({
                ...u,
                storageQuota: u.storageQuota.toString(),
                storageUsed: (storageMap.get(u.id) ?? BigInt(0)).toString(),
                maxUploadSize: u.maxUploadSize?.toString() || null,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    static async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                storageQuota: true,
                storageUsed: true,
                status: true,
                createdAt: true,
                maxUploadSize: true,
                maxFilesPerUpload: true,
                allowedExtensions: true,
            },
        });
        if (!user)
            return null;
        return {
            ...user,
            storageQuota: user.storageQuota.toString(),
            storageUsed: user.storageUsed.toString(),
            maxUploadSize: user.maxUploadSize?.toString() || null,
        };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map