import { apiRequest } from './apiClient';

export type Subscription = {
	_id: string;
	name: string;
	category: string;
	amount: number;
	currency: string;
	billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
	nextBillingDate: string;
	status: 'active' | 'paused' | 'cancelled';
	notes?: string;
};

export const createSubscription = async (
	token: string,
	payload: Omit<Subscription, '_id' | 'currency'> & { currency?: string }
) => {
	const res = await apiRequest<Subscription>('/subscriptions', { method: 'POST', token, body: payload });
	return res.data as Subscription;
};

export const getSubscriptions = async (token: string, status?: Subscription['status']) => {
	const query = status ? `?status=${status}` : '';
	const res = await apiRequest<Subscription[]>(`/subscriptions${query}`, { token });
	return res.data as Subscription[];
};

export const updateSubscriptionStatus = async (token: string, id: string, status: Subscription['status']) => {
	const res = await apiRequest<Subscription>(`/subscriptions/${id}/status`, {
		method: 'PUT',
		token,
		body: { status },
	});
	return res.data as Subscription;
};

export const updateSubscription = async (
	token: string,
	id: string,
	payload: Partial<Omit<Subscription, '_id' | 'currency'>>
) => {
	const res = await apiRequest<Subscription>(`/subscriptions/${id}`, {
		method: 'PUT',
		token,
		body: payload,
	});
	return res.data as Subscription;
};

export const deleteSubscription = async (token: string, id: string) => {
	return apiRequest(`/subscriptions/${id}`, {
		method: 'DELETE',
		token,
	});
};

export const getUpcomingRenewals = async (token: string, days = 7) => {
	const res = await apiRequest<Subscription[]>(`/subscriptions/upcoming?days=${days}`, { token });
	return res.data as Subscription[];
};

export const getSubscriptionCostStats = async (token: string) => {
	const res = await apiRequest<{ activeCount: number; monthlyTotal: number; yearlyTotal: number }>(
		'/subscriptions/stats/total-cost',
		{ token }
	);
	return res.data as { activeCount: number; monthlyTotal: number; yearlyTotal: number };
};

export const checkRenewalReminders = async (token: string) => {
	const res = await apiRequest<{ matched: number; createdInApp: number; sentEmail: number; skippedExisting: number; smtpConfigured: boolean }>(
		'/subscriptions/check-renewals',
		{ method: 'POST', token }
	);
	return {
		data: res.data as { matched: number; createdInApp: number; sentEmail: number; skippedExisting: number; smtpConfigured: boolean },
		message: res.message,
	};
};

export type NotificationItem = {
	_id: string;
	type: 'renewal_reminder' | 'budget_alert' | 'general';
	title: string;
	message: string;
	priority: 'low' | 'medium' | 'high';
	read: boolean;
	createdAt: string;
};

export const getNotifications = async (token: string, options?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
	const params = new URLSearchParams();
	if (options?.page) params.set('page', String(options.page));
	if (options?.limit) params.set('limit', String(options.limit));
	if (options?.unreadOnly) params.set('unreadOnly', 'true');

	const query = params.toString();
	return apiRequest<NotificationItem[]>(`/notifications${query ? `?${query}` : ''}`, { token });
};

export const markAllNotificationsRead = async (token: string) => {
	return apiRequest('/notifications/mark-all-read', {
		method: 'PUT',
		token,
	});
};

export const markNotificationRead = async (token: string, id: string) => {
	return apiRequest(`/notifications/${id}/read`, {
		method: 'PUT',
		token,
	});
};

export const deleteNotification = async (token: string, id: string) => {
	return apiRequest(`/notifications/${id}`, {
		method: 'DELETE',
		token,
	});
};
