import type React from 'react';
import type { StyleProp, TextProps, TextStyle, ViewStyle } from 'react-native';

export type AppTextVariant =
  | 'display'
  | 'heading'
  | 'section'
  | 'body'
  | 'caption'
  | 'button';

export type AppTextTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'accent'
  | 'danger'
  | 'success';

export type AppTextProps = TextProps & {
  children: React.ReactNode;
  variant?: AppTextVariant;
  tone?: AppTextTone;
  style?: StyleProp<TextStyle>;
};

export type SectionTitleProps = TextProps & {
  children: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
  viewStyle?: StyleProp<ViewStyle>;
};
