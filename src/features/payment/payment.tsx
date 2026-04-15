// payment.tsx - бүрэн зассан хувилбар
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal as RNModal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SectionTitle from "../../shared/components/atoms/sectionTitle";
import { Card, CardHeader, CardTitle } from "../../shared/components/molecules/card";
import CustomButton from "../../shared/components/molecules/button";
import Icon from "react-native-vector-icons/Ionicons";
import { useSharedStore } from '../../store/sharedStore';
interface PaymentProps {
  visible: boolean;
  onClose: () => void;
}

const paymentItems = [
  {
    id: 1,
    title: "1 сар",
    price: "29,900₮",
    features: ["Бүх видео хичээл", "Mock шалгалтууд", "Толь бичиг", "Хичээлийн материал"]
  },
  {
    id: 2,
    title: "3 сар",
    price: "79,900₮",
    features: ["Бүх видео хичээл", "Mock шалгалтууд", "Толь бичиг", "Хичээлийн материал"]
  },
  {
    id: 3,
    title: "6 сар",
    price: "149,900₮",
    features: ["Бүх видео хичээл", "Mock шалгалтууд", "Толь бичиг", "Хичээлийн материал"]
  },
];

const Payment = ({ visible, onClose }: PaymentProps) => {

  const navigation = useNavigation();
  const { user, updateUser } = useSharedStore();
  const [isLoading, setIsLoading] = useState(false);
  const handleClose = () => {
    onClose();
  };
const handleSelectPlan = (months: number) => {
    setIsLoading(true);
    
    // Хэрэглэгчийн статусыг paid болгох
    if (user) {
      const paidUser = {
        ...user,
        status: 'premium' as const,  // ✅ 'registered' → 'premium'
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_months: months,
      };
      updateUser(paidUser);
    }
    
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Амжилттай",
        `${months} сарын багц идэвхжлээ`,
        [
          { 
            text: "OK", 
            onPress: () => {
              onClose();
              navigation.navigate('Home' as never);
            } 
          }
        ]
      );
    }, 500);
  };


  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.modalContainer}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <SectionTitle textStyle={styles.sectionTitle}>Багц сонгох</SectionTitle>
          
          <CardTitle style={styles.subtitle}>
            Өөрт тохирсон багцаа сонгоно уу
          </CardTitle>
          
          {paymentItems.map(item => (
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
                {item.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Icon name="checkmark-circle" size={16} color="#22c55e" style={styles.featureIcon} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </CardTitle>

              <CustomButton 
                title="Сонгох" 
                onPress={() => handleSelectPlan(item.id)} 
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
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 5,
  },
  sectionTitle: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginVertical: 10,
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
    flexDirection: "row",
    alignItems: "baseline",
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