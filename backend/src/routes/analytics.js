import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { getDashboardAnalytics, exportTransactionsCsv } from '../controllers/analyticsController.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/export', exportTransactionsCsv);

export default router;
