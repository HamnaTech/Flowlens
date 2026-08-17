import { apiClient, unwrapPaginated, unwrap } from '@/lib/api-client';
import type { Category } from '@/types/api';

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

export const categoriesApi = {
  list: (params?: { search?: string; page?: number; pageSize?: number }) =>
    unwrapPaginated<Category>(apiClient.get('/categories', { params })),

  create: (input: CreateCategoryInput) => unwrap<Category>(apiClient.post('/categories', input)),

  update: (id: string, input: Partial<CreateCategoryInput>) => unwrap<Category>(apiClient.patch(`/categories/${id}`, input)),

  remove: (id: string) => apiClient.delete(`/categories/${id}`),

  listForOrg: (organizationId: string, params?: { search?: string }) =>
    unwrapPaginated<Category>(apiClient.get(`/organizations/${organizationId}/categories`, { params })),

  createForOrg: (organizationId: string, input: CreateCategoryInput) =>
    unwrap<Category>(apiClient.post(`/organizations/${organizationId}/categories`, input)),
};
