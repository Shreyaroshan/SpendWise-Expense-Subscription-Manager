import { apiRequest } from './apiClient';

export type Category = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  type: 'expense' | 'subscription' | 'both';
  isDefault: boolean;
};

export const getCategories = async (token: string) => {
  const res = await apiRequest<Category[]>('/categories', { token });
  return res.data as Category[];
};
