import Notification from '../models/Notification.js';
import Subscription from '../models/Subscription.js';

const RENEWAL_LOOKAHEAD_DAYS = 7;

export const createInAppNotification = async ({
  userId,
  type,
  dedupeKey,
  title,
  message,
  priority = 'medium',
  channels = ['inApp'],
}) => {
  if (dedupeKey) {
    return Notification.findOneAndUpdate(
      { userId, type, dedupeKey },
      {
        $setOnInsert: {
          userId,
          type,
          dedupeKey,
          title,
          message,
          priority,
          channels,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  return Notification.create({
    userId,
    type,
    dedupeKey,
    title,
    message,
    priority,
    channels,
  });
};

const ensureUpcomingRenewalNotifications = async (user) => {
  if (!user?.notifPrefs?.inApp || !user?.notifPrefs?.renewalReminder) {
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const rangeEnd = new Date(todayStart);
  rangeEnd.setDate(rangeEnd.getDate() + RENEWAL_LOOKAHEAD_DAYS);
  rangeEnd.setHours(23, 59, 59, 999);

  const subscriptions = await Subscription.find({
    userId: user._id,
    status: 'active',
    nextBillingDate: { $gte: todayStart, $lte: rangeEnd },
  }).select('name amount currency nextBillingDate');

  if (!subscriptions.length) return;

  const title = 'Subscription Renewal Reminder';
  const messageBySubId = new Map();
  const dedupeBySubId = new Map();

  subscriptions.forEach((sub) => {
    const message = `${sub.name} renews on ${sub.nextBillingDate.toDateString()} for ${sub.amount} ${sub.currency}.`;
    const dayKey = new Date(sub.nextBillingDate).toISOString().slice(0, 10);
    const dedupeKey = `renewal:${String(sub._id)}:${dayKey}`;
    messageBySubId.set(String(sub._id), message);
    dedupeBySubId.set(String(sub._id), dedupeKey);
  });

  const existing = await Notification.find({
    userId: user._id,
    type: 'renewal_reminder',
    dedupeKey: { $in: Array.from(dedupeBySubId.values()) },
  }).select('dedupeKey');

  const existingDedupeKeys = new Set(existing.map((item) => item.dedupeKey));
  const toCreate = subscriptions
    .map((sub) => ({
      sub,
      message: messageBySubId.get(String(sub._id)),
      dedupeKey: dedupeBySubId.get(String(sub._id)),
    }))
    .filter(({ dedupeKey }) => !existingDedupeKeys.has(dedupeKey));

  if (!toCreate.length) return;

  await Promise.all(
    toCreate.map(({ message, dedupeKey }) =>
      createInAppNotification({
        userId: user._id,
        type: 'renewal_reminder',
        dedupeKey,
        title,
        message,
        priority: 'medium',
        channels: ['inApp'],
      })
    )
  );
};

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    try {
      await ensureUpcomingRenewalNotifications(req.user);
    } catch (error) {
      console.error('Auto-generation of renewal notifications failed:', error.message);
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 20));
    const unreadOnly = req.query.unreadOnly === 'true';

    const filter = { userId: req.user._id };
    if (unreadOnly) filter.read = false;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/mark-all-read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
