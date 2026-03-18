import { Router } from 'express';
import { PublicLinkController } from '../controllers/public-link.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', PublicLinkController.create);
router.get('/file/:fileId', PublicLinkController.listForFile);
router.delete('/:id', PublicLinkController.revoke);

export default router;
