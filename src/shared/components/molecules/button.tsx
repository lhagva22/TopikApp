// shared/components/molecules/button.tsx
import React from "react";
import {
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AppText from '../atoms/AppText';
import { ProtectedTouchable } from './protectedTouchable';
import type { ButtonProps } from './types';

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
      <AppText
        variant="button"
        style={[styles.buttonText, textStyle, icon ? { marginLeft: 8 } : {}]}
      >
        {title}
      </AppText>
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
    letterSpacing: -0.2,
  },
  icon: {},
});
