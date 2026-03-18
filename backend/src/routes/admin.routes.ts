import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireRole('SYSADMIN'));

router.get('/dashboard', AdminController.dashboard);
router.get('/users', AdminController.listUsers);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/:id/ban', AdminController.banUser);
router.post('/users/:id/unban', AdminController.unbanUser);
router.post('/users/:id/impersonate', AdminController.impersonate);
router.post('/stop-impersonation', AdminController.stopImpersonation);
router.get('/users/:id/files', AdminController.getUserFiles);
router.get('/logs', AdminController.getLogs);
router.delete('/logs', AdminController.clearLogs);
router.post('/notifications', NotificationController.send);
router.get('/recoverable-files', AdminController.listRecoverableFiles);
router.get('/recoverable-files/unviewed-count', AdminController.recoverableUnviewedCount);
router.post('/recoverable-files/mark-viewed', AdminController.markRecoverableViewed);
router.post('/recoverable-files/bulk-recover', AdminController.bulkRecover);
router.post('/recoverable-files/bulk-purge', AdminController.bulkPurge);
router.post('/recoverable-files/folders/:id/recover', AdminController.recoverFolder);
router.delete('/recoverable-files/folders/:id', AdminController.purgeFolder);
router.post('/recoverable-files/:id/recover', AdminController.recoverFile);
router.delete('/recoverable-files/:id', AdminController.purgeFile);

export default router;
