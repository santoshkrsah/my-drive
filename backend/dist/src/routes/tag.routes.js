"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tag_controller_1 = require("../controllers/tag.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// Any authenticated user can list tags
router.get('/', tag_controller_1.TagController.listTags);
// File tag operations (authenticated users can apply/remove on their own files)
router.post('/files/:id/tags', tag_controller_1.TagController.addTagToFile);
router.delete('/files/:id/tags/:tagId', tag_controller_1.TagController.removeTagFromFile);
// Any authenticated user can create, update, delete (ownership enforced in service)
router.post('/', tag_controller_1.TagController.createTag);
router.put('/:id', tag_controller_1.TagController.updateTag);
router.delete('/:id', tag_controller_1.TagController.deleteTag);
exports.default = router;
//# sourceMappingURL=tag.routes.js.map