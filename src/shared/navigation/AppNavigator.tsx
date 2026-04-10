// src/shared/navigation/AppNavigator.tsx
import React from 'react';
import { useAuth } from '../../store/authStore';
import DrawerNavigator from './DrawerNavigation';
import AuthStack from './AuthStack';

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  return (    <DrawerNavigator/>

  );


};

export default AppNavigator;