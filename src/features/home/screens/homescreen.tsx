import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppStore } from '../../../app/store';
import { PaymentScreen as Payment, usePaymentModal } from '../../../features/payment';
import { InlineMessage } from '../../../shared/components/feedback';
import { getErrorMessage } from '../../../shared/lib/errors';
import { LevelCard } from '../components/LevelCard';
import { LEVELS } from '../constants/levels';
import { useHome } from '../hooks/useHome';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const { userLevel, loading, startingLevelTest, loadUserLevel, startLevelTest } = useHome();
  const { showPayment, openPayment, closePayment } = usePaymentModal();
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [showLevelTestInfo, setShowLevelTestInfo] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserLevel();
    }, [loadUserLevel]),
  );

  const handleStartLevelTest = async () => {
    setActionError(null);

    if (user?.status !== 'premium') {
      openPayment();
      return;
    }

    setShowLevelTestInfo(true);
  };

  const handleConfirmLevelTestStart = async () => {
    setShowLevelTestInfo(false);

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
      getErrorMessage(
        'error' in result ? result.error : null,
        'Шалгалт эхлүүлэхэд алдаа гарлаа.',
      ),
    );
  };

  const currentLevel =
    userLevel && userLevel > 0 ? LEVELS.find((level) => level.levelValue === userLevel) : undefined;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#155DFC" />
        <Text style={styles.loadingText}>Home ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetTitle}>
              {user?.name ? `Сайн байна уу, ${user.name}!` : 'Сайн байна уу!'}
            </Text>
            <Text style={styles.greetSub}>TOPIK шалгалтын бэлтгэлд тавтай морил</Text>
          </View>
          <View style={styles.greetIcon}>
            <Icon name="book-outline" size={22} color="#155DFC" />
          </View>
        </View>

        {currentLevel ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Таны одоогийн түвшин</Text>
            </View>
            <LevelCard level={currentLevel} isActive />
          </View>
        ) : null}

        <View style={styles.schoolCard}>
          <View style={styles.schoolIconBox}>
            <Icon name="school-outline" size={24} color="#fff" />
          </View>
          <View style={styles.schoolBody}>
            <Text style={styles.schoolTitle}>Шинэ эхлэл нархан сургууль</Text>
            <Text style={styles.schoolDesc}>
              Ахлах ангидаа Солонгос улсад шилжин суралцах боломжтой Монгол улсын цорын
              ганц сургууль.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Түвшин тогтоох шалгалт</Text>
          </View>

          <InlineMessage message={actionError} containerStyle={styles.message} />

          <View style={styles.testCard}>
            <View style={styles.testTopRow}>
              <View style={styles.testIconBox}>
                <Icon name="trophy-outline" size={22} color="#F59E0B" />
              </View>
              <View style={styles.testBody}>
                <Text style={styles.testTitle}>
                  Өөрийн түвшинг зөвхөн бүтэн mock test-ээр тодорхойлно.
                </Text>
              </View>
            </View>

            <View style={styles.testChips}>
              <View style={styles.testChip}>
                <Icon name="school-outline" size={13} color="#93C5FD" />
                <Text style={styles.testChipText}>Random TOPIK I mock test</Text>
              </View>
              <View style={styles.testChip}>
                <Icon name="trending-up-outline" size={13} color="#93C5FD" />
                <Text style={styles.testChipText}>140+ бол TOPIK II нээгдэнэ</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.testBtn, startingLevelTest && styles.testBtnDisabled]}
              onPress={handleStartLevelTest}
              activeOpacity={0.85}
              disabled={startingLevelTest}
            >
              <Icon name="play" size={16} color="#155DFC" />
              <Text style={styles.testBtnText}>Шалгалт эхлүүлэх</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Түвшнүүд</Text>
          </View>
          {LEVELS.map((level) => (
            <LevelCard
              key={level.levelValue}
              level={level}
              isActive={userLevel === level.levelValue}
            />
          ))}
        </View>
      </ScrollView>

      <Payment
        visible={showPayment}
        onClose={closePayment}
        onSelectPlan={(item) => {
          navigation.navigate('PaymentCheckout', {
            planId: item.id,
            planTitle: item.title,
            planPrice: item.price,
            planMonths: item.months,
          });
        }}
      />

      <Modal visible={showLevelTestInfo} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Icon name="school-outline" size={24} color="#155DFC" />
            </View>
            <Text style={styles.modalTitle}>Түвшин тогтоох шалгалтын мэдээлэл</Text>
            <Text style={styles.modalText}>
              1. Энэ flow нь богино тест биш, бүтэн mock test ашиглана.
            </Text>
            <Text style={styles.modalText}>
              2. Эхлээд санамсаргүй TOPIK I mock test эхэлнэ.
            </Text>
            <Text style={styles.modalText}>
              3. Хэрэв 140-аас дээш оноо авбал TOPIK II шат нээгдэнэ.
            </Text>
            <Text style={styles.modalText}>
              4. Энэ дүрэм зөвхөн түвшин тогтоох үед үйлчилнэ. Энгийн mock test-д
              хамаарахгүй.
            </Text>
            <Text style={styles.modalText}>
              5. Дууссаны дараа Home дээрх "Түвшнүүд" хэсэгт өөрийн байрлалыг харна.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLevelTestInfo(false)}
                activeOpacity={0.85}
                disabled={startingLevelTest}
              >
                <Text style={styles.modalCancelText}>Буцах</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, startingLevelTest && styles.modalConfirmButtonDisabled]}
                onPress={handleConfirmLevelTestStart}
                activeOpacity={0.85}
                disabled={startingLevelTest}
              >
                {startingLevelTest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Шалгалт эхлүүлэх</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {startingLevelTest ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#155DFC" />
            <Text style={styles.loadingOverlayTitle}>Шалгалт бэлтгэж байна...</Text>
            <Text style={styles.loadingOverlayText}>
              Түвшин тогтоох mock test-ийг ачаалж байна.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B' },

  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  greetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  greetSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  greetIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    gap: 14,
  },
  schoolIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolBody: { flex: 1 },
  schoolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  schoolDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },

  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#155DFC',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  message: { marginBottom: 10 },

  testCard: {
    backgroundColor: '#155DFC',
    borderRadius: 18,
    padding: 18,
  },
  testTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  testIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBody: { flex: 1 },
  testTitle: {
    fontSize: 13,
    color: '#DBEAFE',
    lineHeight: 20,
    fontWeight: '500',
  },
  testChips: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BFDBFE',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 13,
  },
  testBtnDisabled: {
    opacity: 0.7,
  },
  testBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#155DFC',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#155DFC',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.8,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  loadingOverlayTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  loadingOverlayText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#64748B',
  },
});

export default HomeScreen;
