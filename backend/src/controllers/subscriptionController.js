import Subscription from '../models/Subscription.js';
import { evaluateRenewalReminders } from '../utils/renewalReminderService.js';

export const getMonthlyEquivalent = (amount, cycle) => {
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return 0;
  }
};

export const addCycle = (date, cycle) => {
  const next = new Date(date);

  switch (cycle) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      return next;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      return next;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      return next;
    default:
      return next;
  }
};

// POST /api/subscriptions
export const createSubscription = async (req, res) => {
  try {
    const { name, category, amount, billingCycle, nextBillingDate, status, notes } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ success: false, message: 'Name and amount are required' });
    }

    const initialDate = nextBillingDate ? new Date(nextBillingDate) : addCycle(new Date(), billingCycle || 'monthly');

    const subscription = await Subscription.create({
      userId: req.user._id,
      name,
      category,
      amount,
      currency: req.user.currency,
      billingCycle: billingCycle || 'monthly',
      nextBillingDate: initialDate,
      status: status || 'active',
      notes,
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscriptions
export const getSubscriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };

    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter).sort({ nextBillingDate: 1, createdAt: -1 });
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/subscriptions/:id
export const updateSubscription = async (req, res) => {
  try {
    const { name, category, amount, billingCycle, nextBillingDate, status, notes } = req.body;

    const updates = {
      name,
      category,
      amount,
      billingCycle,
      nextBillingDate,
      status,
      notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/subscriptions/:id
export const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/subscriptions/:id/status
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscriptions/upcoming
export const getUpcomingRenewals = async (req, res) => {
  try {
    const days = Math.max(1, Number(req.query.days || 7));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const upper = new Date(start);
    upper.setDate(upper.getDate() + days);
    upper.setHours(23, 59, 59, 999);

    const renewals = await Subscription.find({
      userId: req.user._id,
      status: 'active',
      nextBillingDate: { $gte: start, $lte: upper },
    }).sort({ nextBillingDate: 1 });

    res.json({ success: true, data: renewals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscriptions/stats/total-cost
export const getSubscriptionCostStats = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id, status: 'active' });

    const monthlyTotal = subscriptions.reduce(
      (sum, item) => sum + getMonthlyEquivalent(item.amount, item.billingCycle),
      0
    );

    res.json({
      success: true,
      data: {
        activeCount: subscriptions.length,
        monthlyTotal: Number(monthlyTotal.toFixed(2)),
        yearlyTotal: Number((monthlyTotal * 12).toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/subscriptions/check-renewals
export const checkRenewalReminders = async (req, res) => {
  try {
    const summary = await evaluateRenewalReminders({ userId: req.user._id });

    res.json({
      success: true,
      data: summary,
      message: summary.matched
        ? 'Renewal reminders evaluated successfully'
        : 'No active renewals due in the reminder window',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
