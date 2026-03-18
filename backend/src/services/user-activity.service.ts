import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserActivityService {
  static async log(
    userId: number,
    actionType: string,
    resourceType: string,
    resourceId?: number,
    resourceName?: string,
    details?: string
  ) {
    return prisma.userActivity.create({
      data: {
        userId,
        actionType,
        resourceType,
        resourceId,
        resourceName,
        details,
      },
    });
  }

  static async getUserActivities(userId: number, page: number = 1, limit: number = 50, actionType?: string) {
    const where: any = { userId };
    if (actionType) {
      where.actionType = actionType;
    }

    const [logs, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userActivity.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async clearUserActivities(userId: number) {
    return prisma.userActivity.deleteMany({ where: { userId } });
  }
}
