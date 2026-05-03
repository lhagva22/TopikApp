import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import SectionTitle from '../../../shared/components/atoms/sectionTitle';
import { InlineMessage } from '../../../shared/components/feedback';
import CustomButton from '../../../shared/components/molecules/button';
import { getErrorMessage } from '../../../shared/lib/errors';
import { useAuth } from '../hooks/useAuth';
import type { SigninScreenNavigationProp } from './types';

const Signin = () => {
  const { register, error, clearError } = useAuth();
  const navigation = useNavigation<SigninScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSignup = async () => {
    setFormError(null);
    clearError();

    if (!email.trim() || !password.trim() || !name.trim()) {
      setFormError('Бүх талбарыг бөглөнө үү.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Нууц үг таарахгүй байна.');
      return;
    }

    if (password.length < 6) {
      setFormError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return;
    }

    const success = await register(email.trim(), password, name.trim());

    if (!success) {
      setFormError(getErrorMessage(error, 'Бүртгүүлэхэд алдаа гарлаа.'));
      clearError();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Icon name="arrow-back-outline" size={24} color="#333" />
      </TouchableOpacity>

      <SectionTitle textStyle={styles.titleText} viewStyle={styles.titleWrapper}>
        Бүртгүүлэх
      </SectionTitle>

      <InlineMessage message={formError} containerStyle={styles.message} />

      <View style={styles.form}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => emailRef.current?.focus()}>
          <Text style={styles.label}>И-мэйл</Text>
          <View style={[styles.inputWrapper, activeInput === 'email' && styles.inputWrapperActive]}>
            <Icon name="person-outline" size={20} color="#B1B1B1" />
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

        <TouchableOpacity activeOpacity={0.7} onPress={() => nameRef.current?.focus()}>
          <Text style={styles.label}>Нэр</Text>
          <View style={[styles.inputWrapper, activeInput === 'name' && styles.inputWrapperActive]}>
            <Icon name="person-outline" size={20} color="#B1B1B1" />
            <TextInput
              ref={nameRef}
              style={styles.input}
              placeholder="Нэрээ оруулна уу"
              placeholderTextColor="#B1B1B1"
              value={name}
              onChangeText={setName}
              onFocus={() => setActiveInput('name')}
              onBlur={() => setActiveInput(null)}
              selectionColor="#007AFF"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => passwordRef.current?.focus()}>
          <Text style={styles.label}>Нууц үг</Text>
          <View style={[styles.inputWrapper, activeInput === 'password' && styles.inputWrapperActive]}>
            <Icon name="lock-closed-outline" size={20} color="#B1B1B1" />
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

        <TouchableOpacity activeOpacity={0.7} onPress={() => confirmPasswordRef.current?.focus()}>
          <Text style={styles.label}>Нууц үг давтах</Text>
          <View
            style={[
              styles.inputWrapper,
              activeInput === 'confirmPassword' && styles.inputWrapperActive,
            ]}
          >
            <Icon name="lock-closed-outline" size={20} color="#B1B1B1" />
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Нууц үгээ дахин оруулна уу"
              placeholderTextColor="#B1B1B1"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setActiveInput('confirmPassword')}
              onBlur={() => setActiveInput(null)}
              secureTextEntry
              selectionColor="#007AFF"
            />
          </View>
        </TouchableOpacity>
      </View>

      <CustomButton
        style={styles.submitButton}
        title="Бүртгүүлэх"
        requiredStatus="guest"
        onPress={handleSignup}
      />
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
  form: {
    gap: 24,
  },
  label: {
    color: '#B1B1B1',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    paddingLeft: 10,
    color: '#000000',
    flex: 1,
    fontSize: 16,
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
  submitButton: {
    marginTop: 50,
    marginBottom: 20,
  },
});

export default Signin;
