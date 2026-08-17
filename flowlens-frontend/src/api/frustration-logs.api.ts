import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client';
import type { FrustrationLog, LogSource } from '@/types/api';

export interface CreateLogInput {
  description: string;
  frustrationLevel: number;
  source?: LogSource;
  estimatedMinutesLost?: number;
  categoryId?: string;
  organizationId?: string;
  occurredAt?: string;
  location?: string;
  tags?: string[];
}

export type UpdateLogInput = Partial<Omit<CreateLogInput, 'organizationId' | 'source'>>;

export interface ListLogsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  source?: LogSource;
  tag?: string;
  minFrustrationLevel?: number;
  maxFrustrationLevel?: number;
  minFrictionScore?: number;
  maxFrictionScore?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'occurredAt' | 'createdAt' | 'frictionScore' | 'frustrationLevel';
  sortOrder?: 'asc' | 'desc';
}

export const frustrationLogsApi = {
  list: (params?: ListLogsParams) => unwrapPaginated<FrustrationLog>(apiClient.get('/frustration-logs', { params })),

  get: (id: string) => unwrap<FrustrationLog>(apiClient.get(`/frustration-logs/${id}`)),

  create: (input: CreateLogInput) => unwrap<FrustrationLog>(apiClient.post('/frustration-logs', input)),

  update: (id: string, input: UpdateLogInput) => unwrap<FrustrationLog>(apiClient.patch(`/frustration-logs/${id}`, input)),

  remove: (id: string) => apiClient.delete(`/frustration-logs/${id}`),

  suggestTags: (search: string) => unwrap<string[]>(apiClient.get('/frustration-logs/meta/tags', { params: { search } })),

  uploadAttachment: (logId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap(apiClient.post(`/frustration-logs/${logId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },

  deleteAttachment: (logId: string, attachmentId: string) => apiClient.delete(`/frustration-logs/${logId}/attachments/${attachmentId}`),

  listForOrg: (organizationId: string, params?: ListLogsParams & { mineOnly?: boolean }) =>
    unwrapPaginated<FrustrationLog>(apiClient.get(`/organizations/${organizationId}/frustration-logs`, { params })),
};
