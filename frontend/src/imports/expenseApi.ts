import { apiRequest } from './apiClient';
import { getApiBaseUrl } from './apiClient';

export type Expense = {
	_id: string;
	amount: number;
	currency: string;
	categoryId: {
		_id: string;
		name: string;
		icon?: string;
		color?: string;
	};
	date: string;
	description?: string;
	receiptUrl?: string;
	paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'other';
	isRecurring?: boolean;
	recurringSchedule?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
};

export type ExpenseFilters = {
	startDate?: string;
	endDate?: string;
	categoryId?: string;
	minAmount?: number;
	maxAmount?: number;
	page?: number;
	limit?: number;
};

const toQueryString = (filters: Record<string, string | number | undefined>) => {
	const params = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			params.set(key, String(value));
		}
	});
	const query = params.toString();
	return query ? `?${query}` : '';
};

export const createExpense = async (
	token: string,
	payload: {
		amount: number;
		categoryId: string;
		date: string;
		description?: string;
		receiptUrl?: string;
		paymentMethod?: Expense['paymentMethod'];
		isRecurring?: boolean;
		recurringSchedule?: Expense['recurringSchedule'];
	}
) => {
	const res = await apiRequest<Expense>('/expenses', { method: 'POST', token, body: payload });
	return res.data as Expense;
};

export const uploadExpenseReceipt = async (
	token: string,
	file: File,
	onProgress?: (percentage: number) => void
) => {
	const formData = new FormData();
	formData.append('receipt', file);

	return new Promise<{ receiptUrl: string }>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', `${getApiBaseUrl()}/expenses/upload-receipt`);
		xhr.setRequestHeader('Authorization', `Bearer ${token}`);

		xhr.upload.onprogress = (event) => {
			if (!event.lengthComputable || !onProgress) return;
			const percentage = Math.round((event.loaded / event.total) * 100);
			onProgress(percentage);
		};

		xhr.onload = () => {
			try {
				const payload = JSON.parse(xhr.responseText || '{}');
				if (xhr.status >= 200 && xhr.status < 300 && payload.success) {
					resolve(payload.data as { receiptUrl: string });
					return;
				}
				reject(new Error(payload.message || 'Failed to upload receipt'));
			} catch {
				reject(new Error('Failed to upload receipt'));
			}
		};

		xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
		xhr.send(formData);
	});
};

export const getExpenses = async (token: string, filters: ExpenseFilters = {}) => {
	const query = toQueryString(filters);
	return apiRequest<Expense[]>(`/expenses${query}`, { token });
};

export const updateExpense = async (
	token: string,
	id: string,
	payload: Partial<{
		amount: number;
		categoryId: string;
		date: string;
		description?: string;
		receiptUrl?: string;
		paymentMethod: Expense['paymentMethod'];
		isRecurring: boolean;
		recurringSchedule: Expense['recurringSchedule'];
	}>
) => {
	const res = await apiRequest<Expense>(`/expenses/${id}`, { method: 'PUT', token, body: payload });
	return res.data as Expense;
};

export const deleteExpense = async (token: string, id: string) => {
	return apiRequest<undefined>(`/expenses/${id}`, { method: 'DELETE', token });
};

export const getExpenseStatsByCategory = async (token: string, filters: Pick<ExpenseFilters, 'startDate' | 'endDate'> = {}) => {
	const query = toQueryString(filters);
	return apiRequest<Array<{ name: string; icon: string; color: string; total: number; count: number }>>(
		`/expenses/stats/by-category${query}`,
		{ token }
	);
};

export const getExpenseMonthlyTrends = async (token: string) => {
	return apiRequest<Array<{ _id: { year: number; month: number }; total: number; count: number }>>('/expenses/stats/trends', {
		token,
	});
};
