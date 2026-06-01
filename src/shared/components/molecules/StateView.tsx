import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

type StateViewProps = {
  variant?: 'loading' | 'error' | 'empty';
  title?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
};

export const StateView = ({
  variant = 'empty',
  title,
  description,
  icon,
  iconColor,
  actionLabel,
  onAction,
  children,
  style,
  titleStyle,
  descriptionStyle,
}: StateViewProps) => {
  const resolvedIcon = icon ?? (variant === 'error' ? 'alert-circle-outline' : 'file-tray-outline');
  const resolvedIconColor = iconColor ?? (variant === 'error' ? '#EF4444' : '#94A3B8');

  return (
    <View style={[styles.card, style]}>
      {variant === 'loading' ? (
        <ActivityIndicator size="large" color="#155DFC" />
      ) : (
        <Icon name={resolvedIcon} size={28} color={resolvedIconColor} />
      )}
      {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
      {description ? <Text style={[styles.description, descriptionStyle]}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: '#64748B',
  },
  actionButton: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#155DFC',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
