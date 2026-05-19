import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

const GOOGLE_WEB_CLIENT_ID: string = '229031962647-bb3hs3471lua0r3t7u9h0l2gs6s76ok2.apps.googleusercontent.com';

let isConfigured = false;


const assertGoogleClientConfigured = () => {
  if (
    !GOOGLE_WEB_CLIENT_ID ||
    GOOGLE_WEB_CLIENT_ID === 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com'
  ) {
    throw new Error(
      'Google Web Client ID тохируулаагүй байна. src/features/auth/services/googleSignIn.ts дотор GOOGLE_WEB_CLIENT_ID-г солино уу.',
    );
  }
};

export const configureGoogleSignIn = () => {
  if (isConfigured) {
    return;
  }

  assertGoogleClientConfigured();

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });

  isConfigured = true;
};

export const getGoogleIdToken = async (): Promise<string | null> => {
  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();

  if (response.type !== 'success') {
    return null;
  }

  if (!response.data.idToken) {
    throw new Error('Google idToken олдсонгүй. Web Client ID тохиргоогоо шалгана уу.');
  }

  return response.data.idToken;
};

export const getGoogleSignInErrorMessage = (error: unknown) => {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }

    if (error.code === statusCodes.IN_PROGRESS) {
      return 'Google нэвтрэлт аль хэдийн эхэлсэн байна.';
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services боломжгүй байна.';
    }
  }

  return error instanceof Error
    ? error.message
    : 'Google ашиглан нэвтрэхэд алдаа гарлаа.';
};
