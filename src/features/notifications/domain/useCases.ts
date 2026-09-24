import type { NotificationRepository } from './repositories';

export const createNotificationUseCases = (repository: NotificationRepository) => ({
  registerToken: (token: string, platform: 'android' | 'ios', installationId: string) =>
    repository.registerToken(token, platform, installationId),
  unregisterToken: (token: string) => repository.unregisterToken(token),
});
