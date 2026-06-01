import type { GoogleAuthProvider } from '../domain/repositories';
import {
  getGoogleIdToken,
  getGoogleSignInErrorMessage,
} from './services/googleSignIn';

export const googleAuthProvider: GoogleAuthProvider = {
  getIdToken: getGoogleIdToken,
  getErrorMessage: getGoogleSignInErrorMessage,
};
