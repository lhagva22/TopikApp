// src/features/home/screens/homescreen.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Header from '../../../shared/components/organisms/header';
import Footer from '../../../shared/components/organisms/footer';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, CardHeader, CardTitle } from '../../../shared/components/molecules/card';
import CustomButton from '../../../shared/components/molecules/button';
import SectionTitle from '../../../shared/components/atoms/sectionTitle';

interface Level {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  textColor: string;
}

const levels = [
  { title: "TOPIK I - 1-р түвшин", subtitle: "Анхан шат", badge: "TOPIK I", badgeColor: '#B0FFB0', textColor: '#008000' },
  { title: "TOPIK I - 2-р түвшин", subtitle: "Суурь түвшин", badge: "TOPIK I", badgeColor: '#B0B0FF', textColor: '#0000FF' },
  { title: "TOPIK II - 3-р түвшин", subtitle: "Дундаж түвшин", badge: "TOPIK II", badgeColor: '#FFFFB0', textColor: '#595900' },
  { title: "TOPIK II - 4-р түвшин", subtitle: "Дунд дээд түвшин", badge: "TOPIK II", badgeColor: '#FF4500', textColor: '#392700' },
  { title: "TOPIK II - 5-р түвшин", subtitle: "Ахисан түвшин", badge: "TOPIK II", badgeColor: '#FFC800', textColor: '#8A6C00' },
  { title: "TOPIK II - 6-р түвшин", subtitle: "Мэргэжлийн түвшин", badge: "TOPIK II", badgeColor: '#FFB0FF', textColor: '#A700A7' },
];

const cardShadowStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const LevelCard: React.FC<{ level: Level }> = ({ level }) => {
  const { title, subtitle, badge, badgeColor, textColor } = level;
  return (
    <Card style={[styles.cardLevel, cardShadowStyle]}>
      <View style={styles.levelContent}>
        <CardHeader style={styles.levelTitle}>{title}</CardHeader>
        <CardTitle style={styles.levelSubtitle}>{subtitle}</CardTitle>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: textColor }]}>{badge}</Text>
        </View>
      </View>
    </Card>
  );
};

const HomeScreen = () => {
  // ✅ useNavigation hook ашиглах


  return (
    <View style={{ flex: 1 }}>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
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

          <SectionTitle style={{ marginTop: 24 }}>Түвшин тогтоох шалгалт</SectionTitle>

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
              icon="play-outline"
              iconStyle={{ color: '#155DFC', marginRight: 16 }}
              style={styles.startTestButton}
              textStyle={styles.startTestButtonText}
              title="Шалгалт эхлүүлэх"
              onPress={() => {}}
            />
          </Card>

          <SectionTitle style={{ marginTop: 24 }}>Түвшнүүд</SectionTitle>
          {levels.map((level, index) => (
            <LevelCard key={index} level={level} />
          ))}
        </View>
      </ScrollView>

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
  startTestButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  startTestButtonText: {
    color: '#155DFC',
    fontWeight: '400',
  },
  cardLevel: {
    width: '100%',
    backgroundColor: '#ffffff',
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
  },
  levelContent: {
    alignItems: 'center',
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
});

export default HomeScreen;