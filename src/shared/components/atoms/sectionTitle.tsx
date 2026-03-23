import React from "react";
import { Text, StyleSheet, TextProps, StyleProp, TextStyle } from "react-native";

type SectionTitleProps = TextProps & {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

const SectionTitle = ({ children, style, ...props }: SectionTitleProps) => {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});

export default SectionTitle;