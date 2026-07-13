import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { checkBudgetAlerts, createBudget, deleteBudget, getBudgetProgress, updateBudget } from '../controllers/budgetController.js';

const router = express.Router();

router.use(protect);

router.post('/', createBudget);
router.post('/check-alerts', checkBudgetAlerts);
router.get('/progress', getBudgetProgress);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
