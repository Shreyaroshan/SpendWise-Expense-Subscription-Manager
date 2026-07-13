import { apiRequest } from './apiClient';

export type BudgetProgress = {
	_id: string;
	categoryId: {
		_id: string;
		name: string;
		icon?: string;
		color?: string;
	};
	amount: number;
	period: 'monthly';
	budgetYear?: number;
	budgetMonth?: number;
	alertThreshold: number;
	spent: number;
	remaining: number;
	percentage: number;
	isThresholdReached: boolean;
	isExceeded: boolean;
};

export const createBudget = async (
	token: string,
	payload: { categoryId: string; amount: number; alertThreshold?: number }
) => {
	const res = await apiRequest('/budgets', { method: 'POST', token, body: payload });
	return res.data;
};

export const getBudgetProgress = async (token: string) => {
	const res = await apiRequest<BudgetProgress[]>('/budgets/progress', { token });
	return res.data as BudgetProgress[];
};

export const updateBudget = async (
	token: string,
	id: string,
	payload: Partial<{ categoryId: string; amount: number; alertThreshold: number }>
) => {
	const res = await apiRequest(`/budgets/${id}`, { method: 'PUT', token, body: payload });
	return res.data;
};

export const deleteBudget = async (token: string, id: string) => {
	return apiRequest(`/budgets/${id}`, { method: 'DELETE', token });
};
