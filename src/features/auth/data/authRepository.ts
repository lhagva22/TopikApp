import type { AuthRepository } from '../domain/repositories';
import { authApi } from './api/authApi';

export const authRepository: AuthRepository = authApi;
