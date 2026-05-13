import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDashboard, getSummary } from '../controllers/dashboardController';

const router = Router();
router.use(authenticate);
router.get('/', getDashboard);
router.get('/summary', getSummary);
export default router;
