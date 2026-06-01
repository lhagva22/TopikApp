import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

type SectionHeaderProps = {
  title: string;
  accentColor?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export const SectionHeader = ({
  title,
  accentColor = '#155DFC',
  right,
  style,
  titleStyle,
}: SectionHeaderProps) => (
  <View style={[styles.header, style]}>
    <View style={styles.titleWrap}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text style={[styles.title, titleStyle]}>{title}</Text>
    </View>
    {right}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  accent: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
});
