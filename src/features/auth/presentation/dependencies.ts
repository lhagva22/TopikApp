import { authRepository } from '../data/authRepository';
import { googleAuthProvider } from '../data/googleAuthProvider';
import {
  createAuthUseCases,
  createGoogleAuthUseCases,
} from '../domain/useCases';

export const authUseCases = createAuthUseCases(authRepository);
export const googleAuthUseCases = createGoogleAuthUseCases(googleAuthProvider);
