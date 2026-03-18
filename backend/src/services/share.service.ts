import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ShareService {
  static async shareFile(fileId: number, sharedByUserId: number, username: string, permission: string = 'VIEW') {
    const targetUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!targetUser) throw new Error('User not found');

    if (targetUser.id === sharedByUserId) throw new Error('Cannot share a file with yourself');

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: sharedByUserId, isDeleted: false },
    });

    if (!file) throw new Error('File not found');

    const share = await prisma.fileShare.create({
      data: {
        fileId,
        sharedByUserId,
        sharedWithUserId: targetUser.id,
        permission,
      },
      include: {
        file: true,
        sharedWith: { select: { id: true, name: true, username: true, email: true } },
      },
    });

    return {
      ...share,
      file: {
        ...share.file,
        fileSize: share.file.fileSize.toString(),
      },
    };
  }

  static async getSharedWithMe(userId: number, page: number = 1, limit: number = 20) {
    const where = { sharedWithUserId: userId };

    const [shares, total, folderShares] = await Promise.all([
      prisma.fileShare.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          file: {
            include: {
              user: { select: { id: true, name: true, username: true, email: true } },
            },
          },
          sharedBy: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
      prisma.fileShare.count({ where }),
      prisma.folderShare.findMany({
        where: { sharedWithUserId: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: true,
          sharedBy: { select: { id: true, name: true, username: true, email: true } },
          sharedWith: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
    ]);

    return {
      shares: shares.map(s => ({
        ...s,
        file: {
          ...s.file,
          fileSize: s.file.fileSize.toString(),
        },
      })),
      folderShares,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getSharedByMe(userId: number, page: number = 1, limit: number = 20) {
    const where = { sharedByUserId: userId };

    const [shares, total, folderShares] = await Promise.all([
      prisma.fileShare.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          file: true,
          sharedWith: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
      prisma.fileShare.count({ where }),
      prisma.folderShare.findMany({
        where: { sharedByUserId: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: true,
          sharedBy: { select: { id: true, name: true, username: true, email: true } },
          sharedWith: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
    ]);

    return {
      shares: shares.map(s => ({
        ...s,
        file: {
          ...s.file,
          fileSize: s.file.fileSize.toString(),
        },
      })),
      folderShares,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getFileShares(fileId: number, userId: number) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) throw new Error('File not found');

    const shares = await prisma.fileShare.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
      include: {
        sharedWith: { select: { id: true, name: true, username: true, email: true } },
      },
    });

    return { shares };
  }

  static async removeShare(shareId: number, userId: number) {
    const share = await prisma.fileShare.findFirst({
      where: { id: shareId, sharedByUserId: userId },
    });

    if (!share) throw new Error('Share not found');

    await prisma.fileShare.delete({ where: { id: shareId } });

    return { success: true };
  }

  static async shareFolder(folderId: number, sharedByUserId: number, username: string, permission: string = 'VIEW') {
    const targetUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!targetUser) throw new Error('User not found');
    if (targetUser.id === sharedByUserId) throw new Error('Cannot share a folder with yourself');

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId: sharedByUserId },
    });

    if (!folder) throw new Error('Folder not found');

    const share = await prisma.folderShare.create({
      data: {
        folderId,
        sharedByUserId,
        sharedWithUserId: targetUser.id,
        permission,
      },
      include: {
        folder: true,
        sharedWith: { select: { id: true, name: true, username: true, email: true } },
      },
    });

    return share;
  }

  static async getFolderShares(folderId: number, userId: number) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) throw new Error('Folder not found');

    const shares = await prisma.folderShare.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
      include: {
        sharedWith: { select: { id: true, name: true, username: true, email: true } },
      },
    });

    return { shares };
  }

  static async removeFolderShare(shareId: number, userId: number) {
    const share = await prisma.folderShare.findFirst({
      where: { id: shareId, sharedByUserId: userId },
    });

    if (!share) throw new Error('Share not found');

    await prisma.folderShare.delete({ where: { id: shareId } });
    return { success: true };
  }

  static async getSharedFolders(userId: number, page: number = 1, limit: number = 20) {
    const where = { sharedWithUserId: userId };

    const [shares, total] = await Promise.all([
      prisma.folderShare.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: true,
          sharedBy: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
      prisma.folderShare.count({ where }),
    ]);

    return {
      shares,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
