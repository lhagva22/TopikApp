import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import SectionTitle from '../../../shared/components/atoms/sectionTitle';
import { InlineMessage } from '../../../shared/components/feedback';
import CustomButton from '../../../shared/components/molecules/button';
import { Card, CardHeader, CardTitle } from '../../../shared/components/molecules/card';
import { getErrorMessage } from '../../../shared/lib/errors';
import { PaymentScreen as Payment, usePaymentModal } from '../../payment';
import { examApi } from '../api/examApi';
import { useExam } from '../hooks/useExam';

const statsItems = [
  {
    id: 1,
    title: 'Өгсөн',
    value: 0,
    icon: 'checkmark-circle-outline',
    iconColor: '#22C55E',
  },
  {
    id: 2,
    title: 'Дундаж оноо',
    value: 0,
    icon: 'stats-chart-outline',
    iconColor: '#155DFC',
  },
  {
    id: 3,
    title: 'Нийт',
    value: 0,
    icon: 'document-text-outline',
    iconColor: '#800080',
  },
];

type ExamFilter = 'ALL' | 'TOPIK_I' | 'TOPIK_II';

const filterItems: Array<{ key: ExamFilter; label: string }> = [
  { key: 'ALL', label: 'Бүгд' },
  { key: 'TOPIK_I', label: 'TOPIK I' },
  { key: 'TOPIK_II', label: 'TOPIK II' },
];

const ExamScreen = () => {
  const navigation = useNavigation<any>();
  const { showPayment, openPayment, closePayment } = usePaymentModal();
  const [stats, setStats] = useState({ taken: 0, avgScore: 0, total: 0 });
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<ExamFilter>('ALL');

  const { exams, isLoading, error, loadExams, startExam, canStartExam, getGroupedExams, isStarting } =
    useExam();

  const groupedExams = getGroupedExams();
  const filteredTopikI = selectedFilter === 'TOPIK_II' ? [] : groupedExams.TOPIK_I;
  const filteredTopikII = selectedFilter === 'TOPIK_I' ? [] : groupedExams.TOPIK_II;
  const hasVisibleExams = filteredTopikI.length > 0 || filteredTopikII.length > 0;

  const loadData = useCallback(async () => {
    setActionError(null);
    await loadExams();
    const resultsResponse = await examApi.getResults();
    if (resultsResponse.success) {
      const results = resultsResponse.results;
      const avgScore =
        results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
          : 0;
      setStats({ taken: results.length, avgScore, total: exams.length });
    }
  }, [exams.length, loadExams]);

  useFocusEffect(
    useCallback(() => {
      const clearSession = async () => {
        const oldSession = await AsyncStorage.getItem('current_exam_session');
        if (oldSession) {
          await AsyncStorage.removeItem('current_exam_session');
        }
      };

      clearSession().catch(() => undefined);
      loadData().catch(() => undefined);
    }, [loadData]),
  );

  const handleStartExam = async (exam: any) => {
    setActionError(null);

    const check = canStartExam(exam);
    if (!check.allowed && check.requiresPayment) {
      openPayment();
      return;
    }

    await AsyncStorage.removeItem('current_exam_session');
    const result = await startExam(exam.id);

    if (result && result.success && 'session' in result && result.session) {
      navigation.navigate('ExamInterface', {
        examId: exam.id,
        sessionId: result.session.id,
        examTitle: exam.title,
        examType: exam.exam_type,
        duration: exam.duration,
        totalQuestions: exam.total_questions,
        listeningQuestions: exam.listening_questions,
        readingQuestions: exam.reading_questions,
        questions: result.questions,
      });
      return;
    }

    setActionError(getErrorMessage(result, 'Шалгалт эхлүүлэхэд алдаа гарлаа.'));
  };

  const getBadgeStyle = (examType: string) => {
    if (examType === 'TOPIK_I') {
      return { backgroundColor: '#B0FFB0', color: '#008000' };
    }

    return { backgroundColor: '#FFB0FF', color: '#A700A7' };
  };

  if (isLoading || isStarting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#155DFC" />
        <Text style={styles.loadingText}>
          {isStarting ? 'Шалгалт бэлтгэж байна...' : 'Шалгалтуудыг ачаалж байна...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton title="Дахин оролдох" onPress={loadData} style={styles.retryButton} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
    >
      <View style={styles.content}>
        <InlineMessage message={actionError} containerStyle={styles.message} />

        <View style={styles.statsRow}>
          {statsItems.map((item) => (
            <Card key={item.id} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Icon name={item.icon} size={20} color={item.iconColor} />
              </View>
              <Text style={styles.statValue}>
                {item.id === 1 ? stats.taken : item.id === 2 ? `${stats.avgScore}%` : exams.length}
              </Text>
              <CardTitle style={styles.statTitle}>{item.title}</CardTitle>
            </Card>
          ))}
        </View>

        <View style={styles.filterContainer}>
          {filterItems.map((item) => {
            const isActive = selectedFilter === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => setSelectedFilter(item.key)}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {filteredTopikI.length > 0 && (
          <>
            <SectionTitle viewStyle={styles.sectionTitle}>TOPIK I (Анхан шат)</SectionTitle>
            {filteredTopikI.map((exam) => {
              const badgeStyle = getBadgeStyle(exam.exam_type);
              return (
                <Card key={exam.id} style={styles.examCard}>
                  <CardHeader>{exam.title}</CardHeader>

                  <View style={styles.badgeContainer}>
                    <CardTitle
                      containerStyle={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}
                      style={[styles.badgeText, { color: badgeStyle.color }]}
                    >
                      TOPIK I
                    </CardTitle>
                  </View>

                  <View style={styles.examDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="time-outline" size={16} color="#a2a2a2" />
                      <CardTitle style={styles.detailText}>
                        {exam.duration} минут {exam.total_questions} асуулт
                      </CardTitle>
                    </View>

                    <View style={styles.sectionRow}>
                      <CardTitle containerStyle={styles.sectionBadge} style={styles.sectionBadgeText}>
                        Сонсгол ({exam.listening_questions})
                      </CardTitle>
                      <CardTitle containerStyle={styles.sectionBadge} style={styles.sectionBadgeText}>
                        Уншлага ({exam.reading_questions})
                      </CardTitle>
                    </View>

                    <CustomButton
                      title="Шалгалт эхлүүлэх"
                      textStyle={styles.buttonText}
                      style={styles.button}
                      onPress={() => handleStartExam(exam)}
                    />
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {filteredTopikII.length > 0 && (
          <>
            <SectionTitle viewStyle={styles.sectionTitle}>TOPIK II (Дунд/Гүнзгий шат)</SectionTitle>
            {filteredTopikII.map((exam) => {
              const badgeStyle = getBadgeStyle(exam.exam_type);
              return (
                <Card key={exam.id} style={styles.examCard}>
                  <CardHeader>{exam.title}</CardHeader>

                  <View style={styles.badgeContainer}>
                    <CardTitle
                      containerStyle={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}
                      style={[styles.badgeText, { color: badgeStyle.color }]}
                    >
                      TOPIK II
                    </CardTitle>
                  </View>

                  <View style={styles.examDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="time-outline" size={16} color="#a2a2a2" />
                      <CardTitle style={styles.detailText}>
                        {exam.duration} минут {exam.total_questions} асуулт
                      </CardTitle>
                    </View>

                    <View style={styles.sectionRow}>
                      <CardTitle containerStyle={styles.sectionBadge} style={styles.sectionBadgeText}>
                        Сонсгол ({exam.listening_questions})
                      </CardTitle>
                      <CardTitle containerStyle={styles.sectionBadge} style={styles.sectionBadgeText}>
                        Уншлага ({exam.reading_questions})
                      </CardTitle>
                    </View>

                    <CustomButton
                      title="Шалгалт эхлүүлэх"
                      textStyle={styles.buttonText}
                      style={styles.button}
                      onPress={() => handleStartExam(exam)}
                    />
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {!hasVisibleExams && !isLoading && (
          <View style={styles.emptyContainer}>
            <Icon name="alert-circle-outline" size={48} color="#a2a2a2" />
            <Text style={styles.emptyText}>
              {exams.length === 0 ? 'Шалгалт олдсонгүй' : 'Энэ шүүлтүүрт таарах шалгалт олдсонгүй'}
            </Text>
          </View>
        )}
      </View>

      <Payment visible={showPayment} onClose={closePayment} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  message: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#155DFC',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    color: '#a9a9a9',
    fontWeight: '300',
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#155DFC',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  examCard: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    fontWeight: '300',
    fontSize: 12,
  },
  examDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  detailText: {
    color: '#a2a2a2',
    fontSize: 13,
  },
  sectionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  sectionBadgeText: {
    fontWeight: '300',
    fontSize: 12,
    color: '#666',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#155DFC',
  },
  buttonText: {
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#a2a2a2',
  },
});

export default ExamScreen;
