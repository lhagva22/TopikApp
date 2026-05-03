import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { RootStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const navigation = useNavigation();

  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    isGuest,
    error,
    login,
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
    }

    return success;
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    const success = await register(email, password, name);

    if (success) {
      dismissAuthFlow();
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
    register: handleRegister,
    logout: handleLogout,
    loadProfile,
    setGuestUser,
    clearError,
    goToLogin,
  };
};
