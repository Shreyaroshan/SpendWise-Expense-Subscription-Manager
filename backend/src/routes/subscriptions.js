import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
	createSubscription,
	deleteSubscription,
	getSubscriptions,
	updateSubscription,
	updateSubscriptionStatus,
	getUpcomingRenewals,
	getSubscriptionCostStats,
	checkRenewalReminders,
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createSubscription).get(getSubscriptions);
router.post('/check-renewals', checkRenewalReminders);
router.route('/:id').put(updateSubscription).delete(deleteSubscription);
router.put('/:id/status', updateSubscriptionStatus);
router.get('/upcoming', getUpcomingRenewals);
router.get('/stats/total-cost', getSubscriptionCostStats);

export default router;
