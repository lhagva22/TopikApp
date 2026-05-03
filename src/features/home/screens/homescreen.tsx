import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppStore } from '../../../app/store';
import Payment from '../../../features/payment/payment';
import SectionTitle from '../../../shared/components/atoms/sectionTitle';
import { InlineMessage } from '../../../shared/components/feedback';
import CustomButton from '../../../shared/components/molecules/button';
import { Card, CardHeader, CardTitle } from '../../../shared/components/molecules/card';
import { getErrorMessage } from '../../../shared/lib/errors';
import { LevelCard } from '../components/LevelCard';
import { LEVELS } from '../constants/levels';
import { useHome } from '../hooks/useHome';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const { userLevel, loading, loadUserLevel, startLevelTest } = useHome();
  const [showPayment, setShowPayment] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserLevel();
    }, [loadUserLevel, user?.id, user?.status]),
  );

  const handleStartLevelTest = async () => {
    setActionError(null);

    if (user?.status !== 'premium') {
      setShowPayment(true);
      return;
    }

    const result = await startLevelTest();

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
        questions,
        isLevelTest: true,
      });

      return;
    }

    setActionError(
      getErrorMessage('error' in result ? result.error : null, 'Шалгалт эхлүүлэхэд алдаа гарлаа.'),
    );
  };

  const currentLevel =
    userLevel && userLevel > 0 ? LEVELS.find((level) => level.levelValue === userLevel) : undefined;
  const isGuest = user?.status === 'guest';

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#155DFC" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {currentLevel && (
            <View style={styles.currentLevelContainer}>
              <Text style={styles.currentLevelLabel}>Таны одоогийн түвшин</Text>
              <LevelCard level={currentLevel} isActive />
            </View>
          )}

          {isGuest && (
            <Card style={[styles.guestCard, cardShadowStyle]}>
              <View style={styles.guestHeader}>
                <Icon name="person-outline" size={22} color="#155DFC" />
                <Text style={styles.guestTitle}>Зочин горим</Text>
              </View>
              <Text style={styles.guestText}>
                Та аппыг шууд ашиглаж болно. Түвшин тогтоох шалгалт болон ахицын хэсэг нь төлбөртэй
                багц дээр нээгдэнэ.
              </Text>
            </Card>
          )}

          <SchoolCard />

          <SectionTitle viewStyle={{ marginTop: 20 }}>Түвшин тогтоох шалгалт</SectionTitle>
          <InlineMessage message={actionError} containerStyle={styles.message} />
          <LevelTestCard onStart={handleStartLevelTest} onPaymentRequired={() => setShowPayment(true)} />

          <SectionTitle viewStyle={{ marginTop: 20 }}>Түвшнүүд</SectionTitle>
          {LEVELS.map((level) => (
            <LevelCard key={level.levelValue} level={level} isActive={userLevel === level.levelValue} />
          ))}
        </View>
      </ScrollView>

      <Payment visible={showPayment} onClose={() => setShowPayment(false)} />
    </View>
  );
};

const SchoolCard = () => (
  <Card style={[styles.schoolCard, cardShadowStyle]}>
    <View style={styles.schoolRow}>
      <View style={styles.schoolIconWrapper}>
        <Icon name="school-outline" size={40} color="#fff" />
      </View>
      <View style={styles.schoolText}>
        <CardHeader>Шинэ эхлэл нархан сургууль</CardHeader>
        <CardTitle>
          Шинэ эхлэл нархан сургууль нь ахлах ангидаа Солонгос улсад шилжин суралцах боломжтой
          Монгол улсын цорын ганц сургууль юм.
        </CardTitle>
      </View>
    </View>
  </Card>
);

const LevelTestCard = ({
  onStart,
  onPaymentRequired,
}: {
  onStart: () => void;
  onPaymentRequired: () => void;
}) => (
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
      style={styles.levelTestButton}
      textStyle={styles.levelTestButtonText}
      icon="play-outline"
      iconSize={20}
      iconStyle={styles.levelTestButtonIcon}
      onPress={onStart}
      onPaymentRequired={onPaymentRequired}
    />
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
  screen: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  message: {
    marginTop: 12,
  },
  guestCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: '#eff6ff',
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#155DFC',
  },
  guestText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
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
  schoolText: {
    flex: 1,
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
  levelTestButton: {
    backgroundColor: '#ffffff',
  },
  levelTestButtonText: {
    color: '#155DFC',
    fontWeight: '400',
  },
  levelTestButtonIcon: {
    color: '#155DFC',
  },
});

export default HomeScreen;
