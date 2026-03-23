// Card.tsx
import React from "react";
import { View, Text, StyleSheet, ViewProps, TextProps, StyleProp, ViewStyle, TextStyle, Image, ImageSourcePropType , ImageStyle} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// Centralized shadow for all cards
const shadowStyle: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3, // Android
};

// Centralized spacing and font sizes
const spacing = {
  cardPadding: 16,
  cardMarginBottom: 8,
};

const fontSizes = {
  header: 18,
  title: 12,
};

type CardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const Card = ({ style, children, ...props }: CardProps) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

type CardHeaderProps = TextProps & {
  children: React.ReactNode;
  variant?: "small" | "medium" | "large";
  icon?: string;
  iconSize?: number;
  iconStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const CardHeader = ({ children, variant = "medium", icon, iconSize, iconStyle, containerStyle, style, ...props }: CardHeaderProps) => {
  const fontSizeMap: Record<string, number> = { small: 14, medium: fontSizes.header,  large: 22 };
  return (
    <View style={[containerStyle]}>
      {icon && (
        <Icon
          name={icon}
          size={iconSize}
          style={[styles.icon, iconStyle]}
        />
      )}
      <Text style={[{ fontSize: fontSizeMap[variant], fontWeight: "bold" }, style]} {...props}>
        {children}
      </Text>
    </View>
  );
};

type CardTitleProps = TextProps & {
  children: React.ReactNode;
  variant?: "small" | "medium" | "large";
  icon?: string;
  iconSize?: number;
  iconStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  image?: ImageSourcePropType; // Placeholder for future image support
 imageStyle?: StyleProp<ImageStyle>; // FIX
};

const CardTitle = ({
  children,
  variant = "small",
  style,
  icon,
  iconStyle,
  iconSize = 16,
  containerStyle,
  image,
  imageStyle,
  ...props
}: CardTitleProps) => {

  const fontSizeMap: Record<string, number> = {
    small: fontSizes.title,
    medium: 14,
    large: 16
  };

  const merge = image ? Image.resolveAssetSource(image).uri : null;

  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center" },
        containerStyle
      ]}
    >
      {image && (
  <Image
    source={image}
    style={[{ width: 20, height: 20, marginRight: 8 }, imageStyle]}
  />
)}
      {icon && (
        <Icon
          name={icon}
          size={iconSize}
          style={[styles.icon, iconStyle]}
        />
      )}

      <Text
        style={[
          {
            fontSize: fontSizeMap[variant],
            fontWeight: "600"
          },
          style
        ]}
        {...props}
      >
        {children}
      </Text>
    </View>
  );
};

export { Card, CardHeader, CardTitle };

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: spacing.cardPadding,
    ...shadowStyle,
  },
  icon: {

  },
  imageStyle: {

  }
});