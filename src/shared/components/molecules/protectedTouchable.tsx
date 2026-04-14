// shared/components/molecules/ProtectedTouchable.tsx
import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSharedStore } from '../../../store/sharedStore';

interface ProtectedTouchableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPaymentRequired?: () => void;  
  requiredStatus?: 'guest' | 'registered' | 'paid';
  style?: any;
  activeOpacity?: number;
}

export const ProtectedTouchable: React.FC<ProtectedTouchableProps> = ({
  children,
  onPress,
  onPaymentRequired,
  requiredStatus = 'paid',
  style,
  activeOpacity = 0.7,
}) => {
  const navigation = useNavigation();
  const { isGuestUser, isRegisteredUser, isPaidUser } = useSharedStore();

  const handlePress = () => {
    // 1. requiredStatus шалгалт
    if (requiredStatus === 'paid' && isPaidUser()) {
      onPress?.();
      return;
    }
    
    if (requiredStatus === 'registered' && (isRegisteredUser() || isPaidUser())) {
      onPress?.();
      return;
    }
    
    if (requiredStatus === 'guest') {
      onPress?.();
      return;
    }
    
    // 2. Guest хэрэглэгч
    if (isGuestUser()) {
      Alert.alert(
        "Нэвтрэх шаардлагатай",
        "Энэ контентыг ашиглахын тулд нэвтрэх шаардлагатай",
        [
          { text: "Буцах", style: "cancel" },
          { text: "Нэвтрэх", onPress: () => navigation.navigate("Login" as never) }
        ]
      );
      return;
    }
    
    // 3. Registered хэрэглэгч (төлбөргүй)
    if (isRegisteredUser()) {
      Alert.alert(
        "Төлбөртэй багц шаардлагатай",
        "Энэ контентыг ашиглахын тулд төлбөртэй багц идэвхжүүлнэ үү",
        [
          { text: "Буцах", style: "cancel" },
          { 
            text: "Багц авах", 
            onPress: () => {
              // ✅ onPaymentRequired байгаа эсэх шалгах
              if (onPaymentRequired) {
                onPaymentRequired();
              }
            } 
          }
        ]
      );
      return;
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style} activeOpacity={activeOpacity}>
      {children}
    </TouchableOpacity>
  );
};