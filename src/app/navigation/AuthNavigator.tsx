import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForgotPasswordScreen, LoginScreen, SigninScreen } from '../../features/auth';
import type { AuthStackParamList } from '../../features/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthSafeArea = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.root}>
    <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" translucent />
    <SafeAreaView style={styles.statusBarArea} edges={['top']} />
    <SafeAreaView style={styles.content} edges={['right', 'bottom', 'left']}>
      {children}
    </SafeAreaView>
  </View>
);

const withAuthSafeArea = <P extends object>(Component: React.ComponentType<P>) =>
  function AuthSafeAreaScreen(props: P) {
    return (
      <AuthSafeArea>
        <Component {...props} />
      </AuthSafeArea>
    );
  };

const LoginScreenWrapper = withAuthSafeArea(LoginScreen);
const SigninScreenWrapper = withAuthSafeArea(SigninScreen);
const ForgotPasswordScreenWrapper = withAuthSafeArea(ForgotPasswordScreen);

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name="Login" component={LoginScreenWrapper} />
      <Stack.Screen name="Signin" component={SigninScreenWrapper} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreenWrapper} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  statusBarArea: { backgroundColor: '#F1F5F9' },
  content: { flex: 1, backgroundColor: '#fff' },
});
