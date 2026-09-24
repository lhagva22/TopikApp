import React from 'react';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { ProgressProvider } from '../../features/progress';
import { NotificationBootstrap } from '../../features/notifications';
import { SuccessToast } from '../../shared/components/feedback';
import { AppNavigator } from '../navigation/AppNavigator';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppToastHost() {
  const { toastMessage, clearToast } = useAppStore();

  return <SuccessToast message={toastMessage} onClose={clearToast} />;
}

export function AppProviders() {
  const [currentRouteName, setCurrentRouteName] = React.useState<string>();
  const syncCurrentRoute = React.useCallback(() => {
    setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ProgressProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={syncCurrentRoute}
            onStateChange={syncCurrentRoute}
          >
            <AppNavigator />
            <AppToastHost />
          </NavigationContainer>
          <NotificationBootstrap suppressBanner={currentRouteName === 'ExamInterface'} />
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
