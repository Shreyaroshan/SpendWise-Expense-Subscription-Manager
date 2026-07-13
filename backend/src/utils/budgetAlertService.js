import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createInAppNotification } from '../controllers/notificationController.js';
import nodemailer from 'nodemailer';

const getMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const monthRange = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
};

const shouldSendBudgetEmail = (user, percentage) => {
  if (!user?.notifPrefs?.email || !user?.notifPrefs?.budgetAlert) return false;
  return percentage >= 100 ? user.notifPrefs?.budgetAlert100 !== false : user.notifPrefs?.budgetAlert80 !== false;
};
const shouldSendBudgetInApp = (user, percentage) => {
  if (!user?.notifPrefs?.inApp || !user?.notifPrefs?.budgetAlert) return false;
  return percentage >= 100 ? user.notifPrefs?.budgetAlert100 !== false : user.notifPrefs?.budgetAlert80 !== false;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const evaluateBudgetAlerts = async (userId, options = {}) => {
  const { year, month, start, end } = options.range || monthRange();
  const budgets = await Budget.find({
    userId,
    isActive: true,
    $or: [
      { budgetYear: year, budgetMonth: month },
      { budgetYear: { $exists: false }, createdAt: { $gte: start, $lte: end } },
    ],
  }).populate('categoryId', 'name');
  if (!budgets.length) return [];

  const mailer = getMailer();
  const emitted = [];

  for (const budget of budgets) {
    const [agg] = await Expense.aggregate([
      {
        $match: {
          userId: budget.userId,
          categoryId: budget.categoryId._id,
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, spent: { $sum: '$amount' } } },
    ]);

    const spent = agg?.spent || 0;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    if (percentage < budget.alertThreshold) continue;

    const user = await User.findById(budget.userId).select('email name notifPrefs');
    if (!user) continue;

    const levelLabel = percentage >= 100 ? '100' : String(budget.alertThreshold);
    const reached = `${levelLabel}%`;
    const title = 'Budget Alert';
    const message = `${budget.categoryId.name} budget reached ${reached}. Spent ${spent.toFixed(2)} of ${budget.amount.toFixed(2)}.`;
    const periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const dedupeKey = `budget-category:${String(budget.categoryId._id)}:${levelLabel}:${periodKey}`;

    let existing = await Notification.findOne({
      userId: user._id,
      type: 'budget_alert',
      dedupeKey,
    });

    // Backward-compatible fallback for older dedupe keys created before category-level dedupe.
    if (!existing) {
      existing = await Notification.findOne({
        userId: user._id,
        type: 'budget_alert',
        createdAt: { $gte: start, $lte: end },
        message: {
          $regex: new RegExp(`^${escapeRegex(budget.categoryId.name)} budget reached ${escapeRegex(levelLabel)}%\\.`),
        },
      });
    }

    let createdInApp = false;
    let sentEmail = false;

    if (shouldSendBudgetInApp(user, percentage) && !existing) {
      existing = await createInAppNotification({
        userId: user._id,
        type: 'budget_alert',
        dedupeKey,
        title,
        message,
        priority: percentage >= 100 ? 'high' : 'medium',
        channels: ['inApp'],
      });
      createdInApp = true;
    }

    const hasEmailMarker = Boolean(existing?.channels?.includes('email'));
    if (shouldSendBudgetEmail(user, percentage) && mailer && !hasEmailMarker) {
      try {
        await mailer.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: title,
          text: `Hi ${user.name},\n\n${message}\n\n- SpendWise`,
        });
        await Notification.findOneAndUpdate(
          { userId: user._id, type: 'budget_alert', dedupeKey },
          {
            $setOnInsert: {
              userId: user._id,
              type: 'budget_alert',
              dedupeKey,
              title,
              message,
              priority: percentage >= 100 ? 'high' : 'medium',
            },
            $addToSet: { channels: 'email' },
          },
          { upsert: true, returnDocument: 'after' }
        );
        sentEmail = true;
      } catch (error) {
        console.error('Failed to send budget alert email:', error.message);
      }
    }

    if (!createdInApp && !sentEmail) {
      continue;
    }

    emitted.push({
      budgetId: budget._id,
      category: budget.categoryId.name,
      spent,
      amount: budget.amount,
      percentage: Number(percentage.toFixed(2)),
    });
  }

  return emitted;
};

export const evaluateBudgetAlertsForExpense = async (expense) => {
  if (!expense?.userId || !expense?.categoryId) return [];
  return evaluateBudgetAlerts(expense.userId);
};
