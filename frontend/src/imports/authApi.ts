import { apiRequest } from './apiClient';

export type User = {
	_id: string;
	name: string;
	email: string;
	phoneNumber?: string;
	avatarUrl?: string;
	currency: string;
	timezone?: string;
	preferences?: {
		dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
		weekStartsOn: 'Sunday' | 'Monday';
		theme: 'dark' | 'light';
	};
	notifPrefs?: {
		email: boolean;
		inApp: boolean;
		renewalReminder: boolean;
		budgetAlert: boolean;
		budgetAlert80: boolean;
		budgetAlert100: boolean;
		monthlySummary: boolean;
		alertThreshold?: number;
	};
};

export type AuthResponse = User & { token: string };

export const registerUser = async (payload: { name: string; email: string; password: string }) => {
	const res = await apiRequest<AuthResponse>('/auth/register', {
		method: 'POST',
		body: payload,
	});
	return res.data as AuthResponse;
};

export const loginUser = async (payload: { email: string; password: string }) => {
	const res = await apiRequest<AuthResponse>('/auth/login', {
		method: 'POST',
		body: payload,
	});
	return res.data as AuthResponse;
};

export const getCurrentUser = async (token: string) => {
	const res = await apiRequest<User>('/auth/me', { token });
	return res.data as User;
};

export const updateProfile = async (
	token: string,
	payload: Partial<Pick<User, 'name' | 'phoneNumber' | 'avatarUrl' | 'currency' | 'timezone' | 'notifPrefs' | 'preferences'>>
) => {
	const res = await apiRequest<User>('/auth/profile', {
		method: 'PUT',
		token,
		body: payload,
	});
	return res.data as User;
};

export const changePassword = async (token: string, payload: { currentPassword: string; newPassword: string }) => {
	return apiRequest('/auth/change-password', {
		method: 'PUT',
		token,
		body: payload,
	});
};
