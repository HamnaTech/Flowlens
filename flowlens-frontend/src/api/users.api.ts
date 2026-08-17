import { apiClient, unwrap } from '@/lib/api-client';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  platformRole: string;
  emailVerifiedAt: string | null;
  onboardingStep: number;
  createdAt: string;
  _count: { frustrationLogs: number; organizationMemberships: number };
}

export const usersApi = {
  getProfile: () => unwrap<UserProfile>(apiClient.get('/users/me')),

  updateProfile: (input: { displayName?: string; avatarUrl?: string; timezone?: string }) =>
    unwrap<UserProfile>(apiClient.patch('/users/me', input)),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap<UserProfile>(apiClient.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },

  // Real, pre-existing backend endpoint — not invented for this feature.
  // Used purely as an onboarding-completion flag: step 0 = never
  // onboarded, any higher value = done. No new backend field required.
  updateOnboardingStep: (step: number) => unwrap<{ onboardingStep: number }>(apiClient.patch(`/users/me/onboarding-step/${step}`)),

  deactivateAccount: () => apiClient.delete('/users/me'),
};
