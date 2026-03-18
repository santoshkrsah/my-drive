import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// Any authenticated user can list tags
router.get('/', TagController.listTags);

// File tag operations (authenticated users can apply/remove on their own files)
router.post('/files/:id/tags', TagController.addTagToFile);
router.delete('/files/:id/tags/:tagId', TagController.removeTagFromFile);

// Any authenticated user can create, update, delete (ownership enforced in service)
router.post('/', TagController.createTag);
router.put('/:id', TagController.updateTag);
router.delete('/:id', TagController.deleteTag);

export default router;
