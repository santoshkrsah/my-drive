"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityController = void 0;
const user_activity_service_1 = require("../services/user-activity.service");
class ActivityController {
    static async myActivity(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const actionType = req.query.actionType;
            const result = await user_activity_service_1.UserActivityService.getUserActivities(req.user.id, page, limit, actionType);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async clearMyActivity(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            await user_activity_service_1.UserActivityService.clearUserActivities(req.user.id);
            res.json({ success: true, message: 'All activity logs cleared successfully' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.ActivityController = ActivityController;
//# sourceMappingURL=activity.controller.js.map