import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

export class FileService {
  static async uploadFile(userId: number, file: Express.Multer.File, folderId?: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageQuota: true, storageUsed: true },
    });

    if (!user) throw new Error('User not found');

    const newUsed = user.storageUsed + BigInt(file.size);
    if (newUsed > user.storageQuota) {
      fs.unlinkSync(file.path);
      throw new Error('Storage quota exceeded');
    }

    const existingFile = await prisma.file.findFirst({
      where: { userId, originalName: file.originalname, folderId: folderId || null, isDeleted: false },
    });
    if (existingFile) {
      fs.unlinkSync(file.path);
      throw new Error('A file with this name already exists in this folder');
    }

    const fileHash = await this.computeFileHash(file.path);

    const [fileRecord] = await prisma.$transaction([
      prisma.file.create({
        data: {
          userId,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: BigInt(file.size),
          mimeType: file.mimetype,
          folderId: folderId || null,
          fileHash,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { increment: BigInt(file.size) } },
      }),
    ]);

    return {
      id: fileRecord.id,
      fileName: fileRecord.fileName,
      originalName: fileRecord.originalName,
      fileSize: fileRecord.fileSize.toString(),
      mimeType: fileRecord.mimeType,
      uploadDate: fileRecord.uploadDate,
    };
  }

  static async getUserFiles(userId: number, page: number = 1, limit: number = 20, includeDeleted: boolean = false, folderId?: number, sortBy: string = 'uploadDate', sortDir: 'asc' | 'desc' = 'desc') {
    const where: any = { userId, folderId: folderId ?? null };
    if (!includeDeleted) {
      where.isDeleted = false;
    }

    const sortFieldMap: Record<string, string> = {
      'name': 'originalName',
      'size': 'fileSize',
      'uploadDate': 'uploadDate',
      'type': 'mimeType',
    };
    const orderField = sortFieldMap[sortBy] || 'uploadDate';

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortDir },
        include: { fileTags: { include: { tag: true } } },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files: files.map(f => ({
        ...f,
        fileSize: f.fileSize.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getTrashFiles(userId: number, page: number = 1, limit: number = 20) {
    // Only show orphan trashed files (folderId is null or folder is NOT deleted)
    const allTrashed = await prisma.file.findMany({
      where: { userId, isDeleted: true, pendingPurge: false },
      include: { folder: { select: { isDeleted: true } } },
      orderBy: { deletedAt: 'desc' },
    });

    const orphans = allTrashed.filter(f => !f.folderId || !f.folder?.isDeleted);
    const total = orphans.length;
    const paged = orphans.slice((page - 1) * limit, page * limit);

    return {
      files: paged.map(({ folder: _f, ...rest }) => ({
        ...rest,
        fileSize: rest.fileSize.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getFileById(fileId: number) {
    return prisma.file.findUnique({ where: { id: fileId } });
  }

  static async softDeleteFile(fileId: number, userId: number) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) throw new Error('File not found');

    await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return { success: true };
  }

  static async restoreFile(fileId: number, userId: number) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: true },
    });

    if (!file) throw new Error('File not found in trash');

    await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: false, deletedAt: null },
    });

    return { success: true };
  }

  static async permanentDeleteFile(fileId: number, userId: number) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) throw new Error('File not found');

    await prisma.$transaction([
      prisma.file.update({
        where: { id: fileId },
        data: {
          pendingPurge: true,
          purgeAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isDeleted: true,
          deletedAt: file.deletedAt || new Date(),
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { decrement: file.fileSize } },
      }),
    ]);

    await NotificationService.createForAdmins(
      `File pending deletion: "${file.originalName}"`,
      `A user permanently deleted a file. It will be purged in 30 days unless recovered by an admin.`
    );

    return { success: true };
  }

  static async emptyTrash(userId: number) {
    const files = await prisma.file.findMany({
      where: { userId, isDeleted: true, pendingPurge: false },
    });

    if (files.length === 0) return { deleted: 0 };

    const totalSize = files.reduce((sum, f) => sum + f.fileSize, BigInt(0));

    await prisma.$transaction([
      prisma.file.updateMany({
        where: { id: { in: files.map(f => f.id) } },
        data: {
          pendingPurge: true,
          purgeAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { decrement: totalSize } },
      }),
    ]);

    return { deleted: files.length };
  }

  static async getStorageUsage(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageQuota: true },
    });

    if (!user) throw new Error('User not found');

    const fileAgg = await prisma.file.aggregate({
      where: { userId, pendingPurge: false },
      _sum: { fileSize: true },
    });

    const storageUsed = fileAgg._sum.fileSize ?? BigInt(0);
    const storageQuota = user.storageQuota;

    return {
      storageQuota: storageQuota.toString(),
      storageUsed: storageUsed.toString(),
      storageRemaining: (storageQuota - storageUsed).toString(),
      percentUsed: Number((storageUsed * BigInt(100)) / (storageQuota || BigInt(1))),
    };
  }

  static async hasSharedAccess(fileId: number, userId: number, requiredPermission: 'VIEW' | 'DOWNLOAD' = 'VIEW'): Promise<boolean> {
    const share = await prisma.fileShare.findFirst({
      where: { fileId, sharedWithUserId: userId },
    });

    if (share) {
      if (requiredPermission === 'DOWNLOAD') return share.permission === 'DOWNLOAD';
      return true;
    }

    // Check folder shares by walking up the folder tree
    const file = await prisma.file.findUnique({ where: { id: fileId }, select: { folderId: true } });
    if (file?.folderId) {
      let currentFolderId: number | null = file.folderId;
      while (currentFolderId !== null) {
        const folderShare = await prisma.folderShare.findFirst({
          where: { folderId: currentFolderId, sharedWithUserId: userId },
        });
        if (folderShare) {
          if (requiredPermission === 'DOWNLOAD') return folderShare.permission === 'DOWNLOAD';
          return true;
        }
        const folderRec: { parentId: number | null } | null = await prisma.folder.findUnique({ where: { id: currentFolderId }, select: { parentId: true } });
        currentFolderId = folderRec?.parentId ?? null;
      }
    }

    return false;
  }

  static async renameFile(fileId: number, userId: number, newName: string, userRole: string = 'USER') {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });
    if (!file) throw new Error('File not found');

    const oldExt = path.extname(file.originalName).toLowerCase();
    const newExt = path.extname(newName).toLowerCase();
    if (oldExt !== newExt && userRole !== 'SYSADMIN') {
      throw new Error('File extension cannot be changed');
    }

    const existing = await prisma.file.findFirst({
      where: { userId, originalName: newName, folderId: file.folderId, isDeleted: false, id: { not: fileId } },
    });
    if (existing) throw new Error('A file with this name already exists in this folder');

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { originalName: newName },
    });
    return { ...updated, fileSize: updated.fileSize.toString() };
  }

  static async moveFile(fileId: number, userId: number, targetFolderId: number | null) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });
    if (!file) throw new Error('File not found');

    if (targetFolderId !== null) {
      const folder = await prisma.folder.findFirst({ where: { id: targetFolderId, userId } });
      if (!folder) throw new Error('Target folder not found');
    }

    const existing = await prisma.file.findFirst({
      where: { userId, originalName: file.originalName, folderId: targetFolderId, isDeleted: false, id: { not: fileId } },
    });
    if (existing) throw new Error('A file with this name already exists in the destination folder');

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { folderId: targetFolderId },
    });
    return { ...updated, fileSize: updated.fileSize.toString() };
  }

  static async searchFiles(userId: number, query: string, fileType?: string, dateFrom?: string, dateTo?: string, sizeMinMB?: number, sizeMaxMB?: number, tagIds?: number[]) {
    const fileWhere: any = {
      userId,
      isDeleted: false,
      originalName: { contains: query },
    };
    if (fileType === '__other__') {
      fileWhere.AND = [
        { mimeType: { not: { startsWith: 'image/' } } },
        { mimeType: { not: { startsWith: 'video/' } } },
        { mimeType: { not: { startsWith: 'audio/' } } },
        { mimeType: { not: { contains: 'pdf' } } },
        { mimeType: { not: { contains: 'document' } } },
        { mimeType: { not: { contains: 'text' } } },
        { mimeType: { not: { contains: 'spreadsheet' } } },
        { mimeType: { not: { contains: 'csv' } } },
        { mimeType: { not: { contains: 'excel' } } },
        { mimeType: { not: { contains: 'zip' } } },
        { mimeType: { not: { contains: 'rar' } } },
        { mimeType: { not: { contains: 'tar' } } },
        { mimeType: { not: { contains: 'compress' } } },
      ];
    } else if (fileType) {
      fileWhere.mimeType = { startsWith: fileType };
    }
    if (dateFrom || dateTo) {
      fileWhere.uploadDate = {};
      if (dateFrom) fileWhere.uploadDate.gte = new Date(dateFrom);
      if (dateTo) fileWhere.uploadDate.lte = new Date(dateTo);
    }
    if (sizeMinMB !== undefined || sizeMaxMB !== undefined) {
      fileWhere.fileSize = {};
      if (sizeMinMB !== undefined) fileWhere.fileSize.gte = BigInt(Math.round(sizeMinMB * 1024 * 1024));
      if (sizeMaxMB !== undefined) fileWhere.fileSize.lte = BigInt(Math.round(sizeMaxMB * 1024 * 1024));
    }
    if (tagIds && tagIds.length > 0) {
      fileWhere.fileTags = { some: { tagId: { in: tagIds } } };
    }

    const [files, folders] = await Promise.all([
      prisma.file.findMany({
        where: fileWhere,
        take: 50,
        orderBy: { uploadDate: 'desc' },
        include: { folder: { select: { id: true, name: true } }, fileTags: { include: { tag: true } } },
      }),
      prisma.folder.findMany({
        where: { userId, name: { contains: query } },
        take: 20,
        orderBy: { name: 'asc' },
        include: { parent: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      files: files.map(f => ({ ...f, fileSize: f.fileSize.toString() })),
      folders,
    };
  }

  static async bulkDelete(fileIds: number[], userId: number) {
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds }, userId, isDeleted: false },
    });
    if (files.length === 0) throw new Error('No files found');

    await prisma.file.updateMany({
      where: { id: { in: files.map(f => f.id) } },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { deleted: files.length };
  }

  static async bulkMove(fileIds: number[], userId: number, targetFolderId: number | null) {
    if (targetFolderId !== null) {
      const folder = await prisma.folder.findFirst({ where: { id: targetFolderId, userId } });
      if (!folder) throw new Error('Target folder not found');
    }

    const files = await prisma.file.findMany({
      where: { id: { in: fileIds }, userId, isDeleted: false },
    });
    if (files.length === 0) throw new Error('No files found');

    await prisma.file.updateMany({
      where: { id: { in: files.map(f => f.id) } },
      data: { folderId: targetFolderId },
    });
    return { moved: files.length };
  }

  static async getBulkFiles(fileIds: number[], userId: number) {
    return prisma.file.findMany({
      where: { id: { in: fileIds }, userId, isDeleted: false },
    });
  }

  static async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  static async checkDuplicate(userId: number, fileHash: string) {
    const existing = await prisma.file.findFirst({
      where: { userId, fileHash, isDeleted: false },
      select: { id: true, originalName: true, fileSize: true, uploadDate: true },
    });
    return existing
      ? { isDuplicate: true, existingFile: { ...existing, fileSize: existing.fileSize.toString() } }
      : { isDuplicate: false };
  }

  static async deleteAllInFolder(userId: number, folderId?: number) {
    const result = await prisma.file.updateMany({
      where: { userId, isDeleted: false, folderId: folderId ?? null },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { deleted: result.count };
  }

  static async getRecentFiles(userId: number, limit: number = 20) {
    const files = await prisma.file.findMany({
      where: { userId, isDeleted: false },
      orderBy: { uploadDate: 'desc' },
      take: limit,
    });

    const mapped = files.map(f => ({
      ...f,
      fileSize: f.fileSize.toString(),
    }));

    return { files: mapped, total: mapped.length };
  }

  static async getStarredFiles(userId: number, page: number = 1, limit: number = 20) {
    const where = { userId, isDeleted: false, isStarred: true };

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploadDate: 'desc' },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files: files.map(f => ({
        ...f,
        fileSize: f.fileSize.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async toggleStar(fileId: number, userId: number) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) throw new Error('File not found');

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { isStarred: !file.isStarred },
    });

    return { ...updated, fileSize: updated.fileSize.toString() };
  }

  static async updateLastAccessed(fileId: number) {
    try {
      await prisma.file.update({
        where: { id: fileId },
        data: { lastAccessedAt: new Date() },
      });
    } catch {
      // Don't throw if file not found
    }
  }

  static async getUserDashboard(userId: number) {
    const [user, totalFiles, recentFiles, fileTypes, sharedCount, starredCount, duplicateGroups, fileAgg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { storageQuota: true },
      }),
      prisma.file.count({ where: { userId, isDeleted: false } }),
      prisma.file.findMany({
        where: { userId, isDeleted: false },
        orderBy: { uploadDate: 'desc' },
        take: 5,
        select: { id: true, originalName: true, fileSize: true, mimeType: true, uploadDate: true },
      }),
      prisma.file.groupBy({
        by: ['mimeType'],
        where: { userId, isDeleted: false },
        _count: true,
        _sum: { fileSize: true },
      }),
      prisma.fileShare.count({ where: { sharedByUserId: userId } }),
      prisma.file.count({ where: { userId, isDeleted: false, isStarred: true } }),
      prisma.file.groupBy({
        by: ['fileHash'],
        where: { userId, isDeleted: false, fileHash: { not: null } },
        having: { fileHash: { _count: { gt: 1 } } },
        _count: { fileHash: true },
      }),
      prisma.file.aggregate({
        where: { userId, pendingPurge: false },
        _sum: { fileSize: true },
      }),
    ]);

    const storageUsed = fileAgg._sum.fileSize ?? BigInt(0);
    const duplicateCount = duplicateGroups.reduce((sum, g) => sum + g._count.fileHash, 0);

    const typeBreakdown = fileTypes.map(t => ({
      mimeType: t.mimeType,
      count: t._count,
      totalSize: (t._sum.fileSize || BigInt(0)).toString(),
    }));

    return {
      storageQuota: (user?.storageQuota || BigInt(0)).toString(),
      storageUsed: storageUsed.toString(),
      totalFiles,
      recentFiles: recentFiles.map(f => ({
        ...f,
        fileSize: f.fileSize.toString(),
      })),
      fileTypes: typeBreakdown,
      sharedCount,
      starredCount,
      duplicateCount,
    };
  }

  static async getDuplicateFiles(userId: number, page: number = 1, limit: number = 50) {
    const duplicateGroups = await prisma.file.groupBy({
      by: ['fileHash'],
      where: { userId, isDeleted: false, fileHash: { not: null } },
      having: { fileHash: { _count: { gt: 1 } } },
      _count: { fileHash: true },
    });

    const hashes = duplicateGroups.map(g => g.fileHash as string);
    if (hashes.length === 0) {
      return { files: [], total: 0, page, totalPages: 0 };
    }

    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { userId, isDeleted: false, fileHash: { in: hashes } },
        orderBy: [{ fileHash: 'asc' }, { uploadDate: 'asc' }],
        take: limit,
        skip,
        select: {
          id: true, originalName: true, fileSize: true, mimeType: true,
          uploadDate: true, fileHash: true,
          folder: { select: { id: true, name: true } },
        },
      }),
      prisma.file.count({ where: { userId, isDeleted: false, fileHash: { in: hashes } } }),
    ]);

    return {
      files: files.map(f => ({ ...f, fileSize: f.fileSize.toString() })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getFileAccessLog(fileId: number, ownerUserId: number, page: number = 1, limit: number = 20) {
    const file = await prisma.file.findFirst({ where: { id: fileId, userId: ownerUserId } });
    if (!file) throw new Error('File not found or access denied');

    const where = {
      resourceType: 'FILE',
      resourceId: fileId,
      actionType: { in: ['FILE_DOWNLOAD', 'FILE_PREVIEW'] },
    };

    const [logs, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, username: true } } },
      }),
      prisma.userActivity.count({ where }),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
}
