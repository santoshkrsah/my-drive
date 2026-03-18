import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

export class UserCleanupService {
  static async cleanupScheduledDeletions() {
    const users = await prisma.user.findMany({
      where: { status: 'DELETED', scheduledDeletionAt: { lte: new Date() } },
    });

    let deleted = 0;

    for (const user of users) {
      try {
        const files = await prisma.file.findMany({ where: { userId: user.id } });
        for (const f of files) {
          if (fs.existsSync(f.filePath)) {
            fs.unlinkSync(f.filePath);
          }
        }
        await prisma.user.delete({ where: { id: user.id } });
        deleted++;
      } catch (err) {
        console.error(`Failed to cleanup user ${user.id}:`, err);
      }
    }

    if (deleted > 0) {
      console.log(`User cleanup: permanently deleted ${deleted} scheduled user(s)`);
    }

    return { deleted };
  }
}
