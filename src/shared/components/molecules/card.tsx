import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
} from "react-native";
import AppText from '../atoms/AppText';
import type { CardHeaderProps, CardProps, CardTitleProps } from './types';

// ==================== CONSTANTS ====================
const SHADOW_STYLE: ViewStyle = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 4,
};

const SPACING = {
  card: {
    padding: 16,
    marginBottom: 8,
  },
} as const;

const TYPOGRAPHY = {
  header: {
    small: 14,
    medium: 18,
    large: 22,
  },
  title: {
    small: 12,
    medium: 14,
    large: 16,
  },
} as const;

// ==================== COMPONENTS ====================
export const Card = ({ style, children, ...props }: CardProps) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

export const CardHeader = ({
  children,
  variant = "medium",
  containerStyle,
  style,
  ...props
}: CardHeaderProps) => {
  const fontSize = TYPOGRAPHY.header[variant];

  return (
    <View style={[styles.headerContainer, containerStyle]}>
      <AppText variant="section" style={[styles.headerText, { fontSize }, style]} {...props}>
        {children}
      </AppText>
    </View>
  );
};

export const CardTitle = ({
  children,
  variant = "small",
  style,
  containerStyle,
  ...props
}: CardTitleProps) => {
  const fontSize = TYPOGRAPHY.title[variant];

  return (
    <View style={containerStyle}>
      <AppText variant="caption" tone="secondary" style={[styles.titleText, { fontSize }, style]} {...props}>
        {children}
      </AppText>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: SPACING.card.padding,
    marginBottom: SPACING.card.marginBottom,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...SHADOW_STYLE,
  },
  headerContainer: {
    marginBottom: 8,
  },
  headerText: {
    letterSpacing: -0.2,
  },

  titleText: {
    letterSpacing: -0.1,
  },
});
