import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { uploadReceiptFile } from '../middleware/uploadMiddleware.js';
import {
  createExpense, getExpenses, updateExpense,
  deleteExpense, getStatsByCategory, getMonthlyTrends, uploadExpenseReceipt
} from '../controllers/expenseController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createExpense)
  .get(getExpenses);

router.post('/upload-receipt', uploadReceiptFile, uploadExpenseReceipt);
router.get('/stats/by-category', getStatsByCategory);
router.get('/stats/trends', getMonthlyTrends);

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

export default router;