"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const share_controller_1 = require("../controllers/share.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.post('/', share_controller_1.ShareController.share);
router.get('/with-me', share_controller_1.ShareController.sharedWithMe);
router.get('/by-me', share_controller_1.ShareController.sharedByMe);
router.get('/file/:fileId', share_controller_1.ShareController.fileShares);
router.delete('/:id', share_controller_1.ShareController.remove);
router.post('/folder', share_controller_1.ShareController.shareFolder);
router.get('/folder/:folderId', share_controller_1.ShareController.folderShares);
router.delete('/folder/:id', share_controller_1.ShareController.removeFolderShare);
exports.default = router;
//# sourceMappingURL=share.routes.js.map