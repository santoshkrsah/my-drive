"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_link_controller_1 = require("../controllers/public-link.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.post('/', public_link_controller_1.PublicLinkController.create);
router.get('/file/:fileId', public_link_controller_1.PublicLinkController.listForFile);
router.delete('/:id', public_link_controller_1.PublicLinkController.revoke);
exports.default = router;
//# sourceMappingURL=public-link.routes.js.map