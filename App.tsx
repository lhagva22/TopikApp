import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppProviders, useAppStore } from './src/app';

function AppBootstrap() {
  const { initAuth, isInitialized, isLoading } = useAppStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      void initAuth();
    }
  }, [initAuth]);

  if (isLoading || !isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <AppProviders />;
}

export default function App() {
  return <AppBootstrap />;
}
