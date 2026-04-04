import React from "react";
import { Text, StyleSheet, TextProps, StyleProp, TextStyle, View, ViewStyle } from "react-native";

type SectionTitleProps = TextProps & {
  children: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
  viewStyle?: StyleProp<ViewStyle>;

};

const SectionTitle = ({ children, viewStyle, textStyle, ...props }: SectionTitleProps) => {
  return (
    <View style={viewStyle} {...props}>
    <Text style={[styles.title, textStyle]} {...props}>
      {children}
    </Text>
    </View>
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