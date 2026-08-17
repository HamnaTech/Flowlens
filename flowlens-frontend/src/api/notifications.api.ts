import { apiClient, unwrap } from '@/lib/api-client';
import type { AppNotification } from '@/types/api';

export const notificationsApi = {
  list: (unreadOnly?: boolean) => unwrap<AppNotification[]>(apiClient.get('/notifications', { params: { unreadOnly } })),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
};
