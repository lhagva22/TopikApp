import type { AuthRepository } from '../../auth/domain/repositories';
import type { HomeRepository } from './repositories';
import type { LevelTestExamType } from './types';

export const createHomeUseCases = (
  homeRepository: HomeRepository,
  authRepository: AuthRepository,
) => ({
  getProfile: () => authRepository.getProfile(),
  startLevelTest: (examType?: LevelTestExamType) => homeRepository.startLevelTest(examType),
});
