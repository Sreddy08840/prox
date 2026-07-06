import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { getDashboardStats, exportSummaryReport } from '../controllers/dashboardController';

const router = Router();

router.get('/', protect, getDashboardStats);
router.post('/export-report', protect, exportSummaryReport);

export default router;
