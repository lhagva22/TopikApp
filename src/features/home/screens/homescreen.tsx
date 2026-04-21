// src/features/home/screens/HomeScreen.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSharedStore } from '../../../store/sharedStore';
import { useHome } from '../hooks/useHome';
import { LEVELS } from '../constants/levels';
import { Card, CardHeader, CardTitle } from '../../../shared/components/molecules/card';
import CustomButton from '../../../shared/components/molecules/button';
import SectionTitle from '../../../shared/components/atoms/sectionTitle';
import Payment from '../../../features/payment/payment';
import { LevelCard } from '../components/LevelCard';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated } = useSharedStore();
  const { userLevel, loading, loadUserLevel, startLevelTest } = useHome();
  const [showPayment, setShowPayment] = React.useState(false);

  useFocusEffect(useCallback(() => { loadUserLevel(); }, [isAuthenticated, user?.id]));

// src/features/home/screens/HomeScreen.tsx - зассан хэсэг
const handleStartLevelTest = async () => {
  if (user?.status !== 'premium') {
    setShowPayment(true);
    return;
  }
  
  const result = await startLevelTest();
  
  // ✅ Type guard ашиглан шалгах
  if (result.success && result.data) {
    const { test, session, questions } = result.data;
    navigation.navigate('ExamInterface', {
      examId: test.id,
      examTitle: test.title,
      examType: test.exam_type,
      duration: test.duration,
      totalQuestions: test.total_questions,
      listeningQuestions: test.listening_questions,
      readingQuestions: test.reading_questions,
      sessionId: session.id,
      questions: questions,
      isLevelTest: true,
      onComplete: loadUserLevel,
    });
  } else {
    // ✅ result.success === false үед error байгаа
    const errorMsg = 'error' in result ? result.error : 'Шалгалт эхлүүлэхэд алдаа гарлаа';
    Alert.alert('Алдаа', errorMsg);
  }
};

  const currentLevel = userLevel && userLevel > 0 ? LEVELS.find(l => l.levelValue === userLevel) : undefined;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#155DFC" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {currentLevel && (
            <View style={styles.currentLevelContainer}>
              <Text style={styles.currentLevelLabel}>Таны одоогийн түвшин</Text>
              <LevelCard level={currentLevel} isActive />
            </View>
          )}

          <SchoolCard />

          <SectionTitle viewStyle={{ marginTop: 20 }}>Түвшин тогтоох шалгалт</SectionTitle>

          <LevelTestCard onStart={handleStartLevelTest} onPaymentRequired={() => setShowPayment(true)} />

          <SectionTitle viewStyle={{ marginTop: 20 }}>Түвшнүүд</SectionTitle>
          {LEVELS.map(level => (
            <LevelCard key={level.levelValue} level={level} isActive={userLevel === level.levelValue} />
          ))}
        </View>
      </ScrollView>
      <Payment visible={showPayment} onClose={() => setShowPayment(false)} />
    </View>
  );
};

// Sub-components
const SchoolCard = () => (
  <Card style={[styles.schoolCard, cardShadowStyle]}>
    <View style={styles.schoolRow}>
      <View style={styles.schoolIconWrapper}>
        <Icon name="school-outline" size={40} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <CardHeader>Шинэ эхлэл нархан сургууль</CardHeader>
        <CardTitle>Шинэ эхлэл нархан сургууль нь ахлах ангидаа Солонгос улсад шилжин суралцах боломжтой Монгол улсын цорын ганц сургууль юм.</CardTitle>
      </View>
    </View>
  </Card>
);

const LevelTestCard = ({ onStart, onPaymentRequired }: { onStart: () => void; onPaymentRequired: () => void }) => (
  <Card style={[styles.levelTestCard, cardShadowStyle]}>
    <CardHeader style={styles.levelTestHeader}>Өөрийн түвшинг мэдээрэй</CardHeader>
    <CardTitle style={styles.levelTestSubtitle}>Богино шалгалтаар өөрийн Солонгос хэлний түвшинг тогтоож, тохирсон хичээлийг сонгоорой</CardTitle>
    <Card style={[styles.levelTestInfoCard, cardShadowStyle]}>
      <View style={styles.levelTestInfoRow}>
        <View style={styles.levelTestInfoColumn}><CardTitle style={styles.levelTestInfoLabel}>Хугацаа</CardTitle><CardTitle style={styles.levelTestInfoValue}>15 минут</CardTitle></View>
        <View style={styles.levelTestInfoColumn}><CardTitle style={styles.levelTestInfoLabel}>Асуултууд</CardTitle><CardTitle style={styles.levelTestInfoValue}>20 асуулт</CardTitle></View>
      </View>
    </Card>
    <CustomButton title="Шалгалт эхлүүлэх" style={{ backgroundColor: "#ffffff" }} textStyle={{ color: "#155DFC", fontWeight: '400' }} icon="play-outline" iconSize={20} iconStyle={{ color: '#155dfc' }} onPress={onStart} onPaymentRequired={onPaymentRequired} />
  </Card>
);

const cardShadowStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  content: { padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  currentLevelContainer: { marginBottom: 16 },
  currentLevelLabel: { fontSize: 16, fontWeight: '600', color: '#155DFC', marginBottom: 8, marginLeft: 4 },
  schoolCard: { width: '100%', padding: 16, borderRadius: 12, marginTop: 16 },
  schoolRow: { flexDirection: 'row', alignItems: 'center' },
  schoolIconWrapper: { marginRight: 16, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, padding: 8, backgroundColor: '#155DFC', justifyContent: 'center', alignItems: 'center' },
  levelTestCard: { width: '100%', backgroundColor: '#155DFC', marginTop: 24, padding: 24, borderRadius: 12 },
  levelTestHeader: { color: '#fff', fontWeight: '400', paddingBottom: 16 },
  levelTestSubtitle: { color: '#fff', paddingBottom: 16 },
  levelTestInfoCard: { backgroundColor: '#4B83FF', borderRadius: 12, padding: 16 },
  levelTestInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelTestInfoColumn: { flexDirection: 'column' },
  levelTestInfoLabel: { color: '#fff' },
  levelTestInfoValue: { color: '#fff', fontWeight: 'bold' },
});

export default HomeScreen;