import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../navigation/types';

export type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
export type SigninScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signin'>;
export type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;
