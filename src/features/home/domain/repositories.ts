import type {
  LevelTestExamType,
  LevelTestStartResponse,
} from './types';

export interface HomeRepository {
  startLevelTest(examType?: LevelTestExamType): Promise<LevelTestStartResponse>;
}
