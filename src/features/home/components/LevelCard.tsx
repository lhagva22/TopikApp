import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import type { LevelCardProps } from './types';

const LEVEL_THEMES: Record<number, { accent: string; bg: string; border: string; numBg: string }> = {
  1: { accent: '#059669', bg: '#ECFDF5', border: '#A7F3D0', numBg: '#D1FAE5' },
  2: { accent: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', numBg: '#CFFAFE' },
  3: { accent: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', numBg: '#FEF3C7' },
  4: { accent: '#EA580C', bg: '#FFF7ED', border: '#FDBA74', numBg: '#FFEDD5' },
  5: { accent: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', numBg: '#EDE9FE' },
  6: { accent: '#EC4899', bg: '#FDF2F8', border: '#F9A8D4', numBg: '#FCE7F3' },
};

export const LevelCard: React.FC<LevelCardProps> = ({ level, isActive = false }) => {
  const { title, subtitle, badge, levelValue } = level;
  const theme = LEVEL_THEMES[levelValue] ?? LEVEL_THEMES[1];

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: theme.accent },
        isActive && { backgroundColor: theme.bg, borderColor: theme.border, borderLeftColor: theme.accent },
      ]}
    >
      <View style={[styles.numBox, { backgroundColor: theme.numBg }]}>
        <Text style={[styles.numText, { color: theme.accent }]}>{levelValue}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {isActive && (
          <View style={styles.activeRow}>
            <Icon name="checkmark-circle" size={14} color={theme.accent} />
            <Text style={[styles.activeText, { color: theme.accent }]}>Таны одоогийн түвшин</Text>
          </View>
        )}
      </View>

      <View style={[styles.badge, { backgroundColor: theme.numBg }]}>
        <Text style={[styles.badgeText, { color: theme.accent }]}>{badge}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  numBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
