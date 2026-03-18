import { Router } from 'express';
import { ShareController } from '../controllers/share.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', ShareController.share);
router.get('/with-me', ShareController.sharedWithMe);
router.get('/by-me', ShareController.sharedByMe);
router.get('/file/:fileId', ShareController.fileShares);
router.delete('/:id', ShareController.remove);

router.post('/folder', ShareController.shareFolder);
router.get('/folder/:folderId', ShareController.folderShares);
router.delete('/folder/:id', ShareController.removeFolderShare);

export default router;
