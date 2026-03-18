import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

export class TrashCleanupService {
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
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }

        await prisma.$transaction([
          prisma.file.delete({ where: { id: file.id } }),
          prisma.user.update({
            where: { id: file.userId },
            data: { storageUsed: { decrement: file.fileSize } },
          }),
        ]);

        deletedCount++;
      } catch (err) {
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
        if (fs.existsSync(f.filePath)) {
          fs.unlinkSync(f.filePath);
        }
        await prisma.file.delete({ where: { id: f.id } });
        purgedCount++;
      } catch (err) {
        console.error(`Failed to purge file ${f.id}:`, err);
      }
    }

    if (purgedCount > 0) {
      console.log(`Purge cleanup: permanently deleted ${purgedCount} files past recovery window`);
    }

    return { deletedCount, purgedCount };
  }
}
