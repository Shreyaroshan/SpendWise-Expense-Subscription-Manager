import { createContext, useEffect, useMemo, useState } from 'react';
import {
	getCurrentUser,
	loginUser,
	registerUser,
	updateProfile as updateProfileApi,
	type User,
} from '../../imports/authApi';

type AuthContextType = {
	user: User | null;
	token: string | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string) => Promise<void>;
	logout: () => void;
	refreshUser: () => Promise<void>;
	updateProfile: (payload: Partial<Pick<User, 'name' | 'phoneNumber' | 'avatarUrl' | 'currency' | 'timezone' | 'notifPrefs' | 'preferences'>>) => Promise<void>;
};

const AUTH_STORAGE_KEY = 'spendwise_auth_token';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
	children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_STORAGE_KEY));
	const [loading, setLoading] = useState(true);

	const persistToken = (nextToken: string | null) => {
		if (!nextToken) {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			return;
		}
		localStorage.setItem(AUTH_STORAGE_KEY, nextToken);
	};

	const refreshUser = async () => {
		if (!token) {
			setUser(null);
			return;
		}

		const me = await getCurrentUser(token);
		setUser(me);
	};

	useEffect(() => {
		const bootstrapAuth = async () => {
			if (!token) {
				setLoading(false);
				return;
			}

			try {
				await refreshUser();
			} catch (error) {
				console.error('Auth bootstrap failed:', error);
				setToken(null);
				setUser(null);
				persistToken(null);
			} finally {
				setLoading(false);
			}
		};

		bootstrapAuth();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const login = async (email: string, password: string) => {
		const data = await loginUser({ email, password });
		setToken(data.token);
		persistToken(data.token);
		const { token: _token, ...rest } = data;
		setUser(rest);
	};

	const register = async (name: string, email: string, password: string) => {
		const data = await registerUser({ name, email, password });
		setToken(data.token);
		persistToken(data.token);
		const { token: _token, ...rest } = data;
		setUser(rest);
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		persistToken(null);
	};

	const updateProfile = async (
		payload: Partial<Pick<User, 'name' | 'phoneNumber' | 'avatarUrl' | 'currency' | 'timezone' | 'notifPrefs' | 'preferences'>>
	) => {
		if (!token) throw new Error('Not authenticated');
		const updated = await updateProfileApi(token, payload);
		setUser(updated);
	};

	const value = useMemo(
		() => ({ user, token, loading, login, register, logout, refreshUser, updateProfile }),
		[user, token, loading]
	);

	useEffect(() => {
		const theme = user?.preferences?.theme || 'dark';
		document.documentElement.classList.toggle('theme-light', theme === 'light');
		document.documentElement.classList.toggle('theme-dark', theme !== 'light');
	}, [user?.preferences?.theme]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
