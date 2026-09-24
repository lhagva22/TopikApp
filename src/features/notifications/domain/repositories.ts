export interface NotificationRepository {
  registerToken(
    token: string,
    platform: 'android' | 'ios',
    installationId: string,
  ): Promise<{ success: boolean; error?: string }>;
  unregisterToken(token: string): Promise<{ success: boolean; error?: string }>;
}
