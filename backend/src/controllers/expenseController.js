import Expense from '../models/Expense.js';
import Category from '../models/Category.js';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import { deleteCloudinaryAssetByUrl } from '../config/cloudinary.js';
import { evaluateBudgetAlertsForExpense } from '../utils/budgetAlertService.js';

// POST /api/expenses
export const createExpense = async (req, res) => {
  try {
    const { amount, categoryId, date, description, paymentMethod, isRecurring, recurringSchedule, receiptUrl } = req.body;

    if (amount === undefined || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      amount, categoryId, date, description, paymentMethod, isRecurring, recurringSchedule, receiptUrl,
      currency: req.user.currency,
    });

    try {
      await evaluateBudgetAlertsForExpense(expense);
    } catch (alertError) {
      console.error('Immediate budget alert evaluation failed:', alertError.message);
    }

    const populated = await expense.populate('categoryId', 'name icon color');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses
export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, categoryId, minAmount, maxAmount, page = 1 } = req.query;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const filter = { userId: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (categoryId) filter.categoryId = categoryId;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .populate('categoryId', 'name icon color')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: expenses,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/expenses/:id
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const nextReceiptUrl = req.body.receiptUrl;
    const hasReceiptChanged = typeof nextReceiptUrl === 'string' && nextReceiptUrl !== expense.receiptUrl;
    const hasReceiptRemoved = nextReceiptUrl === null || nextReceiptUrl === '';

    if ((hasReceiptChanged || hasReceiptRemoved) && expense.receiptUrl) {
      try {
        await deleteCloudinaryAssetByUrl(expense.receiptUrl);
      } catch (cleanupError) {
        console.error('Receipt cleanup failed:', cleanupError.message);
      }
    }

    // Whitelist allowed fields to prevent mass-assignment / operator injection
    const { amount, categoryId, date, description, paymentMethod,
            isRecurring, recurringSchedule, receiptUrl } = req.body;
    const updates = {};
    if (amount !== undefined)            updates.amount = amount;
    if (categoryId !== undefined)        updates.categoryId = categoryId;
    if (date !== undefined)              updates.date = date;
    if (description !== undefined)       updates.description = description;
    if (paymentMethod !== undefined)     updates.paymentMethod = paymentMethod;
    if (isRecurring !== undefined)       updates.isRecurring = isRecurring;
    if (recurringSchedule !== undefined) updates.recurringSchedule = recurringSchedule;
    if (receiptUrl !== undefined)        updates.receiptUrl = receiptUrl;

    const updated = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { returnDocument: 'after', runValidators: true }
    )
      .populate('categoryId', 'name icon color');

    try {
      await evaluateBudgetAlertsForExpense(updated);
    } catch (alertError) {
      console.error('Budget alert evaluation after expense update failed:', alertError.message);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    if (expense.receiptUrl) {
      try {
        await deleteCloudinaryAssetByUrl(expense.receiptUrl);
      } catch (cleanupError) {
        console.error('Receipt cleanup failed:', cleanupError.message);
      }
    }

    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses/stats/by-category
export const getStatsByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { userId: req.user._id };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const stats = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { total: 1, count: 1, name: '$category.name', icon: '$category.icon', color: '$category.color' } },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses/stats/trends
export const getMonthlyTrends = async (req, res) => {
  try {
    const trends = await Expense.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/expenses/upload-receipt
export const uploadExpenseReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No receipt file uploaded' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      public_id: `user_${req.user._id}_${Date.now()}`,
    });

    res.status(201).json({
      success: true,
      data: {
        receiptUrl: result.secure_url,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};