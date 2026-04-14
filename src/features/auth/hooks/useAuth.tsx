// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';
import { useSharedStore } from '../../../store/sharedStore';
import { useNavigation } from '@react-navigation/native';

export const useAuth = () => {
  const navigation = useNavigation();
  
  const { 
    login: authLogin, 
    register: authRegister, 
    logout: authLogout,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  
  const { user, token, isAuthenticated, isGuest } = useSharedStore();

  const handleLogin = async (email: string, password: string) => {
    const success = await authLogin(email, password);
    if (success) {
      navigation.navigate('Home' as never);
    }
    return success;
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    const success = await authRegister(email, password, name);
    if (success) {
      navigation.navigate('Login' as never);
    }
    return success;
  };

  const handleLogout = async () => {
    await authLogout();
    navigation.navigate('Login' as never);
  };

  return {
    user,
    token,
    isAuthenticated,
    isGuest,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  };
};