import React from "react";
import { StyleSheet, View } from "react-native";
import AppText from './AppText';
import type { SectionTitleProps } from './types';

const SectionTitle = ({ children, viewStyle, textStyle, ...props }: SectionTitleProps) => {
  return (
    <View style={viewStyle} {...props}>
      <AppText variant="section" style={[styles.title, textStyle]} {...props}>
        {children}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    letterSpacing: -0.2,
  },
});

export default SectionTitle;
