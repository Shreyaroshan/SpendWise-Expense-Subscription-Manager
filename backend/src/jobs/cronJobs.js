import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Budget from '../models/Budget.js';
import Notification from '../models/Notification.js';
import { createInAppNotification } from '../controllers/notificationController.js';
import { evaluateBudgetAlerts } from '../utils/budgetAlertService.js';
import { evaluateRenewalReminders } from '../utils/renewalReminderService.js';

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


const createUniqueNotification = async (payload) => {
  const existing = await Notification.findOne({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
  });

  if (existing) return existing;
  return createInAppNotification(payload);
};

const processRenewalReminders = async () => {
  await evaluateRenewalReminders();
};

const processBudgetAlerts = async () => {
  const budgets = await Budget.find({ isActive: true }).select('userId');
  if (!budgets.length) return;

  const userIds = [...new Set(budgets.map((budget) => String(budget.userId)))];
  for (const userId of userIds) {
    await evaluateBudgetAlerts(userId);
  }
};

const startCronJobs = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      await processRenewalReminders();
    } catch (error) {
      console.error('Renewal reminder cron failed:', error.message);
    }
  });

  cron.schedule('30 9 * * *', async () => {
    try {
      await processBudgetAlerts();
    } catch (error) {
      console.error('Budget alert cron failed:', error.message);
    }
  });

  console.log('Cron jobs scheduled');
};

export default startCronJobs;
