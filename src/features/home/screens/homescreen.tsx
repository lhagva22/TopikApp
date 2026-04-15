// src/features/home/screens/homescreen.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, CardHeader, CardTitle } from '../../../shared/components/molecules/card';
import CustomButton from '../../../shared/components/molecules/button';
import SectionTitle from '../../../shared/components/atoms/sectionTitle';
import { useNavigation } from '@react-navigation/native';
import { useSharedStore } from '../../../store/sharedStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Payment from '../../../features/payment/payment';

interface Level {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  textColor: string;
  levelValue: number;
}

const levels: Level[] = [
  { title: "TOPIK I - 1-р түвшин", subtitle: "Анхан шат", badge: "TOPIK I", badgeColor: '#B0FFB0', textColor: '#008000', levelValue: 1 },
  { title: "TOPIK I - 2-р түвшин", subtitle: "Суурь түвшин", badge: "TOPIK I", badgeColor: '#B0B0FF', textColor: '#0000FF', levelValue: 2 },
  { title: "TOPIK II - 3-р түвшин", subtitle: "Дундаж түвшин", badge: "TOPIK II", badgeColor: '#FFFFB0', textColor: '#595900', levelValue: 3 },
  { title: "TOPIK II - 4-р түвшин", subtitle: "Дунд дээд түвшин", badge: "TOPIK II", badgeColor: '#FF4500', textColor: '#392700', levelValue: 4 },
  { title: "TOPIK II - 5-р түвшин", subtitle: "Ахисан түвшин", badge: "TOPIK II", badgeColor: '#FFC800', textColor: '#8A6C00', levelValue: 5 },
  { title: "TOPIK II - 6-р түвшин", subtitle: "Мэргэжлийн түвшин", badge: "TOPIK II", badgeColor: '#FFB0FF', textColor: '#A700A7', levelValue: 6 },
];

const cardShadowStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

interface LevelCardProps {
  level: Level;
  isActive?: boolean;
  onPress?: () => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ level, isActive = false, onPress }) => {
  const { title, subtitle, badge, badgeColor, textColor } = level;
  return (
    <Card 
      style={[
        styles.cardLevel, 
        cardShadowStyle,
        isActive && styles.activeCard
      ]}
    >
      <View style={styles.levelContent}>
        <CardHeader style={styles.levelTitle}>{title}</CardHeader>
        <CardTitle style={styles.levelSubtitle}>{subtitle}</CardTitle>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: textColor }]}>{badge}</Text>
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <Icon name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.activeText}>Таны түвшин</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useSharedStore();
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Screen focus үед түвшинг дахин ачаалах
  useFocusEffect(
    useCallback(() => {
      loadUserLevel();
    }, [])
  );

  const loadUserLevel = async () => {
    try {
      if (user?.level) {
        setUserLevel(user.level);
        return;
      }
      
      const savedLevel = await AsyncStorage.getItem('user_level');
      if (savedLevel) {
        const levelNum = parseInt(savedLevel, 10);
        setUserLevel(levelNum);
        if (user) {
          updateUser({ ...user, level: levelNum });
        }
      }
    } catch (error) {
      console.error('Error loading user level:', error);
    }
  };

  const startLevelTest = () => {
    navigation.navigate('LevelTest');
  };

  const handlePaymentRequired = () => {
    setShowPayment(true);
  };

  const getCurrentLevel = (): Level | undefined => {
    if (!userLevel) return undefined;
    return levels.find(level => level.levelValue === userLevel);
  };

  const currentLevel = getCurrentLevel();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {currentLevel && (
            <View style={styles.currentLevelContainer}>
              <Text style={styles.currentLevelLabel}>Таны одоогийн түвшин</Text>
              <LevelCard level={currentLevel} isActive={true} />
            </View>
          )}

          <Card style={[styles.schoolCard, cardShadowStyle]}>
            <View style={styles.schoolRow}>
              <View style={styles.schoolIconWrapper}>
                <Icon name="school-outline" size={40} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <CardHeader>Шинэ эхлэл нархан сургууль</CardHeader>
                <CardTitle>
                  Шинэ эхлэл нархан сургууль нь ахлах ангидаа Солонгос улсад шилжин суралцах боломжтой Монгол улсын цорын ганц сургууль юм.
                </CardTitle>
              </View>
            </View>
          </Card>
          
          <SectionTitle viewStyle={{marginTop: 20}}>Түвшин тогтоох шалгалт</SectionTitle>

          <Card style={[styles.levelTestCard, cardShadowStyle]}>
            <CardHeader style={styles.levelTestHeader}>Өөрийн түвшинг мэдээрэй</CardHeader>
            <CardTitle style={styles.levelTestSubtitle}>
              Богино шалгалтаар өөрийн Солонгос хэлний түвшинг тогтоож, тохирсон хичээлийг сонгоорой
            </CardTitle>

            <Card style={[styles.levelTestInfoCard, cardShadowStyle]}>
              <View style={styles.levelTestInfoRow}>
                <View style={styles.levelTestInfoColumn}>
                  <CardTitle style={styles.levelTestInfoLabel}>Хугацаа</CardTitle>
                  <CardTitle style={styles.levelTestInfoValue}>15 минут</CardTitle>
                </View>
                <View style={styles.levelTestInfoColumn}>
                  <CardTitle style={styles.levelTestInfoLabel}>Асуултууд</CardTitle>
                  <CardTitle style={styles.levelTestInfoValue}>20 асуулт</CardTitle>
                </View>
              </View>
            </Card>

        <CustomButton
          title="Шалгалт эхлүүлэх"
          style={{backgroundColor: "#ffffff"}}
          textStyle={{color: "#155DFC", fontWeight: '400'}}
          icon="play-outline"
          iconSize={20}
          iconStyle={{color: '#155dfc'}}
          onPress={startLevelTest}
          onPaymentRequired={handlePaymentRequired}  // ← Энэ мөрийг НЭМЭХ
        />
          </Card>

          <SectionTitle viewStyle={{ marginTop: 20 }}>Түвшнүүд</SectionTitle>
          {levels.map((level, index) => (
            <LevelCard 
              key={index} 
              level={level} 
              isActive={userLevel === level.levelValue}
            />
          ))}
        </View>
      </ScrollView>
      
      <Payment 
        visible={showPayment} 
        onClose={() => setShowPayment(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  currentLevelContainer: {
    marginBottom: 16,
  },
  currentLevelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155DFC',
    marginBottom: 8,
    marginLeft: 4,
  },
  schoolCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolIconWrapper: {
    marginRight: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#155DFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelTestCard: {
    width: '100%',
    backgroundColor: '#155DFC',
    marginTop: 24,
    padding: 24,
    borderRadius: 12,
  },
  levelTestHeader: {
    color: '#fff',
    fontWeight: '400',
    paddingBottom: 16,
  },
  levelTestSubtitle: {
    color: '#fff',
    paddingBottom: 16,
  },
  levelTestInfoCard: {
    backgroundColor: '#4B83FF',
    borderRadius: 12,
    padding: 16,
  },
  levelTestInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelTestInfoColumn: {
    flexDirection: 'column',
  },
  levelTestInfoLabel: {
    color: '#fff',
  },
  levelTestInfoValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cardLevel: {
    width: '100%',
    backgroundColor: '#ffffff',
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
    position: 'relative',
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  levelContent: {
    alignItems: 'center',
    position: 'relative',
  },
  levelTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  levelSubtitle: {
    color: '#555',
    fontSize: 14,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  activeText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;