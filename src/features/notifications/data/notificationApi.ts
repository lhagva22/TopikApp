import { apiRequest, post } from '../../../core/api/apiClient';
import type { NotificationRepository } from '../domain/repositories';

export const notificationRepository: NotificationRepository = {
  registerToken: (token, platform, installationId) =>
    post<{ success: boolean; error?: string }>('/notifications/token', {
      token,
      platform,
      installationId,
    }),
  unregisterToken: token =>
    apiRequest<{ success: boolean; error?: string }>('/notifications/token', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    }),
};
