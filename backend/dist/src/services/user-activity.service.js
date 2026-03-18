"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivityService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UserActivityService {
    static async log(userId, actionType, resourceType, resourceId, resourceName, details) {
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
    static async getUserActivities(userId, page = 1, limit = 50, actionType) {
        const where = { userId };
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
    static async clearUserActivities(userId) {
        return prisma.userActivity.deleteMany({ where: { userId } });
    }
}
exports.UserActivityService = UserActivityService;
//# sourceMappingURL=user-activity.service.js.map