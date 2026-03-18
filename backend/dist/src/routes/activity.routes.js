"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.get('/me', activity_controller_1.ActivityController.myActivity);
router.delete('/me', activity_controller_1.ActivityController.clearMyActivity);
exports.default = router;
//# sourceMappingURL=activity.routes.js.map