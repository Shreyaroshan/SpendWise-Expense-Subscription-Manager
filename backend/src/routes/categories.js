import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getCategories).post(createCategory);
router.route('/:id').delete(deleteCategory);

export default router;