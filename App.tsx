// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import DrawerNavigator from './src/shared/navigation/DrawerNavigation';
import AppNavigator from './src/shared/navigation/AppNavigator';
import { useSharedStore } from './src/store/sharedStore';
import { ProgressProvider } from './src/store/ProgressContext';
import { loadLevelTestResults } from './src/features/exam/leveltestexam/levelTestStore';

const App = () => {
 const { initAuth, isLoading, user, isGuest, isAuthenticated } = useSharedStore();

  useEffect(() => {
    initAuth();
     loadLevelTestResults();
  }, []);

  useEffect(() => {
    console.log('User changed da:', user);
    console.log('isGuest:', isGuest);
    console.log('isAuthenticated:', isAuthenticated);
  }, [user, isGuest, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  console.log('Rendering with user:', user?.status);


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