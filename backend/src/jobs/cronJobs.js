import cron from 'node-cron';
import Budget from '../models/Budget.js';
import { evaluateBudgetAlerts } from '../utils/budgetAlertService.js';
import { evaluateRenewalReminders } from '../utils/renewalReminderService.js';
import { getMailer } from '../utils/mailer.js';

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
