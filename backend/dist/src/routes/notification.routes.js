"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.get('/', notification_controller_1.NotificationController.list);
router.get('/unread-count', notification_controller_1.NotificationController.unreadCount);
router.put('/read-all', notification_controller_1.NotificationController.markAllAsRead);
router.put('/:id/read', notification_controller_1.NotificationController.markAsRead);
router.delete('/delete-all', notification_controller_1.NotificationController.deleteAll);
router.delete('/:id', notification_controller_1.NotificationController.deleteOne);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map