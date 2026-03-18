import { Router } from 'express';
import { VersionController } from '../controllers/version.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(requireAuth);

router.post('/:fileId/upload', upload.single('file'), VersionController.upload);
router.get('/:fileId', VersionController.history);
router.post('/:fileId/restore/:versionId', VersionController.restore);
router.delete('/:versionId', VersionController.delete);

export default router;
