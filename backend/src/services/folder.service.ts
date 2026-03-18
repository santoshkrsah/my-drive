import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FolderService {
  static async getOrCreateFolder(userId: number, name: string, parentId?: number): Promise<{ id: number; name: string }> {
    const existing = await prisma.folder.findFirst({
      where: { userId, name, parentId: parentId ?? null, isDeleted: false },
    });
    if (existing) return existing;
    return await prisma.folder.create({
      data: { userId, name, parentId: parentId ?? null },
    });
  }

  static async createFolder(userId: number, name: string, parentId?: number) {
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, userId },
      });

      if (!parentFolder) {
        throw new Error('Parent folder not found');
      }
    }

    const existing = await prisma.folder.findFirst({
      where: { userId, name, parentId: parentId || null, isDeleted: false },
    });
    if (existing) {
      throw new Error('A folder with this name already exists');
    }

    const folder = await prisma.folder.create({
      data: {
        userId,
        name,
        parentId: parentId || null,
      },
    });

    return folder;
  }

  static async getFolderContents(userId: number, folderId?: number) {
    const folderWhere = folderId
      ? { parentId: folderId, userId, isDeleted: false }
      : { parentId: null, userId, isDeleted: false };

    const [folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: folderWhere,
        orderBy: { name: 'asc' },
      }),
      prisma.file.findMany({
        where: {
          folderId: folderId || null,
          userId,
          isDeleted: false,
        },
        orderBy: { uploadDate: 'desc' },
      }),
    ]);

    const folderIds = folders.map(f => f.id);
    const sizeMap = folderIds.length > 0 ? await this.getFolderSizes(folderIds) : {};

    return {
      folders: folders.map(f => ({ ...f, size: sizeMap[f.id] ?? '0' })),
      files: files.map(f => ({
        ...f,
        fileSize: f.fileSize.toString(),
      })),
    };
  }

  private static async getFolderSizes(folderIds: number[]): Promise<Record<number, string>> {
    const sizes = await prisma.file.groupBy({
      by: ['folderId'],
      where: { folderId: { in: folderIds }, isDeleted: false },
      _sum: { fileSize: true },
    });
    return Object.fromEntries(
      sizes.map(s => [s.folderId!, s._sum.fileSize?.toString() ?? '0'])
    );
  }

  static async renameFolder(folderId: number, userId: number, newName: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const existing = await prisma.folder.findFirst({
      where: { userId, name: newName, parentId: folder.parentId, id: { not: folderId }, isDeleted: false },
    });
    if (existing) {
      throw new Error('A folder with this name already exists');
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { name: newName },
    });

    return updated;
  }

  static async deleteFolder(folderId: number, userId: number) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: false },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const now = new Date();
    await this.softDeleteFolderRecursive(folderId, userId, now);

    return { success: true };
  }

  private static async softDeleteFolderRecursive(folderId: number, userId: number, deletedAt: Date) {
    // Soft-delete all files in this folder
    await prisma.file.updateMany({
      where: { folderId, userId, isDeleted: false },
      data: { isDeleted: true, deletedAt },
    });

    // Find all child folders
    const childFolders = await prisma.folder.findMany({
      where: { parentId: folderId, userId, isDeleted: false },
    });

    // Recursively soft-delete each child folder
    for (const child of childFolders) {
      await this.softDeleteFolderRecursive(child.id, userId, deletedAt);
    }

    // Soft-delete the folder itself
    await prisma.folder.update({
      where: { id: folderId },
      data: { isDeleted: true, deletedAt },
    });
  }

  static async restoreFolder(folderId: number, userId: number) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: true },
    });

    if (!folder) {
      throw new Error('Folder not found in trash');
    }

    const deletedAt = folder.deletedAt;
    await this.restoreFolderRecursive(folderId, userId, deletedAt);

    return { success: true };
  }

  private static async restoreFolderRecursive(folderId: number, userId: number, deletedAt: Date | null) {
    // Restore the folder itself
    await prisma.folder.update({
      where: { id: folderId },
      data: { isDeleted: false, deletedAt: null },
    });

    // Restore files that were deleted at the same time (part of the folder delete)
    const fileWhere: any = { folderId, userId, isDeleted: true };
    if (deletedAt) {
      fileWhere.deletedAt = { gte: deletedAt };
    }
    await prisma.file.updateMany({
      where: fileWhere,
      data: { isDeleted: false, deletedAt: null },
    });

    // Find child folders that were deleted at the same time
    const childWhere: any = { parentId: folderId, userId, isDeleted: true };
    if (deletedAt) {
      childWhere.deletedAt = { gte: deletedAt };
    }
    const childFolders = await prisma.folder.findMany({ where: childWhere });

    for (const child of childFolders) {
      await this.restoreFolderRecursive(child.id, userId, deletedAt);
    }
  }

  static async permanentDeleteFolder(folderId: number, userId: number) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: true },
    });

    if (!folder) {
      throw new Error('Folder not found in trash');
    }

    await this.permanentDeleteFolderRecursive(folderId, userId);

    return { success: true };
  }

  private static async permanentDeleteFolderRecursive(folderId: number, userId: number) {
    // Find all files in this folder
    const files = await prisma.file.findMany({
      where: { folderId, userId },
    });

    const totalFileSize = files.reduce((sum, f) => sum + f.fileSize, BigInt(0));

    // Mark files as pending purge so they appear in admin's Recoverable Files
    if (files.length > 0) {
      await prisma.file.updateMany({
        where: { id: { in: files.map(f => f.id) } },
        data: {
          pendingPurge: true,
          purgeAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isDeleted: true,
        },
      });
    }

    // Decrement storage for these files
    if (totalFileSize > BigInt(0)) {
      await prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { decrement: totalFileSize } },
      });
    }

    // Find all child folders
    const childFolders = await prisma.folder.findMany({
      where: { parentId: folderId, userId },
    });

    // Recursively permanent-delete each child folder
    for (const child of childFolders) {
      await this.permanentDeleteFolderRecursive(child.id, userId);
    }

    // Mark folder as pending purge so admin can recover within 30 days
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        pendingPurge: true,
        purgeAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isDeleted: true,
      },
    });
  }

  static async getTrashFolders(userId: number, page: number = 1, limit: number = 20) {
    // Only show top-level trashed folders (parent is null or parent is NOT deleted), exclude pendingPurge
    const allTrashed = await prisma.folder.findMany({
      where: { userId, isDeleted: true, pendingPurge: false },
      include: { parent: { select: { isDeleted: true } } },
      orderBy: { deletedAt: 'desc' },
    });

    const topLevel = allTrashed.filter(f => !f.parentId || !f.parent?.isDeleted);
    const total = topLevel.length;
    const paged = topLevel.slice((page - 1) * limit, page * limit);

    return {
      folders: paged.map(({ parent: _p, ...rest }) => rest),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getTrashFolderContents(userId: number, folderId: number) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: true },
    });
    if (!folder) throw new Error('Folder not found in trash');

    const [childFolders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { parentId: folderId, userId, isDeleted: true, pendingPurge: false },
        orderBy: { name: 'asc' },
      }),
      prisma.file.findMany({
        where: { folderId, userId, isDeleted: true, pendingPurge: false },
        orderBy: { originalName: 'asc' },
      }),
    ]);

    return {
      folders: childFolders,
      files: files.map(f => ({ ...f, fileSize: f.fileSize.toString() })),
    };
  }

  static async getFolderBreadcrumb(folderId: number) {
    const breadcrumb: { id: number; name: string }[] = [];

    let currentId: number | null = folderId;

    while (currentId !== null) {
      const found: { id: number; name: string; parentId: number | null } | null = await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });

      if (!found) break;

      breadcrumb.unshift({ id: found.id, name: found.name });
      currentId = found.parentId;
    }

    return breadcrumb;
  }

  static async moveFolder(folderId: number, userId: number, targetParentId: number | null) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId, isDeleted: false } });
    if (!folder) throw new Error('Folder not found');

    if (targetParentId === folderId) throw new Error('Cannot move folder into itself');

    if (targetParentId !== null) {
      const targetFolder = await prisma.folder.findFirst({ where: { id: targetParentId, userId, isDeleted: false } });
      if (!targetFolder) throw new Error('Target folder not found');

      // Prevent moving into own descendant
      let currentId: number | null = targetParentId;
      while (currentId !== null) {
        if (currentId === folderId) throw new Error('Cannot move folder into its own subfolder');
        const parent: { parentId: number | null } | null = await prisma.folder.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });
        currentId = parent?.parentId ?? null;
      }
    }

    const existingInTarget = await prisma.folder.findFirst({
      where: { userId, name: folder.name, parentId: targetParentId, id: { not: folderId }, isDeleted: false },
    });
    if (existingInTarget) {
      throw new Error('A folder with this name already exists in the destination');
    }

    return prisma.folder.update({
      where: { id: folderId },
      data: { parentId: targetParentId },
    });
  }

  static async getAllFolders(userId: number) {
    return prisma.folder.findMany({
      where: { userId, isDeleted: false },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, parentId: true },
    });
  }

  static async bulkDelete(folderIds: number[], userId: number) {
    const now = new Date();
    let deleted = 0;
    for (const folderId of folderIds) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId, isDeleted: false },
      });
      if (folder) {
        await this.softDeleteFolderRecursive(folderId, userId, now);
        deleted++;
      }
    }
    return { deleted };
  }

  static async emptyTrash(userId: number) {
    const trashedFolders = await prisma.folder.findMany({
      where: { userId, isDeleted: true },
    });

    // Get top-level trashed folders (parent null or parent not deleted)
    const topLevel = [];
    for (const folder of trashedFolders) {
      if (!folder.parentId) {
        topLevel.push(folder);
      } else {
        const parent = trashedFolders.find(f => f.id === folder.parentId);
        if (!parent) {
          topLevel.push(folder);
        }
      }
    }

    for (const folder of topLevel) {
      await this.permanentDeleteFolderRecursive(folder.id, userId);
    }

    return { deleted: topLevel.length };
  }
}
