import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { createTextStyle } from '../../theme/typography';
import type { AppTextProps, AppTextVariant } from './types';

const variantStyles: Record<AppTextVariant, object> = {
  display: createTextStyle('xxl', 'bold'),
  heading: createTextStyle('xl', 'bold'),
  section: createTextStyle('lg', 'semibold'),
  body: createTextStyle('md', 'regular'),
  caption: createTextStyle('sm', 'regular', 'secondary'),
  button: createTextStyle('md', 'semibold', 'inverse'),
};

export default function AppText({
  children,
  variant = 'body',
  tone,
  style,
  ...props
}: AppTextProps) {
  const toneStyle = tone ? styles[tone] : null;

  return (
    <Text style={[variantStyles[variant], toneStyle, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  primary: createTextStyle('md', 'regular', 'primary'),
  secondary: createTextStyle('md', 'regular', 'secondary'),
  muted: createTextStyle('md', 'regular', 'muted'),
  inverse: createTextStyle('md', 'regular', 'inverse'),
  accent: createTextStyle('md', 'regular', 'accent'),
  danger: createTextStyle('md', 'regular', 'danger'),
  success: createTextStyle('md', 'regular', 'success'),
});
