import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface InlineMessageProps {
  message?: string | null;
  variant?: 'error' | 'info' | 'success';
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}
