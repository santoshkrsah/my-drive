import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/me', ActivityController.myActivity);
router.delete('/me', ActivityController.clearMyActivity);

export default router;
