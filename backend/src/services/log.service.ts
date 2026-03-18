import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LogService {
  static async log(
    adminId: number,
    actionType: string,
    targetUserId?: number,
    details?: string,
    ipAddress?: string
  ) {
    return prisma.activityLog.create({
      data: {
        adminId,
        actionType,
        targetUserId,
        details,
        ipAddress,
      },
    });
  }

  static async getLogs(page: number = 1, limit: number = 50, actionType?: string) {
    const where: any = {};
    if (actionType) {
      where.actionType = actionType;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          admin: { select: { id: true, name: true, username: true } },
          targetUser: { select: { id: true, name: true, username: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUserLogs(userId: number, page: number = 1, limit: number = 50, actionType?: string) {
    const where: any = { adminId: userId };
    if (actionType) {
      where.actionType = actionType;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async clearLogs() {
    return prisma.activityLog.deleteMany({});
  }
}
