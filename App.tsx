// App.tsx
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import DrawerNavigator from './src/shared/navigation/DrawerNavigation';
import { useSharedStore } from './src/store/sharedStore';
import { ProgressProvider } from './src/store/ProgressContext';
import { loadLevelTestResults } from './src/features/exam/leveltestexam/levelTestStore';

const App = () => {
  const { initAuth, isLoading, user, isGuest, isAuthenticated, isInitialized } = useSharedStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // console.log('🔁 App mounted, calling initAuth');
      initAuth();
      // loadLevelTestResults();
    }
  }, []);

  useEffect(() => {
    console.log("user: ", user);
  }, [user, isGuest, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider> 
        <ProgressProvider>
          <NavigationContainer>
            <DrawerNavigator />
          </NavigationContainer>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;