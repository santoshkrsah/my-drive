"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrashCleanupService = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
class TrashCleanupService {
    static async cleanupExpiredTrash() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // Cleanup old trash files (auto-expire after 30 days, not yet pendingPurge)
        const expiredFiles = await prisma.file.findMany({
            where: {
                isDeleted: true,
                deletedAt: { lt: thirtyDaysAgo },
                pendingPurge: false,
            },
        });
        let deletedCount = 0;
        for (const file of expiredFiles) {
            try {
                if (fs_1.default.existsSync(file.filePath)) {
                    fs_1.default.unlinkSync(file.filePath);
                }
                await prisma.$transaction([
                    prisma.file.delete({ where: { id: file.id } }),
                    prisma.user.update({
                        where: { id: file.userId },
                        data: { storageUsed: { decrement: file.fileSize } },
                    }),
                ]);
                deletedCount++;
            }
            catch (err) {
                console.error(`Failed to cleanup file ${file.id}:`, err);
            }
        }
        if (deletedCount > 0) {
            console.log(`Trash cleanup: permanently deleted ${deletedCount} files older than 30 days`);
        }
        // Cleanup expired pendingPurge files (admin recovery window has passed)
        const expiredPurge = await prisma.file.findMany({
            where: { pendingPurge: true, purgeAfter: { lt: new Date() } },
        });
        let purgedCount = 0;
        for (const f of expiredPurge) {
            try {
                if (fs_1.default.existsSync(f.filePath)) {
                    fs_1.default.unlinkSync(f.filePath);
                }
                await prisma.file.delete({ where: { id: f.id } });
                purgedCount++;
            }
            catch (err) {
                console.error(`Failed to purge file ${f.id}:`, err);
            }
        }
        if (purgedCount > 0) {
            console.log(`Purge cleanup: permanently deleted ${purgedCount} files past recovery window`);
        }
        return { deletedCount, purgedCount };
    }
}
exports.TrashCleanupService = TrashCleanupService;
//# sourceMappingURL=trash-cleanup.service.js.map