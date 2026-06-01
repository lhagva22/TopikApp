import type { ProgressRepository } from './repositories';

export const createProgressUseCases = (progressRepository: ProgressRepository) => ({
  getProgress: () => progressRepository.getProgress(),
  getResultDetail: (id: string, force?: boolean) => progressRepository.getResultDetail(id, force),
});
