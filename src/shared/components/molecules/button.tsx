// shared/components/molecules/button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { ProtectedTouchable } from './protectedTouchable';

type ButtonProps = {
  icon?: string;
  iconSize?: number;
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<ViewStyle | TextStyle>;
  requiredStatus?: 'guest' | 'registered' | 'paid';
  onPaymentRequired?: () => void;
};

const Button = ({ 
  icon, 
  iconSize = 20, 
  title, 
  onPress, 
  style, 
  textStyle, 
  iconStyle,
  requiredStatus = 'paid',
  onPaymentRequired
}: ButtonProps) => {
  return (
    <ProtectedTouchable 
      style={[styles.button, style]} 
      onPress={onPress} 
      onPaymentRequired={onPaymentRequired}
      requiredStatus={requiredStatus}
      activeOpacity={0.7}
    >
      {icon && (
        <Icon
          name={icon}
          size={iconSize}
          style={[styles.icon, iconStyle]}
        />
      )}
      <Text style={[styles.buttonText, textStyle, icon ? { marginLeft: 8 } : {}]}>
        {title}
      </Text>
    </ProtectedTouchable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#155DFC",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  icon: {},
});