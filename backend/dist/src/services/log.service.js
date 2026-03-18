"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class LogService {
    static async log(adminId, actionType, targetUserId, details, ipAddress) {
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
    static async getLogs(page = 1, limit = 50, actionType) {
        const where = {};
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
    static async getUserLogs(userId, page = 1, limit = 50, actionType) {
        const where = { adminId: userId };
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
exports.LogService = LogService;
//# sourceMappingURL=log.service.js.map