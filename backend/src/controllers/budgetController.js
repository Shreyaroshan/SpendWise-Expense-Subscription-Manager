import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import { evaluateBudgetAlerts } from '../utils/budgetAlertService.js';

const getCurrentMonthMeta = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

const getCurrentMonthBudgetFilter = (userId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const { year, month } = getCurrentMonthMeta();

  return {
    userId,
    isActive: true,
    $or: [
      { budgetYear: year, budgetMonth: month },
      { budgetYear: { $exists: false }, createdAt: { $gte: start, $lte: end } },
    ],
  };
};

const getPeriodRange = (period = 'monthly') => {
  const now = new Date();

  if (period === 'yearly') {
    return {
      start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
};

// POST /api/budgets
export const createBudget = async (req, res) => {
  try {
    const { categoryId, amount, alertThreshold = 80 } = req.body;
    const { year, month } = getCurrentMonthMeta();
    const { start, end } = getPeriodRange('monthly');

    if (!categoryId || !amount) {
      return res.status(400).json({ success: false, message: 'Category and amount are required' });
    }

    const existing = await Budget.findOne({
      userId: req.user._id,
      categoryId,
      isActive: true,
      $or: [
        { budgetYear: year, budgetMonth: month },
        { budgetYear: { $exists: false }, budgetMonth: { $exists: false }, createdAt: { $gte: start, $lte: end } },
      ],
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Budget already exists for this category in the current month' });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      categoryId,
      amount,
      period: 'monthly',
      budgetYear: year,
      budgetMonth: month,
      alertThreshold,
      currentPeriod: {
        spent: 0,
        startDate: start,
        endDate: end,
      },
    });

    const populated = await budget.populate('categoryId', 'name icon color');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/budgets/progress
export const getBudgetProgress = async (req, res) => {
  try {
    const budgets = await Budget.find(getCurrentMonthBudgetFilter(req.user._id)).populate('categoryId', 'name icon color');
    const { year, month } = getCurrentMonthMeta();

    const progress = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getPeriodRange(budget.period);

        const [agg] = await Expense.aggregate([
          {
            $match: {
              userId: req.user._id,
              categoryId: budget.categoryId._id,
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, spent: { $sum: '$amount' } } },
        ]);

        const spent = agg?.spent || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        await Budget.updateOne(
          { _id: budget._id },
          {
            $set: {
              'currentPeriod.spent': spent,
              'currentPeriod.startDate': start,
              'currentPeriod.endDate': end,
            },
          }
        );

        return {
          _id: budget._id,
          categoryId: budget.categoryId,
          amount: budget.amount,
          period: 'monthly',
          budgetYear: budget.budgetYear || year,
          budgetMonth: budget.budgetMonth || month,
          alertThreshold: budget.alertThreshold,
          spent,
          remaining: Math.max(0, budget.amount - spent),
          percentage: Number(percentage.toFixed(2)),
          isThresholdReached: percentage >= budget.alertThreshold,
          isExceeded: percentage >= 100,
        };
      })
    );

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/budgets/:id
export const updateBudget = async (req, res) => {
  try {
    const { categoryId, amount, alertThreshold } = req.body;
    const { year, month } = getCurrentMonthMeta();

    const budget = await Budget.findOne({
      _id: req.params.id,
      ...getCurrentMonthBudgetFilter(req.user._id),
    });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Current month budget not found' });
    }

    const nextCategoryId = categoryId || String(budget.categoryId);

    const duplicate = await Budget.findOne({
      _id: { $ne: budget._id },
      userId: req.user._id,
      categoryId: nextCategoryId,
      isActive: true,
      budgetYear: year,
      budgetMonth: month,
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Budget already exists for this category in the current month' });
    }

    if (categoryId !== undefined) budget.categoryId = categoryId;
    if (amount !== undefined) budget.amount = amount;
    budget.period = 'monthly';
    budget.budgetYear = year;
    budget.budgetMonth = month;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;

    await budget.save();
    const populated = await budget.populate('categoryId', 'name icon color');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/budgets/:id
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/budgets/check-alerts
export const checkBudgetAlerts = async (req, res) => {
  try {
    const emitted = await evaluateBudgetAlerts(req.user._id);
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    res.json({
      success: true,
      data: {
        matched: emitted.length,
        alerts: emitted,
        smtpConfigured,
      },
      message: emitted.length ? 'Budget alerts evaluated successfully' : 'No budget alerts matched current data',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
