export declare class NotificationService {
    static create(userId: number, title: string, message: string): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        title: string;
        message: string;
        isRead: boolean;
    }>;
    static createForAll(title: string, message: string): Promise<{
        sent: number;
    }>;
    static createForUsers(userIds: number[], title: string, message: string): Promise<{
        sent: number;
    }>;
    static createForAdmins(title: string, message: string): Promise<{
        sent: number;
    }>;
    static getUserNotifications(userId: number, page?: number, limit?: number): Promise<{
        notifications: {
            id: number;
            createdAt: Date;
            userId: number;
            title: string;
            message: string;
            isRead: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getUnreadCount(userId: number): Promise<number>;
    static markAsRead(id: number, userId: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static markAllAsRead(userId: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static deleteNotification(id: number, userId: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static deleteAllNotifications(userId: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=notification.service.d.ts.map