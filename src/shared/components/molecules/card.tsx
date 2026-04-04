import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewProps,
  TextProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

// ==================== CONSTANTS ====================
const SHADOW_STYLE: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
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

// ==================== TYPES ====================
interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

interface CardHeaderProps extends TextProps {
  children: React.ReactNode;
  variant?: "small" | "medium" | "large";
  containerStyle?: StyleProp<ViewStyle>;
}

interface CardTitleProps extends TextProps {
  children: React.ReactNode;
  variant?: "small" | "medium" | "large";
  containerStyle?: StyleProp<ViewStyle>;
}

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
      <Text style={[styles.headerText, { fontSize }, style]} {...props}>
        {children}
      </Text>
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
    <View style={[styles.titleContainer, containerStyle]}>
      <Text style={[styles.titleText, { fontSize }, style]} {...props}>
        {children}
      </Text>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: SPACING.card.padding,
    marginBottom: SPACING.card.marginBottom,
    ...SHADOW_STYLE,
  },
  headerContainer: {
    marginBottom: 8,
  },
  headerText: {
    fontWeight: "bold",
  },
  titleContainer: {
    marginBottom: 4,
  },
  titleText: {
    fontWeight: "400",

  },
});