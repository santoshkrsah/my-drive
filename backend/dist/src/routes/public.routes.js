"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_link_controller_1 = require("../controllers/public-link.controller");
const router = (0, express_1.Router)();
// These routes do NOT require authentication
router.get('/:token', public_link_controller_1.PublicLinkController.getPublicFile);
router.get('/:token/download', public_link_controller_1.PublicLinkController.downloadPublicFile);
exports.default = router;
//# sourceMappingURL=public.routes.js.map