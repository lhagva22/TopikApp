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

import SectionTitle from '../../shared/components/atoms/sectionTitle';
import { InlineMessage } from '../../shared/components/feedback';
import CustomButton from '../../shared/components/molecules/button';
import { Card, CardHeader, CardTitle } from '../../shared/components/molecules/card';
import type { PaymentPlanItem, PaymentProps } from './types';

const FEATURES = ['Бүх видео хичээл', 'Mock шалгалтууд', 'Толь бичиг', 'Хичээлийн материал'];

const paymentItems: PaymentPlanItem[] = [
  {
    id: 1,
    title: '1 сар',
    price: '29,900₮',
    months: 1,
    amount: 29900,
    features: FEATURES,
  },
  {
    id: 2,
    title: '3 сар',
    price: '79,900₮',
    months: 3,
    amount: 79900,
    features: FEATURES,
  },
  {
    id: 3,
    title: '6 сар',
    price: '149,900₮',
    months: 6,
    amount: 149900,
    features: FEATURES,
  },
];

const Payment = ({ visible, onClose, onSelectPlan }: PaymentProps) => {
  const [isLoading] = useState(false);
  const [statusMessage] = useState<string | null>(null);

  const handleSelectPlan = (item: PaymentPlanItem) => {
    onClose();
    onSelectPlan?.(item);
  };

  if (!visible) {
    return null;
  }

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>

          <SectionTitle textStyle={styles.sectionTitle}>Багц сонгох</SectionTitle>

          <CardTitle style={styles.subtitle}>Өөрт тохирсон багцаа сонгоно уу</CardTitle>
          <InlineMessage message={statusMessage} variant="success" containerStyle={styles.message} />

          {paymentItems.map((item) => (
            <Card key={item.id} style={styles.card}>
              <CardHeader>
                <View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>{item.price}</Text>
                    <Text style={styles.pricePeriod}>/{item.title}</Text>
                  </View>
                </View>
              </CardHeader>

              <CardTitle>
                {item.features.map((feature) => (
                  <View key={feature} style={styles.featureItem}>
                    <Icon
                      name="checkmark-circle"
                      size={16}
                      color="#22c55e"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </CardTitle>

              <CustomButton
                title={isLoading ? 'Идэвхжүүлж байна...' : 'Сонгох'}
                onPress={() => handleSelectPlan(item)}
                requiredStatus="registered"
                style={styles.selectButton}
                textStyle={styles.selectButtonText}
              />
            </Card>
          ))}
        </ScrollView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  sectionTitle: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginVertical: 10,
  },
  message: {
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  pricePeriod: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
  selectButton: {
    marginTop: 20,
  },
  selectButtonText: {
    fontWeight: '400',
    fontSize: 14,
  },
});

export default Payment;
