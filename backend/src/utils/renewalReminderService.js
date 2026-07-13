import { getMailer } from './mailer.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createInAppNotification } from '../controllers/notificationController.js';

const LOOKAHEAD_DAYS = 7;

export const evaluateRenewalReminders = async ({ userId, days = LOOKAHEAD_DAYS } = {}) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(1, Number(days || LOOKAHEAD_DAYS)));
  end.setHours(23, 59, 59, 999);

  const filter = {
    status: 'active',
    nextBillingDate: { $gte: start, $lte: end },
  };

  if (userId) filter.userId = userId;

  const subs = await Subscription.find(filter);
  if (!subs.length) {
    return {
      matched: 0,
      createdInApp: 0,
      sentEmail: 0,
      skippedExisting: 0,
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    };
  }

  const mailer = getMailer();
  const summary = {
    matched: 0,
    createdInApp: 0,
    sentEmail: 0,
    skippedExisting: 0,
    smtpConfigured: Boolean(mailer),
  };

  for (const sub of subs) {
    const user = await User.findById(sub.userId).select('email name notifPrefs');
    if (!user) continue;

    const canInApp = Boolean(user.notifPrefs?.inApp && user.notifPrefs?.renewalReminder);
    const canEmail = Boolean(user.notifPrefs?.email && user.notifPrefs?.renewalReminder && mailer);
    if (!canInApp && !canEmail) continue;

    summary.matched += 1;

    const title = 'Subscription Renewal Reminder';
    const message = `${sub.name} renews on ${sub.nextBillingDate.toDateString()} for ${sub.amount} ${sub.currency}.`;
    const dayKey = new Date(sub.nextBillingDate).toISOString().slice(0, 10);
    const dedupeKey = `renewal:${String(sub._id)}:${dayKey}`;

    let existing = await Notification.findOne({
      userId: user._id,
      type: 'renewal_reminder',
      dedupeKey,
    });

    let createdInApp = false;
    let sentEmail = false;

    if (canInApp && !existing) {
      existing = await createInAppNotification({
        userId: user._id,
        type: 'renewal_reminder',
        dedupeKey,
        title,
        message,
        priority: 'medium',
        channels: ['inApp'],
      });
      createdInApp = true;
      summary.createdInApp += 1;
    }

    const hasEmailMarker = Boolean(existing?.channels?.includes('email'));

    if (canEmail && !hasEmailMarker) {
      try {
        await mailer.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: title,
          text: `Hi ${user.name},\n\n${message}\n\n- SpendWise`,
        });
        await Notification.findOneAndUpdate(
          { userId: user._id, type: 'renewal_reminder', dedupeKey },
          {
            $setOnInsert: {
              userId: user._id,
              type: 'renewal_reminder',
              dedupeKey,
              title,
              message,
              priority: 'medium',
            },
            $addToSet: { channels: 'email' },
          },
          { upsert: true, returnDocument: 'after' }
        );
        sentEmail = true;
        summary.sentEmail += 1;
      } catch (error) {
        console.error('Failed to send renewal email:', error.message);
      }
    }

    if (!createdInApp && !sentEmail) {
      summary.skippedExisting += 1;
    }
  }

  return summary;
};
