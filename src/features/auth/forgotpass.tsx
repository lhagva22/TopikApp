import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import SectionTitle from "../../shared/components/atoms/sectionTitle";
import CustomButton from "../../shared/components/molecules/button";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../shared/navigation/NavigationTypes";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPassword = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  
  // State
  const [email, setEmail] = useState('');
  const [activeInput, setActiveInput] = useState<string | null>(null);
  
  // Refs
  const emailRef = useRef<TextInput>(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleResetPassword = () => {
    console.log("Reset password pressed");
    console.log("Email:", email);
    // TODO: Нууц үг шинэчлэх логик
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Signin');
  };

  const focusEmail = () => emailRef.current?.focus();

  // Icon өнгийг тодорхойлох функц
  const getIconColor = (inputName: string) => {
    return activeInput === inputName ? '#007AFF' : '#B1B1B1';
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
        Нууц үгээ мартсан уу
      </SectionTitle>
      
      <View style={{ gap: 24 }}>
        {/* Имэйл input */}
        <TouchableOpacity activeOpacity={0.7} onPress={focusEmail}>
          <Text style={styles.textstyle}>Имэйл</Text>
          <View style={[
            styles.inputWrapper, 
            activeInput === 'email' && styles.inputWrapperActive
          ]}>
            <Icon 
              name="person-outline" 
              size={20} 
              color={getIconColor('email')}
            />
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
      </View>
      
      <CustomButton 
        style={{ marginTop: 70 }} 
        title={'Нууц үг шинэчлэх'}  
        onPress={handleResetPassword}
      />
      
      <CustomButton 
        style={{ 
          marginTop: 20, 
          backgroundColor: '#ffffff', 
          borderColor: '#666666', 
          borderWidth: 1 
        }} 
        textStyle={{ color: '#000000' }} 
        title={'Нэвтрэх рүү буцах'} 
        icon="arrow-back-outline"  
        onPress={handleBackToLogin}
      />
      
      <TouchableOpacity 
        style={{ marginTop: 48, alignItems: "center" }} 
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

export default ForgotPassword;