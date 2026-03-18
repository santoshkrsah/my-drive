import { Router } from 'express';
import { FolderController } from '../controllers/folder.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', FolderController.create);
router.get('/', FolderController.list);
router.get('/all', FolderController.allFolders);
router.get('/trash', FolderController.trash);
router.post('/bulk-delete', FolderController.bulkDelete);
router.get('/:id/breadcrumb', FolderController.breadcrumb);
router.get('/:id/trash-contents', FolderController.trashContents);
router.put('/:id', FolderController.rename);
router.put('/:id/move', FolderController.move);
router.post('/:id/restore', FolderController.restore);
router.delete('/:id/permanent', FolderController.permanentDelete);
router.delete('/:id', FolderController.remove);

export default router;
