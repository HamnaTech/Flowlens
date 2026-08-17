import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client';
import type { AIReport, ReportPeriod, ReportStatus } from '@/types/api';

export interface CreateReportInput {
  period: ReportPeriod;
  periodStart?: string;
  periodEnd?: string;
}

export interface ListReportsParams {
  page?: number;
  pageSize?: number;
  period?: ReportPeriod;
  status?: ReportStatus;
}

export const reportsApi = {
  list: (params?: ListReportsParams) => unwrapPaginated<AIReport>(apiClient.get('/reports', { params })),

  get: (id: string) => unwrap<AIReport>(apiClient.get(`/reports/${id}`)),

  create: (input: CreateReportInput) => unwrap<AIReport>(apiClient.post('/reports', input)),

  listForOrg: (organizationId: string, params?: ListReportsParams) =>
    unwrapPaginated<AIReport>(apiClient.get(`/organizations/${organizationId}/reports`, { params })),

  getForOrg: (organizationId: string, id: string) => unwrap<AIReport>(apiClient.get(`/organizations/${organizationId}/reports/${id}`)),

  createForOrg: (organizationId: string, input: CreateReportInput) =>
    unwrap<AIReport>(apiClient.post(`/organizations/${organizationId}/reports`, input)),
};
