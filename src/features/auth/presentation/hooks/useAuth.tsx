import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { RootStackParamList } from '../../../../app/navigation/types';
import { useAppStore } from '../../../../app/store';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const navigation = useNavigation();
  const showToast = useAppStore((state) => state.showToast);

  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    isGuest,
    error,
    login,
    googleLogin,
    register,
    logout,
    loadProfile,
    setGuestUser,
    clearError,
  } = useAuthStore();

  const getRootNavigation = () =>
    navigation.getParent<NavigationProp<RootStackParamList>>() ??
    (navigation as NavigationProp<RootStackParamList>);

  const dismissAuthFlow = () => {
    const rootNavigation = getRootNavigation();

    if (rootNavigation.canGoBack()) {
      rootNavigation.goBack();
      return;
    }

    rootNavigation.navigate('App', { screen: 'Home' });
  };

  const goToLogin = () => {
    getRootNavigation().navigate('Auth', { screen: 'Login' });
  };

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);

    if (success) {
      dismissAuthFlow();
      showToast('Амжилттай нэвтэрлээ.');
    }

    return success;
  };

  const handleGoogleLogin = async (idToken: string) => {
    const success = await googleLogin(idToken);

    if (success) {
      dismissAuthFlow();
      showToast('Амжилттай нэвтэрлээ.');
    }

    return success;
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    const success = await register(email, password, name);

    if (success) {
      navigation.navigate('Login' as never, {
        successMessage: 'Бүртгэл амжилттай. Одоо нэвтэрнэ үү.',
      } as never);
    }

    return success;
  };

  const handleLogout = async () => {
    await logout();
    getRootNavigation().navigate('App', { screen: 'Home' });
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isGuest,
    error,
    login: handleLogin,
    googleLogin: handleGoogleLogin,
    register: handleRegister,
    logout: handleLogout,
    loadProfile,
    setGuestUser,
    clearError,
    goToLogin,
  };
};
