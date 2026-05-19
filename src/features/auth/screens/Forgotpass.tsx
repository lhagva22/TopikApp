import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import SectionTitle from '../../../shared/components/atoms/sectionTitle';
import { InlineMessage } from '../../../shared/components/feedback';
import { getErrorMessage } from '../../../shared/lib/errors';
import { authApi } from '../api/authApi';
import type { ForgotPasswordScreenNavigationProp } from './types';

type ResetStep = 'email' | 'otp' | 'password';

const ForgotPassword = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const sendOtp = async () => {
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError('И-мэйлээ оруулна уу.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword({ email: email.trim() });

      if (response.success) {
        setMessage(response.message || 'OTP кодыг имэйл рүү илгээлээ.');
        setStep('otp');
        return;
      }

      setError(getErrorMessage(response.error, 'OTP илгээхэд алдаа гарлаа.'));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Серверт холбогдоход алдаа гарлаа.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async () => {
    setMessage(null);
    setError(null);

    if (!resetToken || !password.trim() || !confirmPassword.trim()) {
      setError('Шинэ нууц үгээ оруулна уу.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Нууц үг таарахгүй байна.');
      return;
    }

    if (password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.resetPassword({
        resetToken,
        password,
      });

      if (response.success) {
        setOtp('');
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        setStep('email');
        navigation.navigate('Login', {
          successMessage: response.message || 'Нууц үг амжилттай шинэчлэгдлээ.',
        });
        return;
      }

      setError(getErrorMessage(response.error, 'Нууц үг шинэчлэхэд алдаа гарлаа.'));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Серверт холбогдоход алдаа гарлаа.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setMessage(null);
    setError(null);

    if (!otp.trim()) {
      setError('OTP кодоо оруулна уу.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.verifyResetOtp({
        email: email.trim(),
        token: otp.trim(),
      });

      if (response.success && response.resetToken) {
        setResetToken(response.resetToken);
        setMessage(response.message || 'OTP баталгаажлаа. Шинэ нууц үгээ оруулна уу.');
        setStep('password');
        return;
      }

      setError(getErrorMessage(response.error, 'OTP баталгаажуулахад алдаа гарлаа.'));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Серверт холбогдоход алдаа гарлаа.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    name: string,
    label: string,
    icon: string,
    ref: React.RefObject<TextInput>,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'number-pad';
      secureTextEntry?: boolean;
      maxLength?: number;
    },
  ) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => ref.current?.focus()}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, activeInput === name && styles.inputWrapperActive]}>
        <Icon
          name={icon}
          size={20}
          color={activeInput === name ? '#007AFF' : '#B1B1B1'}
        />
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#B1B1B1"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setActiveInput(name)}
          onBlur={() => setActiveInput(null)}
          selectionColor="#007AFF"
          autoCapitalize="none"
          keyboardType={options?.keyboardType}
          secureTextEntry={options?.secureTextEntry}
          maxLength={options?.maxLength}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-back-outline" size={24} color="#333" />
      </TouchableOpacity>

      <SectionTitle textStyle={styles.titleText} viewStyle={styles.titleWrapper}>
        Нууц үгээ сэргээх
      </SectionTitle>

      <InlineMessage
        message={error || message}
        containerStyle={[
          styles.message,
          !error && message ? styles.successMessage : null,
        ]}
      />

      <View style={styles.form}>
        {step === 'email' &&
          renderInput(
            'email',
            'И-мэйл',
            'person-outline',
            emailRef,
            email,
            setEmail,
            'И-мэйлээ оруулна уу',
            { keyboardType: 'email-address' },
          )}

        {step === 'otp' && (
          <View style={styles.emailSummary}>
            <Text style={styles.emailSummaryLabel}>Код илгээсэн и-мэйл</Text>
            <Text style={styles.emailSummaryValue}>{email}</Text>
          </View>
        )}

        {step === 'otp' && (
          <>
            {renderInput(
              'otp',
              'OTP код',
              'keypad-outline',
              otpRef,
              otp,
              setOtp,
              '8 оронтой код',
              { keyboardType: 'number-pad', maxLength: 8 },
            )}
          </>
        )}

        {step === 'password' && (
          <>
            {renderInput(
              'password',
              'Шинэ нууц үг',
              'lock-closed-outline',
              passwordRef,
              password,
              setPassword,
              'Шинэ нууц үгээ оруулна уу',
              { secureTextEntry: true },
            )}
            {renderInput(
              'confirmPassword',
              'Шинэ нууц үг давтах',
              'lock-closed-outline',
              confirmPasswordRef,
              confirmPassword,
              setConfirmPassword,
              'Нууц үгээ дахин оруулна уу',
              { secureTextEntry: true },
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        activeOpacity={0.75}
        disabled={isSubmitting}
        onPress={step === 'email' ? sendOtp : step === 'otp' ? verifyOtp : resetPassword}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting
            ? 'Илгээж байна...'
            : step === 'email'
              ? 'OTP код авах'
              : step === 'otp'
                ? 'OTP баталгаажуулах'
              : 'Нууц үг шинэчлэх'}
        </Text>
      </TouchableOpacity>

      {step === 'otp' && (
        <TouchableOpacity
          style={styles.resendButton}
          activeOpacity={0.75}
          disabled={isSubmitting}
          onPress={sendOtp}
        >
          <Text style={styles.linkText}>OTP дахин илгээх</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Login')}
      >
        <Icon name="arrow-back-outline" size={20} color="#000000" />
        <Text style={styles.backButtonText}>Нэвтрэх рүү буцах</Text>
      </TouchableOpacity>

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
  successMessage: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  form: {
    gap: 24,
  },
  emailSummary: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emailSummaryLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  emailSummaryValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
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
    marginTop: 70,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#155DFC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderColor: '#666666',
    borderWidth: 1,
  },
  backButtonText: {
    color: '#000000',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  registerButton: {
    marginTop: 48,
    alignItems: 'center',
  },
  linkText: {
    color: '#818ED5',
    fontWeight: 'bold',
  },
});

export default ForgotPassword;
