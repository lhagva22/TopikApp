import React, { useRef, useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import SectionTitle from "../../../shared/components/atoms/sectionTitle";
import CustomButton from "../../../shared/components/molecules/button";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../../shared/navigation/NavigationTypes";
import { useAuth } from '../hooks/useAuth';
import { Alert } from 'react-native';

type SigninScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signin'>;

const Signin = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const navigation = useNavigation<SigninScreenNavigationProp>();
  
  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeInput, setActiveInput] = useState<string | null>(null);
  
  // Refs
  const emailRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleGoBack = () => {
    navigation.navigate('Login');
  };

  const focusEmail = () => emailRef.current?.focus();
  const focusName = () => nameRef.current?.focus();
  const focusPassword = () => passwordRef.current?.focus();
  const focusConfirmPassword = () => confirmPasswordRef.current?.focus();

const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Алдаа', 'Бүх талбарыг бөглөнө үү');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Алдаа', 'Нууц үг таарахгүй байна');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Алдаа', 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой');
      return;
    }

    const success = await register(email, password, name);
    if (success) {
      Alert.alert('Амжилттай', 'Бүртгэл амжилттай үүслээ', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } else if (error) {
      Alert.alert('Алдаа', error);
      clearError();
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#FFFFFF' }}>
      <TouchableOpacity onPress={handleGoBack}>
        <Icon name="arrow-back-outline" size={24} color="#333" />
      </TouchableOpacity>
      
      <SectionTitle 
        textStyle={{ fontSize: 24, fontWeight: 'bold' }} 
        viewStyle={{ justifyContent: 'center', alignItems: 'center', marginVertical: 48 }}
      >
        Бүртгүүлэх
      </SectionTitle>
      
      <View style={{ gap: 24 }}>
        {/* Имэйл */}
        <TouchableOpacity activeOpacity={0.7} onPress={focusEmail}>
          <Text style={styles.textstyle}>Имэйл</Text>
          <View style={[styles.inputWrapper, activeInput === 'email' && styles.inputWrapperActive]}>
            <Icon name="person-outline" size={20} color="#B1B1B1" />
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
        
        {/* Нэр */}
        <TouchableOpacity activeOpacity={0.7} onPress={focusName}>
          <Text style={styles.textstyle}>Нэр</Text>
          <View style={[styles.inputWrapper, activeInput === 'name' && styles.inputWrapperActive]}>
            <Icon name="person-outline" size={20} color="#B1B1B1" />
            <TextInput 
              ref={nameRef}
              style={styles.textinput}  
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
        
        {/* Нууц үг */}
        <TouchableOpacity activeOpacity={0.7} onPress={focusPassword}>
          <Text style={styles.textstyle}>Нууц үг</Text>
          <View style={[styles.inputWrapper, activeInput === 'password' && styles.inputWrapperActive]}>
            <Icon name="lock-closed-outline" size={20} color="#B1B1B1" />
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
        
        {/* Нууц үг давтах */}
        <TouchableOpacity activeOpacity={0.7} onPress={focusConfirmPassword}>
          <Text style={styles.textstyle}>Нууц үг давтах</Text>
          <View style={[styles.inputWrapper, activeInput === 'confirmPassword' && styles.inputWrapperActive]}>
            <Icon name="lock-closed-outline" size={20} color="#B1B1B1" />
            <TextInput 
              ref={confirmPasswordRef}
              style={styles.textinput}  
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
        style={{ marginTop: 50, marginBottom: 20 }} 
        title={'Бүртгүүлэх'}  
        onPress={handleSignup}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  textstyle: {
    color: '#B1B1B1',
    marginBottom: 8, 
    fontWeight: '500'
  }, 
  textinput: {
    paddingLeft: 10,
    color: '#000000',  // ✅ Хар текст
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

export default Signin;