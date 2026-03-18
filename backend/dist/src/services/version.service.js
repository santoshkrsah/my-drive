"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionService = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
class VersionService {
    static async uploadNewVersion(fileId, userId, file) {
        const existingFile = await prisma.file.findFirst({
            where: { id: fileId, userId },
        });
        if (!existingFile) {
            fs_1.default.unlinkSync(file.path);
            throw new Error('File not found');
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { storageQuota: true, storageUsed: true },
        });
        if (!user) {
            fs_1.default.unlinkSync(file.path);
            throw new Error('User not found');
        }
        const sizeDiff = BigInt(file.size) - existingFile.fileSize;
        if (sizeDiff > 0 && user.storageUsed + sizeDiff > user.storageQuota) {
            fs_1.default.unlinkSync(file.path);
            throw new Error('Storage quota exceeded');
        }
        const latestVersion = await prisma.fileVersion.findFirst({
            where: { fileId },
            orderBy: { versionNumber: 'desc' },
        });
        const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
        const [_version, updatedFile] = await prisma.$transaction([
            prisma.fileVersion.create({
                data: {
                    fileId,
                    versionNumber: nextVersionNumber,
                    fileName: existingFile.fileName,
                    filePath: existingFile.filePath,
                    fileSize: existingFile.fileSize,
                },
            }),
            prisma.file.update({
                where: { id: fileId },
                data: {
                    fileName: file.filename,
                    originalName: file.originalname,
                    filePath: file.path,
                    fileSize: BigInt(file.size),
                    mimeType: file.mimetype,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    storageUsed: sizeDiff > 0
                        ? { increment: sizeDiff }
                        : { decrement: -sizeDiff },
                },
            }),
        ]);
        return {
            id: updatedFile.id,
            fileName: updatedFile.fileName,
            originalName: updatedFile.originalName,
            fileSize: updatedFile.fileSize.toString(),
            mimeType: updatedFile.mimeType,
            uploadDate: updatedFile.uploadDate,
            versionSaved: nextVersionNumber,
        };
    }
    static async getVersionHistory(fileId, userId) {
        const file = await prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file)
            throw new Error('File not found');
        const isOwner = file.userId === userId;
        if (!isOwner) {
            const share = await prisma.fileShare.findFirst({
                where: { fileId, sharedWithUserId: userId },
            });
            if (!share)
                throw new Error('File not found');
        }
        const versions = await prisma.fileVersion.findMany({
            where: { fileId },
            orderBy: { versionNumber: 'desc' },
        });
        return versions.map(v => ({
            id: v.id,
            fileId: v.fileId,
            versionNumber: v.versionNumber,
            fileName: v.fileName,
            filePath: v.filePath,
            fileSize: v.fileSize.toString(),
            uploadedAt: v.uploadedAt,
        }));
    }
    static async restoreVersion(fileId, versionId, userId) {
        const file = await prisma.file.findFirst({
            where: { id: fileId, userId },
        });
        if (!file)
            throw new Error('File not found');
        const version = await prisma.fileVersion.findFirst({
            where: { id: versionId, fileId },
        });
        if (!version)
            throw new Error('Version not found');
        const latestVersion = await prisma.fileVersion.findFirst({
            where: { fileId },
            orderBy: { versionNumber: 'desc' },
        });
        const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
        const sizeDiff = version.fileSize - file.fileSize;
        const [_savedVersion, updatedFile] = await prisma.$transaction([
            prisma.fileVersion.create({
                data: {
                    fileId,
                    versionNumber: nextVersionNumber,
                    fileName: file.fileName,
                    filePath: file.filePath,
                    fileSize: file.fileSize,
                },
            }),
            prisma.file.update({
                where: { id: fileId },
                data: {
                    fileName: version.fileName,
                    filePath: version.filePath,
                    fileSize: version.fileSize,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    storageUsed: sizeDiff > 0
                        ? { increment: sizeDiff }
                        : { decrement: -sizeDiff },
                },
            }),
            prisma.fileVersion.delete({
                where: { id: versionId },
            }),
        ]);
        return {
            id: updatedFile.id,
            fileName: updatedFile.fileName,
            fileSize: updatedFile.fileSize.toString(),
            restoredFromVersion: version.versionNumber,
            currentVersionSaved: nextVersionNumber,
        };
    }
    static async deleteVersion(versionId, userId) {
        const version = await prisma.fileVersion.findUnique({
            where: { id: versionId },
            include: { file: true },
        });
        if (!version)
            throw new Error('Version not found');
        if (version.file.userId !== userId)
            throw new Error('Version not found');
        if (fs_1.default.existsSync(version.filePath)) {
            fs_1.default.unlinkSync(version.filePath);
        }
        await prisma.fileVersion.delete({
            where: { id: versionId },
        });
        return { success: true };
    }
}
exports.VersionService = VersionService;
//# sourceMappingURL=version.service.js.map