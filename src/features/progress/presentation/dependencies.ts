import { progressRepository } from '../data/progressRepository';
import { createProgressUseCases } from '../domain/useCases';

export const progressUseCases = createProgressUseCases(progressRepository);
