import { authRepository } from '../../auth/data/authRepository';
import { createAuthUseCases } from '../../auth/domain/useCases';
import { examRepository } from '../data/examRepository';
import { createExamUseCases } from '../domain/useCases';

export const examUseCases = createExamUseCases(examRepository);
export const examAuthUseCases = createAuthUseCases(authRepository);
