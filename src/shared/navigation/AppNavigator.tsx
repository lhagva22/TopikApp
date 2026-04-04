// src/shared/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import DrawerNavigator from './DrawerNavigation';
import AuthStack from './AuthStack';
const AppNavigator = () => {
  const { isRegistered, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null; // Loading screen
  }

  return (
    <NavigationContainer>
      {isRegistered() ? <DrawerNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;