import { notificationRepository } from '../data/notificationApi';
import { createNotificationUseCases } from '../domain/useCases';

export const notificationUseCases = createNotificationUseCases(notificationRepository);
