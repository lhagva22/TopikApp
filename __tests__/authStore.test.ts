import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { authApi } from '../src/features/auth/data/api/authApi';
import { useAuthStore } from '../src/features/auth/presentation/store/authStore';

jest.mock('../src/features/auth/data/api/authApi', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

describe('auth store session flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'student@example.com',
        name: 'Student',
        status: 'registered',
      },
      token: 'token',
      isLoading: false,
      isAuthenticated: true,
      isGuest: false,
      error: null,
    });
  });

  it('stores the authenticated session after a successful login', async () => {
    jest.mocked(authApi.login).mockResolvedValue({
      success: true,
      user: {
        id: 'user-1',
        email: 'student@example.com',
        name: 'Student',
        status: 'registered',
      },
      session: {
        access_token: 'new-token',
        refresh_token: 'refresh-token',
      },
    });

    const result = await useAuthStore.getState().login('student@example.com', 'password');

    expect(result).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('new-token');
  });

  it('clears the local session when server logout succeeds', async () => {
    jest.mocked(authApi.logout).mockResolvedValue({ success: true });

    await useAuthStore.getState().logout();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['token', 'refreshToken']);
    expect(useAuthStore.getState().isGuest).toBe(true);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('still clears the local session when the server is unavailable', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(authApi.logout).mockRejectedValue(new Error('offline'));

    await useAuthStore.getState().logout();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['token', 'refreshToken']);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isGuest).toBe(true);
    errorLog.mockRestore();
  });
});
