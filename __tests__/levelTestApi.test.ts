import { describe, expect, it, jest } from '@jest/globals';

import { apiRequest, ENDPOINTS } from '../src/core/api/apiClient';
import { examApi } from '../src/features/exam/data/api/examApi';

jest.mock('../src/core/api/apiClient', () => ({
  apiRequest: jest.fn(),
  ENDPOINTS: {
    LEVEL_TEST: { START: '/level-test/start' },
  },
}));

describe('level test API', () => {
  it('requests the TOPIK II continuation explicitly', async () => {
    jest.mocked(apiRequest).mockResolvedValue({ success: true } as never);

    await examApi.startLevelTest('TOPIK_II');

    expect(apiRequest).toHaveBeenCalledWith(ENDPOINTS.LEVEL_TEST.START, {
      method: 'POST',
      body: JSON.stringify({ examType: 'TOPIK_II' }),
    });
  });
});
