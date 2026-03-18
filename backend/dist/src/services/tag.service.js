"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TagService {
    static async listTags(userId) {
        return prisma.tag.findMany({
            where: userId ? { OR: [{ userId: null }, { userId }] } : { userId: null },
            orderBy: { name: 'asc' },
        });
    }
    static async createTag(name, color, userId) {
        const effectiveUserId = userId ?? null;
        const existing = await prisma.tag.findFirst({ where: { name, userId: effectiveUserId } });
        if (existing)
            throw new Error('Tag with this name already exists');
        return prisma.tag.create({ data: { name, color, userId: effectiveUserId } });
    }
    static async updateTag(id, name, color, requestingUserId, role) {
        const tag = await prisma.tag.findUnique({ where: { id } });
        if (!tag)
            throw new Error('Tag not found');
        if (tag.userId !== null && tag.userId !== requestingUserId && role !== 'SYSADMIN')
            throw new Error('Not authorized');
        if (tag.userId === null && role !== 'SYSADMIN')
            throw new Error('Only admins can edit system tags');
        const existing = await prisma.tag.findFirst({ where: { name, userId: tag.userId, id: { not: id } } });
        if (existing)
            throw new Error('Tag with this name already exists');
        return prisma.tag.update({ where: { id }, data: { name, color } });
    }
    static async deleteTag(id, requestingUserId, role) {
        const tag = await prisma.tag.findUnique({ where: { id } });
        if (!tag)
            throw new Error('Tag not found');
        if (tag.userId !== null && tag.userId !== requestingUserId && role !== 'SYSADMIN')
            throw new Error('Not authorized');
        if (tag.userId === null && role !== 'SYSADMIN')
            throw new Error('Only admins can delete system tags');
        await prisma.tag.delete({ where: { id } });
        return { success: true };
    }
    static async addTagToFile(fileId, tagId, userId) {
        const file = await prisma.file.findFirst({ where: { id: fileId, userId, isDeleted: false } });
        if (!file)
            throw new Error('File not found');
        const tag = await prisma.tag.findFirst({ where: { id: tagId, OR: [{ userId: null }, { userId }] } });
        if (!tag)
            throw new Error('Tag not found or not accessible');
        await prisma.fileTag.upsert({
            where: { fileId_tagId: { fileId, tagId } },
            create: { fileId, tagId },
            update: {},
        });
        return { success: true };
    }
    static async removeTagFromFile(fileId, tagId, userId) {
        const file = await prisma.file.findFirst({ where: { id: fileId, userId, isDeleted: false } });
        if (!file)
            throw new Error('File not found');
        await prisma.fileTag.delete({ where: { fileId_tagId: { fileId, tagId } } });
        return { success: true };
    }
}
exports.TagService = TagService;
//# sourceMappingURL=tag.service.js.map