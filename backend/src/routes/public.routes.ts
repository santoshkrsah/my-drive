import { Router } from 'express';
import { PublicLinkController } from '../controllers/public-link.controller';

const router = Router();

// These routes do NOT require authentication
router.get('/:token', PublicLinkController.getPublicFile);
router.get('/:token/download', PublicLinkController.downloadPublicFile);

export default router;
