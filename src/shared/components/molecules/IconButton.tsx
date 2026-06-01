import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type IconButtonProps = {
  name: string;
  onPress: () => void;
  color?: string;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
};

export const IconButton = ({
  name,
  onPress,
  color = '#0F172A',
  size = 38,
  iconSize = 20,
  style,
  activeOpacity = 0.8,
}: IconButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.button, { width: size, height: size }, style]}
    activeOpacity={activeOpacity}
  >
    <Icon name={name} size={iconSize} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
