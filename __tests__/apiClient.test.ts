import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { apiRequest } from '../src/core/api/apiClient';

describe('apiRequest response parsing', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a parsed JSON body', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 200,
      text: async () => '{"success":true}',
    } as Response);

    await expect(apiRequest('/auth/login', { method: 'POST' })).resolves.toEqual({ success: true });
  });

  it('reports an empty response with endpoint and status context', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 500,
      text: async () => '',
    } as Response);

    await expect(apiRequest('/auth/login', { method: 'POST' })).rejects.toThrow(
      'API returned an empty response (500) for /auth/login.',
    );

    errorLog.mockRestore();
  });
});
