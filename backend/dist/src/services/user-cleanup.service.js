"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCleanupService = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
class UserCleanupService {
    static async cleanupScheduledDeletions() {
        const users = await prisma.user.findMany({
            where: { status: 'DELETED', scheduledDeletionAt: { lte: new Date() } },
        });
        let deleted = 0;
        for (const user of users) {
            try {
                const files = await prisma.file.findMany({ where: { userId: user.id } });
                for (const f of files) {
                    if (fs_1.default.existsSync(f.filePath)) {
                        fs_1.default.unlinkSync(f.filePath);
                    }
                }
                await prisma.user.delete({ where: { id: user.id } });
                deleted++;
            }
            catch (err) {
                console.error(`Failed to cleanup user ${user.id}:`, err);
            }
        }
        if (deleted > 0) {
            console.log(`User cleanup: permanently deleted ${deleted} scheduled user(s)`);
        }
        return { deleted };
    }
}
exports.UserCleanupService = UserCleanupService;
//# sourceMappingURL=user-cleanup.service.js.map