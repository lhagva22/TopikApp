import React, { useState } from 'react';
import {
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { ProtectedTouchable } from '../../shared/components/molecules/protectedTouchable';
import type { PaymentPlanItem, PaymentProps } from './types';

const FEATURES = ['Бүх видео хичээл', 'Mock шалгалтууд', 'Толь бичиг', 'Хичээлийн материал'];

const paymentItems: PaymentPlanItem[] = [
  { id: 1, title: '1 сар', price: '29,900₮', months: 1, amount: 29900, features: FEATURES },
  { id: 2, title: '3 сар', price: '79,900₮', months: 3, amount: 79900, features: FEATURES },
  { id: 3, title: '6 сар', price: '149,900₮', months: 6, amount: 149900, features: FEATURES },
];

const Payment = ({ visible, onClose, onSelectPlan }: PaymentProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelectPlan = (item: PaymentPlanItem) => {
    setSelectedId(item.id);
    setTimeout(() => {
      onClose();
      onSelectPlan?.(item);
    }, 250);
  };

  if (!visible) {
    return null;
  }

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Icon name="diamond-outline" size={20} color="#155DFC" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Premium багц</Text>
                <Text style={styles.headerSub}>Өөрт тохирсон багцаа сонгоно уу</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {paymentItems.map((item) => {
              const isSelected = selectedId === item.id;
              const isPopular = item.id === 2;

              return (
                <ProtectedTouchable
                  key={item.id}
                  requiredStatus="registered"
                  onPress={() => handleSelectPlan(item)}
                  activeOpacity={0.82}
                  style={[
                    styles.card,
                    isPopular && styles.cardPopular,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    {isPopular ? (
                      <View style={[styles.popularBadge, isSelected && styles.popularBadgeSelected]}>
                        <Icon name="flame" size={12} color={isSelected ? '#60A5FA' : '#F59E0B'} />
                        <Text style={[styles.popularText, isSelected && styles.popularTextSelected]}>
                          Хамгийн их сонгогддог
                        </Text>
                      </View>
                    ) : (
                      <View />
                    )}
                    <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                      {isSelected && <Icon name="checkmark" size={13} color="#fff" />}
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, isSelected && styles.priceSelected]}>
                      {item.price}
                    </Text>
                    <Text style={[styles.pricePeriod, isSelected && styles.pricePeriodSelected]}>
                      /{item.title}
                    </Text>
                  </View>

                  <View style={[styles.divider, isSelected && styles.dividerSelected]} />

                  <View style={styles.featureList}>
                    {item.features.map((feature) => (
                      <View key={feature} style={styles.featureRow}>
                        <View style={[styles.featureBox, isSelected && styles.featureBoxSelected]}>
                          <Icon
                            name="checkmark"
                            size={10}
                            color={isSelected ? '#fff' : '#9CA3AF'}
                          />
                        </View>
                        <Text style={[styles.featureText, isSelected && styles.featureTextSelected]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ProtectedTouchable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPopular: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  cardSelected: {
    borderColor: '#155DFC',
    backgroundColor: '#EFF6FF',
    shadowColor: '#155DFC',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  popularBadgeSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#2563EB',
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  popularTextSelected: {
    color: '#BFDBFE',
  },
  selectCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  selectCircleActive: {
    backgroundColor: '#155DFC',
    borderColor: '#155DFC',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 14,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
  },
  priceSelected: {
    color: '#155DFC',
  },
  pricePeriod: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  pricePeriodSelected: {
    color: '#93C5FD',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 14,
  },
  dividerSelected: {
    backgroundColor: '#BFDBFE',
  },
  featureList: {
    gap: 9,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBoxSelected: {
    backgroundColor: '#155DFC',
  },
  featureText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  featureTextSelected: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
});

export default Payment;
