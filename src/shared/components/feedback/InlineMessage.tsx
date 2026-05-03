import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { InlineMessageProps } from './types';

export function InlineMessage({
  message,
  variant = 'error',
  containerStyle,
  textStyle,
}: InlineMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={[styles.base, styles[variant], containerStyle]}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  info: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  success: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#B91C1C',
  },
  infoText: {
    color: '#1D4ED8',
  },
  successText: {
    color: '#047857',
  },
});
