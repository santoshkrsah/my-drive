import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  static async create(userId: number, title: string, message: string) {
    return prisma.notification.create({
      data: { userId, title, message },
    });
  }

  static async createForAll(title: string, message: string) {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, title, message })),
    });

    return { sent: users.length };
  }

  static async createForUsers(userIds: number[], title: string, message: string) {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({ userId, title, message })),
    });

    return { sent: userIds.length };
  }

  static async createForAdmins(title: string, message: string) {
    const admins = await prisma.user.findMany({
      where: { role: 'SYSADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(a => ({ userId: a.id, title, message })),
      });
    }
    return { sent: admins.length };
  }

  static async getUserNotifications(userId: number, page: number = 1, limit: number = 20) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUnreadCount(userId: number) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  static async markAsRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async deleteNotification(id: number, userId: number) {
    return prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  static async deleteAllNotifications(userId: number) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
