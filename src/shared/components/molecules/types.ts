import type React from 'react';
import type { StyleProp, TextProps, TextStyle, ViewProps, ViewStyle } from 'react-native';

export type AccessLevel = 'guest' | 'registered' | 'paid';
export type AccessBlockReason = 'guest' | 'registered';

export interface ProtectedTouchableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPaymentRequired?: () => void;
  requiredStatus?: AccessLevel;
  style?: any;
  activeOpacity?: number;
}

export interface ButtonProps {
  icon?: string;
  iconSize?: number;
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<ViewStyle | TextStyle>;
  requiredStatus?: AccessLevel;
  onPaymentRequired?: () => void;
}

export interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export interface CardHeaderProps extends TextProps {
  children: React.ReactNode;
  variant?: 'small' | 'medium' | 'large';
  containerStyle?: StyleProp<ViewStyle>;
}

export interface CardTitleProps extends TextProps {
  children: React.ReactNode;
  variant?: 'small' | 'medium' | 'large';
  containerStyle?: StyleProp<ViewStyle>;
}
