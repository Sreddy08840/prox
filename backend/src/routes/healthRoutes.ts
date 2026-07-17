import { Router } from 'express';
import { getHealth, getLiveness, getMetrics } from '../controllers/healthController';

const router = Router();

router.get('/health', getHealth);
router.get('/liveness', getLiveness);
router.get('/metrics', getMetrics);

export default router;
