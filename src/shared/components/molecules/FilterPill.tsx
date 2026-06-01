import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

type FilterPillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeTextStyle?: StyleProp<TextStyle>;
};

export const FilterPill = ({
  label,
  active,
  onPress,
  style,
  activeStyle,
  textStyle,
  activeTextStyle,
}: FilterPillProps) => (
  <Pressable
    onPress={onPress}
    style={[styles.pill, style, active && [styles.pillActive, activeStyle]]}
  >
    <Text style={[styles.text, textStyle, active && [styles.textActive, activeTextStyle]]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#155DFC',
    borderColor: '#155DFC',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  textActive: {
    color: '#fff',
  },
});
