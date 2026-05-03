import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

export const FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const LINE_HEIGHT = {
  xs: 18,
  sm: 20,
  md: 24,
  lg: 26,
  xl: 30,
  xxl: 36,
} as const;

export const TEXT_COLOR = {
  primary: '#111827',
  secondary: '#6b7280',
  muted: '#9ca3af',
  inverse: '#ffffff',
  accent: '#155DFC',
  danger: '#dc2626',
  success: '#16a34a',
} as const;

export const createTextStyle = (
  size: keyof typeof FONT_SIZE,
  weight: keyof typeof FONT_WEIGHT = 'regular',
  color: keyof typeof TEXT_COLOR = 'primary',
): TextStyle => ({
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE[size],
  lineHeight: LINE_HEIGHT[size],
  fontWeight: FONT_WEIGHT[weight],
  color: TEXT_COLOR[color],
});
