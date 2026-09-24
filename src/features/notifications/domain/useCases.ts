import type { NotificationRepository } from './repositories';

export const createNotificationUseCases = (repository: NotificationRepository) => ({
  registerToken: (token: string, platform: 'android' | 'ios') => repository.registerToken(token, platform),
  unregisterToken: (token: string) => repository.unregisterToken(token),
});
