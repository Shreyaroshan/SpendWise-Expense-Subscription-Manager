import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food', slug: 'food', icon: '🍔', color: '#f59e0b', type: 'expense' },
  { name: 'Transport', slug: 'transport', icon: '🚕', color: '#22d3ee', type: 'expense' },
  { name: 'Shopping', slug: 'shopping', icon: '🛍️', color: '#8b5cf6', type: 'expense' },
  { name: 'Utilities', slug: 'utilities', icon: '💡', color: '#64748b', type: 'expense' },
  { name: 'Entertainment', slug: 'entertainment', icon: '🎬', color: '#f43f5e', type: 'both' },
  { name: 'Subscriptions', slug: 'subscriptions', icon: '🔁', color: '#10b981', type: 'subscription' },
  { name: 'Other', slug: 'other', icon: '📦', color: '#94a3b8', type: 'both' },
];

const ensureDefaultCategories = async () => {
  const existingDefaultCount = await Category.countDocuments({ isDefault: true, userId: null });
  if (existingDefaultCount > 0) return;

  await Category.insertMany(
    DEFAULT_CATEGORIES.map((item) => ({
      ...item,
      isDefault: true,
      userId: null,
    })),
    { ordered: false }
  );
};

export const getCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();

    const categories = await Category.find({
      $or: [{ isDefault: true }, { userId: req.user._id }]
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, icon, color, type } = req.body;
    const category = await Category.create({
      name, slug, icon, color, type,
      userId: req.user._id,
      isDefault: false
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Check if the category is referenced by any expense or budget
    const expenseExists = await Expense.exists({ categoryId: category._id });
    const budgetExists = await Budget.exists({ categoryId: category._id });

    if (expenseExists || budgetExists) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is currently linked to expenses or budgets'
      });
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};