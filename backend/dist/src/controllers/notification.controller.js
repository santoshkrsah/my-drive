"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    static async list(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await notification_service_1.NotificationService.getUserNotifications(req.user.id, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async unreadCount(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const count = await notification_service_1.NotificationService.getUnreadCount(req.user.id);
            res.json({ count });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async markAsRead(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const id = parseInt(req.params.id);
            await notification_service_1.NotificationService.markAsRead(id, req.user.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            await notification_service_1.NotificationService.markAllAsRead(req.user.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async send(req, res) {
        try {
            const { title, message, userIds, sendToAll } = req.body;
            if (!title || !message) {
                res.status(400).json({ error: 'Title and message are required' });
                return;
            }
            let result;
            if (sendToAll) {
                result = await notification_service_1.NotificationService.createForAll(title, message);
            }
            else if (Array.isArray(userIds) && userIds.length > 0) {
                result = await notification_service_1.NotificationService.createForUsers(userIds, title, message);
            }
            else {
                res.status(400).json({ error: 'Specify userIds or set sendToAll to true' });
                return;
            }
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async deleteOne(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const id = parseInt(req.params.id);
            await notification_service_1.NotificationService.deleteNotification(id, req.user.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async deleteAll(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            await notification_service_1.NotificationService.deleteAllNotifications(req.user.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notification.controller.js.map