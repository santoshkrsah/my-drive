"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const version_controller_1 = require("../controllers/version.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.post('/:fileId/upload', upload_middleware_1.upload.single('file'), version_controller_1.VersionController.upload);
router.get('/:fileId', version_controller_1.VersionController.history);
router.post('/:fileId/restore/:versionId', version_controller_1.VersionController.restore);
router.delete('/:versionId', version_controller_1.VersionController.delete);
exports.default = router;
//# sourceMappingURL=version.routes.js.map