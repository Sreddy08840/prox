import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

router.get('/', protect, getDashboardStats);

export default router;
