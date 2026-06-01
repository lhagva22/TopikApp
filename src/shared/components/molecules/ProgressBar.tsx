import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

type ProgressBarProps = {
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
};

const clampProgress = (progress: number) => Math.max(0, Math.min(100, progress));

export const ProgressBar = ({
  progress,
  height = 7,
  color = '#155DFC',
  trackColor = '#E2E8F0',
  style,
}: ProgressBarProps) => (
  <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
    <View style={[styles.fill, { width: `${clampProgress(progress)}%`, backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
