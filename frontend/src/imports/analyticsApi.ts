import { getApiBaseUrl } from './apiClient';

export const getDashboardAnalytics = async (token: string, options?: { period?: '1M' | '3M' | '6M' | '1Y' }) => {
	const params = new URLSearchParams();
	if (options?.period) params.set('period', options.period);
	const query = params.toString();

	const response = await fetch(`${getApiBaseUrl()}/analytics/dashboard${query ? `?${query}` : ''}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const payload = await response.json();
	if (!response.ok || !payload.success) {
		throw new Error(payload.message || 'Failed to fetch dashboard analytics');
	}

	return payload.data;
};

export const downloadTransactionsCsv = async (token: string, filters?: { startDate?: string; endDate?: string }) => {
	const params = new URLSearchParams();
	if (filters?.startDate) params.set('startDate', filters.startDate);
	if (filters?.endDate) params.set('endDate', filters.endDate);

	const query = params.toString();
	const response = await fetch(`${getApiBaseUrl()}/analytics/export${query ? `?${query}` : ''}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		throw new Error('Failed to export CSV');
	}

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = 'transactions.csv';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
};
