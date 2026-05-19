import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface SuccessToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export function SuccessToast({ message, onClose, duration = 2200 }: SuccessToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(onClose, duration);

    return () => clearTimeout(timer);
  }, [duration, message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <View style={styles.host} pointerEvents="none">
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Icon name="checkmark-circle" size={28} color="#16A34A" />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Амжилттай</Text>
          <Text style={styles.description}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    zIndex: 999,
    elevation: 999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
});
