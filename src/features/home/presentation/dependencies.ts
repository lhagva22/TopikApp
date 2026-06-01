import { authRepository } from '../../auth/data/authRepository';
import { homeRepository } from '../data/homeRepository';
import { createHomeUseCases } from '../domain/useCases';

export const homeUseCases = createHomeUseCases(homeRepository, authRepository);
