// src/shared/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import DrawerNavigator from './DrawerNavigation';
import AuthStack from './AuthStack';

const AppNavigator = () => {
  const isRegistered = useAuthStore((state) => state.isRegistered);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (!isHydrated) {
    return null;
  }

  return (
    <NavigationContainer>
      {/* {isRegistered() ? <DrawerNavigator /> : <AuthStack />} */}
      <DrawerNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;