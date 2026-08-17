import { apiClient, unwrap } from '@/lib/api-client';
import type { Organization, OrganizationMember, OrganizationInvite, OrgRole } from '@/types/api';

export const organizationsApi = {
  list: () => unwrap<Organization[]>(apiClient.get('/organizations')),

  get: (id: string) => unwrap<Organization>(apiClient.get(`/organizations/${id}`)),

  create: (input: { name: string; slug?: string }) => unwrap<Organization>(apiClient.post('/organizations', input)),

  update: (id: string, input: { name?: string; logoUrl?: string }) => unwrap<Organization>(apiClient.patch(`/organizations/${id}`, input)),

  remove: (id: string) => apiClient.delete(`/organizations/${id}`),

  transferOwnership: (id: string, newOwnerId: string) => apiClient.post(`/organizations/${id}/transfer-ownership`, { newOwnerId }),
};

export const teamsApi = {
  listMembers: (organizationId: string) => unwrap<OrganizationMember[]>(apiClient.get(`/organizations/${organizationId}/team/members`)),

  removeMember: (organizationId: string, userId: string) => apiClient.delete(`/organizations/${organizationId}/team/members/${userId}`),

  leave: (organizationId: string) => apiClient.post(`/organizations/${organizationId}/team/leave`),

  updateMemberRole: (organizationId: string, userId: string, role: OrgRole) =>
    apiClient.patch(`/organizations/${organizationId}/team/members/${userId}/role`, { role }),

  invite: (organizationId: string, input: { email: string; role: OrgRole }) =>
    unwrap<OrganizationInvite>(apiClient.post(`/organizations/${organizationId}/team/invites`, input)),

  listInvites: (organizationId: string) => unwrap<OrganizationInvite[]>(apiClient.get(`/organizations/${organizationId}/team/invites`)),

  revokeInvite: (organizationId: string, inviteId: string) => apiClient.delete(`/organizations/${organizationId}/team/invites/${inviteId}`),

  acceptInvite: (token: string) => apiClient.post('/invites/accept', { token }),
};
