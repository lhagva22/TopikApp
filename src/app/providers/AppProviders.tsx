import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProgressProvider } from '../../features/progress';
import { SuccessToast } from '../../shared/components/feedback';
import { AppNavigator } from '../navigation/AppNavigator';
import { useAppStore } from '../store';

function AppToastHost() {
  const { toastMessage, clearToast } = useAppStore();

  return <SuccessToast message={toastMessage} onClose={clearToast} />;
}

export function AppProviders() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          <NavigationContainer>
            <AppNavigator />
            <AppToastHost />
          </NavigationContainer>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
