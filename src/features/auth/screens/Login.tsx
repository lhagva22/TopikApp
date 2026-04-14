import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import 'react-native-gesture-handler';
import SectionTitle from "../../../shared/components/atoms/sectionTitle";
import { Card, CardTitle } from "../../../shared/components/molecules/card";
import CustomButtom from "../../../shared/components/molecules/button";
import GoogleIcon from "../../../shared/assets/images/googlesvg";
import AppleIcon from "../../../shared/assets/images/applesvg";
import React, { useRef, useState } from "react";
import { RootStackParamList } from "../../../shared/navigation/NavigationTypes";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
 
const Login = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeInput, setActiveInput] = useState<string | null>(null);
  
  // Refs үүсгэх
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleGoBack = () => {
    navigation.goBack();
    navigation.dispatch(DrawerActions.openDrawer());
  };

const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Алдаа', 'Имэйл, нууц үгээ оруулна уу');
      return;
    }

    const success = await login(email, password);
    if (!success && error) {
      Alert.alert('Алдаа', error);
      clearError();
    }
        else if (success) {
          Alert.alert('Амжилттай', 'Нэвтрэлт амжилттай үүслээ', );
        } 
      };

  const handleForgotPassword = () => {

    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Signin');
  };

  // Input-г focus хийх функц
  const focusEmail = () => emailRef.current?.focus();
  const focusPassword = () => passwordRef.current?.focus();

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#FFFFFF' }}>
      <TouchableOpacity onPress={handleGoBack}>
        <Icon name="arrow-back-outline" size={24} color="#333" />
      </TouchableOpacity>
      
      <SectionTitle 
        textStyle={{ fontSize: 24, fontWeight: 'bold' }} 
        viewStyle={{ justifyContent: 'center', alignItems: 'center', marginVertical: 48 }}
      >
        Нэвтрэх
      </SectionTitle>
      
      <View style={{ flexDirection: "column", gap: 5, marginBottom: 50 }}>
        <Card style={styles.login}>
          <GoogleIcon width={24} height={24} />
          <CardTitle style={styles.cardtitle}>Google ашиглан нэвтрэх</CardTitle>
        </Card>
        <Card style={styles.login}>
          <AppleIcon width={24} height={24} />
          <CardTitle style={styles.cardtitle}>Apple id ашиглан нэвтрэх</CardTitle>
        </Card>
      </View>
      
      <View style={{ gap: 24 }}>
        {/* Имэйл input */}
        <TouchableOpacity activeOpacity={0.7} onPress={focusEmail}>
          <Text style={styles.textstyle}>Имэйл</Text>
          <View style={[styles.inputWrapper, activeInput === 'email' && styles.inputWrapperActive]}>
            <Icon name="person-outline" size={20} color={activeInput === 'email' ? '#007AFF' : '#B1B1B1'} />
            <TextInput 
              ref={emailRef}
              style={styles.textinput}  
              placeholder="Имэйлээ оруулна уу" 
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
        
        {/* Нууц үг input */}
        <TouchableOpacity activeOpacity={0.7} onPress={focusPassword}>
          <Text style={styles.textstyle}>Нууц үг</Text>
          <View style={[styles.inputWrapper, activeInput === 'password' && styles.inputWrapperActive]}>
            <Icon name="lock-closed-outline" size={20} color={activeInput === 'password' ? '#007AFF' : '#B1B1B1'} />
            <TextInput 
              ref={passwordRef}
              style={styles.textinput} 
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

      <TouchableOpacity 
        style={{ marginTop: 13, alignItems: 'flex-end', marginBottom: 24 }}
        onPress={handleForgotPassword}
      >
        <Text style={{ color: '#818ED5', fontWeight: 'bold' }}>
          Нууц үг мартсан
        </Text>
      </TouchableOpacity>
      
      <CustomButtom title={'Нэвтрэх'} onPress={handleLogin} />

      <TouchableOpacity 
        style={{ marginTop: 20, marginBottom: 20, alignItems: 'center' }} 
        onPress={handleRegister}
      >
        <Text style={{ color: '#818ED5', fontWeight: 'bold' }}>
          Бүртгүүлэх
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  login: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center'
  }, 
  cardtitle: {
    marginLeft: 10,
    fontSize: 16,
  },
  textstyle: {
    color: '#B1B1B1',
    marginBottom: 8, 
    fontWeight: '500'
  }, 
  textinput: {
    paddingLeft: 10,
    color: '#000000',  // ✅ Бичих текстийн өнгө хар
    flex: 1,
    fontSize: 16,

  }, 
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    backgroundColor: '#FFFFFF',
  },
  inputWrapperActive: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
});

export default Login;