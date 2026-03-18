import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../services/user.service';
import { FileService } from '../services/file.service';
import { LogService } from '../services/log.service';
import { AuthService } from '../services/auth.service';
import fs from 'fs';

const prisma = new PrismaClient();

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.ip;
  return ip || '';
}

export class AdminController {
  static async dashboard(_req: Request, res: Response): Promise<void> {
    try {
      const [totalUsers, activeUsers, bannedUsers, totalFiles, storageUsedAgg, quotaAgg, duplicateGroups] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'BANNED' } }),
        prisma.file.count({ where: { isDeleted: false } }),
        prisma.file.aggregate({
          where: { pendingPurge: false },
          _sum: { fileSize: true },
        }),
        prisma.user.aggregate({
          where: { status: 'ACTIVE' },
          _sum: { storageQuota: true },
        }),
        prisma.file.groupBy({
          by: ['fileHash'],
          where: { isDeleted: false, fileHash: { not: null } },
          having: { fileHash: { _count: { gt: 1 } } },
          _count: { fileHash: true },
        }),
      ]);

      const duplicateCount = duplicateGroups.reduce((sum: number, g: any) => sum + g._count.fileHash, 0);

      res.json({
        totalUsers,
        activeUsers,
        bannedUsers,
        totalFiles,
        duplicateCount,
        totalStorageUsed: (storageUsedAgg._sum.fileSize || BigInt(0)).toString(),
        totalStorageAllocated: (quotaAgg._sum.storageQuota || BigInt(0)).toString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const result = await UserService.getAllUsers(page, limit, search);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, username, password, role, storageQuota, maxUploadSize, maxFilesPerUpload, allowedExtensions } = req.body;

      if (!name || !email || !username || !password) {
        res.status(400).json({ error: 'Name, email, username, and password are required' });
        return;
      }

      const user = await UserService.createUser({
        name,
        email,
        username,
        password,
        role,
        storageQuota: storageQuota ? BigInt(storageQuota) : undefined,
        maxUploadSize: maxUploadSize ? BigInt(maxUploadSize) : undefined,
        maxFilesPerUpload: maxFilesPerUpload ? parseInt(maxFilesPerUpload) : undefined,
        allowedExtensions: allowedExtensions || undefined,
      });

      const adminId = req.user!.impersonatedBy || req.user!.id;
      await LogService.log(adminId, 'CREATE_USER', user.id, `Created user: ${username}`, getIp(req));

      res.status(201).json(user);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'Username or email already exists' });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const { name, email, role, storageQuota, password, maxUploadSize, maxFilesPerUpload, allowedExtensions } = req.body;

      const user = await UserService.updateUser(id, {
        name,
        email,
        role,
        storageQuota: storageQuota ? BigInt(storageQuota) : undefined,
        password,
        maxUploadSize: maxUploadSize !== undefined ? (maxUploadSize ? BigInt(maxUploadSize) : null) : undefined,
        maxFilesPerUpload: maxFilesPerUpload !== undefined ? (maxFilesPerUpload ? parseInt(maxFilesPerUpload) : null) : undefined,
        allowedExtensions: allowedExtensions !== undefined ? (allowedExtensions || null) : undefined,
      });

      const adminId = req.user!.impersonatedBy || req.user!.id;
      await LogService.log(adminId, 'UPDATE_USER', id, `Updated user: ${user.username}`, getIp(req));

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const permanent = req.query.permanent === 'true';
      const delayMinutes = parseInt(req.query.delayMinutes as string) || 60;

      const adminId = req.user!.impersonatedBy || req.user!.id;
      if (id === adminId) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      if (permanent) {
        const userFiles = await prisma.file.findMany({ where: { userId: id } });
        for (const file of userFiles) {
          if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
          }
        }
      }

      const result = await UserService.deleteUser(id, permanent, delayMinutes);

      await LogService.log(
        adminId,
        permanent ? 'PERMANENT_DELETE_USER' : 'SOFT_DELETE_USER',
        id,
        `Deleted user (permanent: ${permanent})`,
        getIp(req)
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async banUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);

      const adminId = req.user!.impersonatedBy || req.user!.id;
      if (id === adminId) {
        res.status(400).json({ error: 'Cannot ban your own account' });
        return;
      }

      await UserService.banUser(id);
      await LogService.log(adminId, 'BAN_USER', id, 'Banned user', getIp(req));

      res.json({ message: 'User banned successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unbanUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);

      await UserService.unbanUser(id);

      const adminId = req.user!.impersonatedBy || req.user!.id;
      await LogService.log(adminId, 'UNBAN_USER', id, 'Unbanned user', getIp(req));

      res.json({ message: 'User unbanned successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async impersonate(req: Request, res: Response): Promise<void> {
    try {
      const targetId = parseInt(req.params.id as string);

      const adminId = req.user!.impersonatedBy || req.user!.id;
      if (targetId === adminId) {
        res.status(400).json({ error: 'Cannot impersonate yourself' });
        return;
      }

      const targetUser = await AuthService.getUserById(targetId);
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const accessToken = AuthService.generateAccessToken({
        userId: targetId,
        role: targetUser.role,
        impersonatedBy: adminId,
      });

      await LogService.log(
        adminId,
        'IMPERSONATE',
        targetId,
        `Admin impersonated user: ${targetUser.username}`,
        getIp(req)
      );

      res.json({
        accessToken,
        user: targetUser,
        impersonatedBy: adminId,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async stopImpersonation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.impersonatedBy) {
        res.status(400).json({ error: 'Not currently impersonating' });
        return;
      }

      const adminId = req.user.impersonatedBy;
      const admin = await AuthService.getUserById(adminId);
      if (!admin) {
        res.status(404).json({ error: 'Admin user not found' });
        return;
      }

      const accessToken = AuthService.generateAccessToken({
        userId: adminId,
        role: admin.role,
      });

      await LogService.log(adminId, 'STOP_IMPERSONATION', req.user.id, 'Admin stopped impersonation', getIp(req));

      res.json({
        accessToken,
        user: admin,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserFiles(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await FileService.getUserFiles(userId, page, limit, true);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const actionType = req.query.actionType as string | undefined;

      const result = await LogService.getLogs(page, limit, actionType);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async clearLogs(req: Request, res: Response): Promise<void> {
    try {
      await LogService.clearLogs();
      res.json({ success: true, message: 'All logs cleared successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async listRecoverableFiles(req: Request, res: Response): Promise<void> {
    try {
      // Standalone files (not inside a pendingPurge folder)
      const fileWhere = {
        pendingPurge: true,
        OR: [{ folderId: null }, { folder: { pendingPurge: false } }],
      };
      // Top-level pending-purge folders (parent is not also pendingPurge)
      const folderWhere = {
        pendingPurge: true,
        OR: [{ parentId: null }, { parent: { pendingPurge: false } }],
      };

      const [files, folders] = await Promise.all([
        prisma.file.findMany({
          where: fileWhere,
          orderBy: { purgeAfter: 'asc' },
          include: { user: { select: { id: true, name: true, username: true, email: true } } },
        }),
        prisma.folder.findMany({
          where: folderWhere,
          orderBy: { purgeAfter: 'asc' },
          include: { user: { select: { id: true, name: true, username: true, email: true } } },
        }),
      ]);

      res.json({
        files: files.map(f => ({ ...f, fileSize: f.fileSize.toString() })),
        folders,
        total: files.length + folders.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async recoverFile(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const file = await prisma.file.findFirst({ where: { id, pendingPurge: true } });
      if (!file) { res.status(404).json({ error: 'File not found' }); return; }

      await prisma.$transaction([
        prisma.file.update({
          where: { id },
          data: { pendingPurge: false, purgeAfter: null },
        }),
        prisma.user.update({
          where: { id: file.userId },
          data: { storageUsed: { increment: file.fileSize } },
        }),
      ]);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async recoverFolder(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const folder = await prisma.folder.findFirst({ where: { id, pendingPurge: true } });
      if (!folder) { res.status(404).json({ error: 'Folder not found' }); return; }

      const recoverRecursive = async (folderId: number, userId: number) => {
        const files = await prisma.file.findMany({ where: { folderId, userId, pendingPurge: true } });
        const totalSize = files.reduce((s, f) => s + f.fileSize, BigInt(0));
        if (files.length > 0) {
          await prisma.file.updateMany({
            where: { id: { in: files.map(f => f.id) } },
            data: { pendingPurge: false, purgeAfter: null },
          });
          await prisma.user.update({ where: { id: userId }, data: { storageUsed: { increment: totalSize } } });
        }
        await prisma.folder.update({
          where: { id: folderId },
          data: { pendingPurge: false, purgeAfter: null },
        });
        const children = await prisma.folder.findMany({ where: { parentId: folderId, userId } });
        for (const child of children) await recoverRecursive(child.id, userId);
      };

      await recoverRecursive(id, folder.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async recoverableUnviewedCount(_req: Request, res: Response): Promise<void> {
    try {
      const [fileCount, folderCount] = await Promise.all([
        prisma.file.count({ where: { pendingPurge: true, adminViewed: false } }),
        prisma.folder.count({ where: { pendingPurge: true, adminViewed: false } }),
      ]);
      res.json({ count: fileCount + folderCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markRecoverableViewed(_req: Request, res: Response): Promise<void> {
    try {
      await Promise.all([
        prisma.file.updateMany({ where: { pendingPurge: true, adminViewed: false }, data: { adminViewed: true } }),
        prisma.folder.updateMany({ where: { pendingPurge: true, adminViewed: false }, data: { adminViewed: true } }),
      ]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async purgeFile(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const file = await prisma.file.findFirst({ where: { id, pendingPurge: true } });
      if (!file) { res.status(404).json({ error: 'File not found' }); return; }

      if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
      await prisma.file.delete({ where: { id } });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async purgeFolder(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const folder = await prisma.folder.findFirst({ where: { id, pendingPurge: true } });
      if (!folder) { res.status(404).json({ error: 'Folder not found' }); return; }

      const purgeRecursive = async (folderId: number) => {
        const files = await prisma.file.findMany({ where: { folderId } });
        for (const file of files) {
          if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
        }
        await prisma.file.deleteMany({ where: { folderId } });
        const children = await prisma.folder.findMany({ where: { parentId: folderId } });
        for (const child of children) await purgeRecursive(child.id);
        await prisma.folder.delete({ where: { id: folderId } });
      };

      await purgeRecursive(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async bulkRecover(req: Request, res: Response): Promise<void> {
    try {
      const { fileIds = [], folderIds = [] } = req.body as { fileIds: number[]; folderIds: number[] };

      for (const fileId of fileIds) {
        const file = await prisma.file.findFirst({ where: { id: fileId, pendingPurge: true } });
        if (!file) continue;
        await prisma.$transaction([
          prisma.file.update({ where: { id: fileId }, data: { pendingPurge: false, purgeAfter: null } }),
          prisma.user.update({ where: { id: file.userId }, data: { storageUsed: { increment: file.fileSize } } }),
        ]);
      }

      for (const folderId of folderIds) {
        const folder = await prisma.folder.findFirst({ where: { id: folderId, pendingPurge: true } });
        if (!folder) continue;
        const recoverRecursive = async (fId: number, userId: number) => {
          const files = await prisma.file.findMany({ where: { folderId: fId, userId, pendingPurge: true } });
          const totalSize = files.reduce((s, f) => s + f.fileSize, BigInt(0));
          if (files.length > 0) {
            await prisma.file.updateMany({ where: { id: { in: files.map(f => f.id) } }, data: { pendingPurge: false, purgeAfter: null } });
            await prisma.user.update({ where: { id: userId }, data: { storageUsed: { increment: totalSize } } });
          }
          await prisma.folder.update({ where: { id: fId }, data: { pendingPurge: false, purgeAfter: null } });
          const children = await prisma.folder.findMany({ where: { parentId: fId, userId } });
          for (const child of children) await recoverRecursive(child.id, userId);
        };
        await recoverRecursive(folderId, folder.userId);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async bulkPurge(req: Request, res: Response): Promise<void> {
    try {
      const { fileIds = [], folderIds = [] } = req.body as { fileIds: number[]; folderIds: number[] };

      for (const fileId of fileIds) {
        const file = await prisma.file.findFirst({ where: { id: fileId, pendingPurge: true } });
        if (!file) continue;
        if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
        await prisma.file.delete({ where: { id: fileId } });
      }

      const purgeRecursive = async (folderId: number) => {
        const files = await prisma.file.findMany({ where: { folderId } });
        for (const file of files) {
          if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
        }
        await prisma.file.deleteMany({ where: { folderId } });
        const children = await prisma.folder.findMany({ where: { parentId: folderId } });
        for (const child of children) await purgeRecursive(child.id);
        await prisma.folder.delete({ where: { id: folderId } });
      };

      for (const folderId of folderIds) {
        const folder = await prisma.folder.findFirst({ where: { id: folderId, pendingPurge: true } });
        if (folder) await purgeRecursive(folderId);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
