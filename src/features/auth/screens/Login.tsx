import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import GoogleIcon from '../../../shared/assets/images/googlesvg';
import AppleIcon from '../../../shared/assets/images/applesvg';
import SectionTitle from '../../../shared/components/atoms/sectionTitle';
import { InlineMessage } from '../../../shared/components/feedback';
import CustomButton from '../../../shared/components/molecules/button';
import { Card, CardTitle } from '../../../shared/components/molecules/card';
import { getErrorMessage } from '../../../shared/lib/errors';
import { useAuth } from '../hooks/useAuth';
import type { LoginScreenNavigationProp } from './types';

const Login = () => {
  const { login, error, clearError } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleGoBack = () => {
    navigation.popToTop();
  };

  const handleLogin = async () => {
    setFormError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setFormError('И-мэйл болон нууц үгээ оруулна уу.');
      return;
    }

    const success = await login(email.trim(), password);

    if (!success) {
      setFormError(getErrorMessage(error, 'Нэвтрэхэд алдаа гарлаа.'));
      clearError();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={handleGoBack}>
        <Icon name="arrow-back-outline" size={24} color="#333" />
      </TouchableOpacity>

      <SectionTitle textStyle={styles.titleText} viewStyle={styles.titleWrapper}>
        Нэвтрэх
      </SectionTitle>

      <InlineMessage
        message={formError}
        containerStyle={styles.message}
      />

      <View style={styles.socialList}>
        <Card style={styles.socialCard}>
          <GoogleIcon width={24} height={24} />
          <CardTitle style={styles.socialText}>Google ашиглан нэвтрэх</CardTitle>
        </Card>
        <Card style={styles.socialCard}>
          <AppleIcon width={24} height={24} />
          <CardTitle style={styles.socialText}>Apple ID ашиглан нэвтрэх</CardTitle>
        </Card>
      </View>

      <View style={styles.form}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => emailRef.current?.focus()}>
          <Text style={styles.label}>И-мэйл</Text>
          <View style={[styles.inputWrapper, activeInput === 'email' && styles.inputWrapperActive]}>
            <Icon name="person-outline" size={20} color={activeInput === 'email' ? '#007AFF' : '#B1B1B1'} />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="И-мэйлээ оруулна уу"
              placeholderTextColor="#B1B1B1"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setActiveInput('email')}
              onBlur={() => setActiveInput(null)}
              selectionColor="#007AFF"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => passwordRef.current?.focus()}>
          <Text style={styles.label}>Нууц үг</Text>
          <View style={[styles.inputWrapper, activeInput === 'password' && styles.inputWrapperActive]}>
            <Icon
              name="lock-closed-outline"
              size={20}
              color={activeInput === 'password' ? '#007AFF' : '#B1B1B1'}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Нууц үгээ оруулна уу"
              placeholderTextColor="#B1B1B1"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setActiveInput('password')}
              onBlur={() => setActiveInput(null)}
              secureTextEntry
              selectionColor="#007AFF"
            />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.linkText}>Нууц үг мартсан</Text>
      </TouchableOpacity>

      <CustomButton title="Нэвтрэх" requiredStatus="guest" onPress={handleLogin} />

      <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Signin')}>
        <Text style={styles.linkText}>Бүртгүүлэх</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 48,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  message: {
    marginBottom: 20,
  },
  socialList: {
    flexDirection: 'column',
    gap: 5,
    marginBottom: 50,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    marginLeft: 10,
    fontSize: 16,
  },
  form: {
    gap: 24,
  },
  label: {
    color: '#B1B1B1',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D1D1',
    backgroundColor: '#FFFFFF',
  },
  inputWrapperActive: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  input: {
    paddingLeft: 10,
    color: '#000000',
    flex: 1,
    fontSize: 16,
  },
  forgotButton: {
    marginTop: 13,
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#818ED5',
    fontWeight: 'bold',
  },
});

export default Login;
