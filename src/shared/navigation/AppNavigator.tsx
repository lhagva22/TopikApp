// src/shared/navigation/AppNavigator.tsx
import React from 'react';
import { useSharedStore } from '../../store/sharedStore';  // ✅ useSharedStore
import DrawerNavigator from './DrawerNavigation';
import AuthStack from './AuthStack';

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useSharedStore();  // ✅ useSharedStore

  if (isLoading) {
    return null;
  }

  // Нэвтэрсэн бол DrawerNavigator, үгүй бол AuthStack
  return<DrawerNavigator />; 
};

export default AppNavigator;