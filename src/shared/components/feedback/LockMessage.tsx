import React from 'react';
import {
  InteractionManager,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import type { AccessBlockReason } from '../molecules/types';

interface LockMessageProps {
  visible: boolean;
  reason: AccessBlockReason;
  onClose: () => void;
  onLoginClick?: () => void;
  onPricingClick?: () => void;
}

const getContent = (reason: AccessBlockReason) => {
  if (reason === 'guest') {
    return {
      title: 'Системд нэвтэрч, багц идэвхжүүлнэ үү',
      description:
        'Энэхүү контентыг үзэхийн тулд та эхлээд нэвтэрч, дараа нь төлбөртэй багц идэвхжүүлэх шаардлагатай.',
      showLogin: true,
      showPricing: true,
    };
  }

  return {
    title: 'Төлбөртэй багц шаардлагатай',
    description: 'Энэ контентыг ашиглахын тулд төлбөртэй багц идэвхжүүлнэ үү.',
    showLogin: false,
    showPricing: true,
  };
};

const runAfterClose = (action?: () => void) => {
  if (!action) {
    return;
  }

  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      action();
    });
  });
};

export function LockMessage({
  visible,
  reason,
  onClose,
  onLoginClick,
  onPricingClick,
}: LockMessageProps) {
  const content = getContent(reason);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="lock-closed" size={32} color="#2563EB" />
          </View>

          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          <View style={styles.actions}>
            {content.showLogin && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => {
                  onClose();
                  runAfterClose(onLoginClick);
                }}
              >
                <Text style={styles.primaryButtonText}>Нэвтрэх</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Хаах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    gap: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
