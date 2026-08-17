import { apiClient, unwrap } from '@/lib/api-client';
import type { AuthResponse, PublicUser } from '@/types/api';

export const authApi = {
  register: (input: { email: string; password: string; displayName: string }) =>
    unwrap<AuthResponse>(apiClient.post('/auth/register', input)),

  login: (input: { email: string; password: string }) =>
    unwrap<AuthResponse>(apiClient.post('/auth/login', input)),

  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),

  logoutAll: () => apiClient.post('/auth/logout-all'),

  me: () => unwrap<PublicUser>(apiClient.get('/auth/me')),

  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) => apiClient.post('/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),

  verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),

  resendVerification: () => apiClient.post('/auth/resend-verification'),

  listSessions: () => unwrap(apiClient.get('/auth/sessions')),

  revokeSession: (id: string) => apiClient.post(`/auth/sessions/${id}/revoke`),
};
