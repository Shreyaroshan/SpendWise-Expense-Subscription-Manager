import Expense from '../models/Expense.js';
import Subscription from '../models/Subscription.js';
import Budget from '../models/Budget.js';

const getMonthStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
const getMonthEnd = (date = new Date()) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const csvEscape = (value) => {
  if (value == null) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

// GET /api/analytics/dashboard
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const period = ['1M', '3M', '6M', '1Y'].includes(req.query.period) ? req.query.period : '1M';
    const monthStart = getMonthStart(now);
    const monthEnd = getMonthEnd(now);

    const [monthSummary] = await Expense.aggregate([
      { $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          categoryId: '$category._id',
          name: '$category.name',
          icon: '$category.icon',
          color: '$category.color',
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    const trends = await Expense.aggregate([
      { $match: { userId, date: { $gte: sixMonthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const periodStartMap = {
      '1M': new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      '3M': new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0),
      '6M': new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0),
      '1Y': new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0),
    };

    const periodStart = periodStartMap[period];

    const dailyTrends = await Expense.aggregate([
      { $match: { userId, date: { $gte: periodStart, $lte: monthEnd } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const activeSubscriptions = await Subscription.find({ userId, status: 'active' });
    const monthlySubscriptionTotal = activeSubscriptions.reduce((sum, sub) => {
      switch (sub.billingCycle) {
        case 'weekly':
          return sum + (sub.amount * 52) / 12;
        case 'monthly':
          return sum + sub.amount;
        case 'quarterly':
          return sum + sub.amount / 3;
        case 'yearly':
          return sum + sub.amount / 12;
        default:
          return sum;
      }
    }, 0);

    const budgets = await Budget.find({ userId, isActive: true });

    res.json({
      success: true,
      data: {
        summary: {
          monthTotal: monthSummary?.total || 0,
          monthCount: monthSummary?.count || 0,
          activeSubscriptionCount: activeSubscriptions.length,
          monthlySubscriptionTotal: Number(monthlySubscriptionTotal.toFixed(2)),
          activeBudgetCount: budgets.length,
        },
        categoryBreakdown: byCategory,
        monthlyTrends: trends,
        dailyTrends,
        period,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/export
export const exportTransactionsCsv = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('categoryId', 'name')
      .sort({ date: -1 });

    const headers = ['id', 'date', 'category', 'amount', 'currency', 'paymentMethod', 'description'];
    const rows = expenses.map((expense) => [
      expense._id,
      expense.date.toISOString(),
      expense.categoryId?.name || '',
      expense.amount,
      expense.currency,
      expense.paymentMethod,
      expense.description || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
