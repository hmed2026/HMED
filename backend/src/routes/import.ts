import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { importFile, upload, getImportHistory, previewFile } from '../controllers/importController';

const router = Router();
router.use(authenticate);
router.post('/upload', upload.single('file'), importFile);
router.post('/preview', upload.single('file'), previewFile);
router.get('/history', getImportHistory);
export default router;
