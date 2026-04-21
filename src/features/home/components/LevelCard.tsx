// src/features/home/components/LevelCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, CardHeader, CardTitle } from '../../../shared/components/molecules/card';
import { Level } from '../constants/levels';

interface LevelCardProps {
  level: Level;
  isActive?: boolean;
}

const cardShadowStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

export const LevelCard: React.FC<LevelCardProps> = ({ level, isActive = false }) => {
  const { title, subtitle, badge, badgeColor, textColor } = level;
  return (
    <Card style={[styles.cardLevel, cardShadowStyle, isActive && styles.activeCard]}>
      <View style={styles.levelContent}>
        <CardHeader style={styles.levelTitle}>{title}</CardHeader>
        <CardTitle style={styles.levelSubtitle}>{subtitle}</CardTitle>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: textColor }]}>{badge}</Text>
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <Icon name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.activeText}>Таны түвшин</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardLevel: {
    width: '100%',
    backgroundColor: '#ffffff',
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
    position: 'relative',
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  levelContent: {
    alignItems: 'center',
    position: 'relative',
  },
  levelTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  levelSubtitle: {
    color: '#555',
    fontSize: 14,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  activeText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
});