import type { ExamRepository } from '../domain/repositories';
import { examApi } from './api/examApi';

export const examRepository: ExamRepository = examApi;
