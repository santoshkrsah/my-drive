import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { upload, validateUploadLimits } from '../middleware/upload.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', FileController.list);
router.post('/upload', upload.array('files', 50), validateUploadLimits, FileController.upload);
// Folder upload: skip the per-upload file count limit — folders can contain hundreds of files
router.post('/upload-folder', upload.array('files', 500), FileController.uploadFolder);
router.get('/storage', FileController.storage);
router.get('/trash', FileController.trash);
router.get('/search', FileController.search);
router.get('/check-duplicate', FileController.checkDuplicate);
router.get('/duplicates', FileController.getDuplicates);
router.post('/bulk-delete', FileController.bulkDelete);
router.post('/bulk-move', FileController.bulkMove);
router.post('/bulk-download', FileController.bulkDownload);
router.post('/delete-all', FileController.deleteAll);
router.post('/empty-trash', FileController.emptyTrash);
router.get('/recent', FileController.recent);
router.get('/starred', FileController.starred);
router.get('/dashboard', FileController.dashboard);
router.put('/:id/star', FileController.toggleStar);
router.get('/:id/download', FileController.download);
router.get('/:id/preview', FileController.preview);
router.get('/:id/office-preview', FileController.officePreview);
router.get('/:id/access-log', FileController.accessLog);
router.put('/:id/rename', FileController.rename);
router.put('/:id/move', FileController.move);
router.delete('/:id', FileController.softDelete);
router.delete('/:id/permanent', FileController.permanentDelete);
router.post('/:id/restore', FileController.restore);

export default router;
