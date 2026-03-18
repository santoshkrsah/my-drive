export declare class UserActivityService {
    static log(userId: number, actionType: string, resourceType: string, resourceId?: number, resourceName?: string, details?: string): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        actionType: string;
        resourceType: string;
        resourceId: number | null;
        resourceName: string | null;
        details: string | null;
    }>;
    static getUserActivities(userId: number, page?: number, limit?: number, actionType?: string): Promise<{
        logs: {
            id: number;
            createdAt: Date;
            userId: number;
            actionType: string;
            resourceType: string;
            resourceId: number | null;
            resourceName: string | null;
            details: string | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static clearUserActivities(userId: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=user-activity.service.d.ts.map