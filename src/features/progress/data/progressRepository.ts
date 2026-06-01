import type { ProgressRepository } from '../domain/repositories';
import { progressApi } from './api/progressApi';

export const progressRepository: ProgressRepository = progressApi;
