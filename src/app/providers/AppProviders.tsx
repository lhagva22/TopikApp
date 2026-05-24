import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

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
    <GestureHandlerRootView style={styles.root}>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
