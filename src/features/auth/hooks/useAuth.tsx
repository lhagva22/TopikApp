// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

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

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      navigation.navigate('Home' as never);
    }
    return success;
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    console.log(" useauth",email, password, name)
    const success = await register(email, password, name);
    console.log(" useauth",success)
    if (success) {
      navigation.navigate('Login' as never);
    }
    return success;
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login' as never);
  };

  return {
    // State
    user,
    token,
    isLoading,
    isAuthenticated,
    isGuest,
    error,
    
    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    loadProfile,
    setGuestUser,
    clearError,
  };
};