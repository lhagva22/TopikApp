import { apiRequest, ENDPOINTS } from '../../../../core/api/apiClient';
import type { ProgressDetailResponse, ProgressResponse } from '../../domain/repositories';

const resultDetailCache = new Map<string, ProgressDetailResponse>();

export const progressApi = {
  getProgress: () => apiRequest<ProgressResponse>(ENDPOINTS.PROGRESS.SUMMARY),
  getResultDetail: async (id: string, force = false) => {
    if (!force) {
      const cached = resultDetailCache.get(id);
      if (cached) {
        return cached;
      }
    }

    const response = await apiRequest<ProgressDetailResponse>(ENDPOINTS.PROGRESS.DETAIL(id));

    if (response.success && response.detail) {
      resultDetailCache.set(id, response);
    }

    return response;
  },
};
