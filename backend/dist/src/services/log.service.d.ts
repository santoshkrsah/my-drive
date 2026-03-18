export declare class LogService {
    static log(adminId: number, actionType: string, targetUserId?: number, details?: string, ipAddress?: string): Promise<{
        id: number;
        actionType: string;
        details: string | null;
        targetUserId: number | null;
        adminId: number;
        ipAddress: string | null;
        timestamp: Date;
    }>;
    static getLogs(page?: number, limit?: number, actionType?: string): Promise<{
        logs: ({
            admin: {
                id: number;
                username: string;
                name: string;
            };
            targetUser: {
                id: number;
                username: string;
                name: string;
            } | null;
        } & {
            id: number;
            actionType: string;
            details: string | null;
            targetUserId: number | null;
            adminId: number;
            ipAddress: string | null;
            timestamp: Date;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getUserLogs(userId: number, page?: number, limit?: number, actionType?: string): Promise<{
        logs: {
            id: number;
            actionType: string;
            details: string | null;
            targetUserId: number | null;
            adminId: number;
            ipAddress: string | null;
            timestamp: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static clearLogs(): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=log.service.d.ts.map