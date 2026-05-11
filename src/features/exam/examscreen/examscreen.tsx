import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { InlineMessage } from '../../../shared/components/feedback';
import CustomButton from '../../../shared/components/molecules/button';
import { getErrorMessage } from '../../../shared/lib/errors';
import { PaymentScreen as Payment, usePaymentModal } from '../../payment';
import { examApi } from '../api/examApi';
import { useExam } from '../hooks/useExam';

type ExamFilter = 'ALL' | 'TOPIK_I' | 'TOPIK_II';

const filterItems: Array<{ key: ExamFilter; label: string }> = [
  { key: 'ALL', label: 'Бүгд' },
  { key: 'TOPIK_I', label: 'TOPIK I' },
  { key: 'TOPIK_II', label: 'TOPIK II' },
];

const TOPIK_I_THEME  = { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', badgeBg: '#D1FAE5' };
const TOPIK_II_THEME = { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', badgeBg: '#EDE9FE' };

const ExamScreen = () => {
  const navigation = useNavigation<any>();
  const { showPayment, openPayment, closePayment } = usePaymentModal();
  const [stats, setStats] = useState({ taken: 0, avgScore: 0, total: 0 });
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<ExamFilter>('ALL');

  const { exams, isLoading, error, loadExams, startExam, canStartExam, getGroupedExams, isStarting } =
    useExam();

  const groupedExams = getGroupedExams();
  const filteredTopikI  = selectedFilter === 'TOPIK_II' ? [] : groupedExams.TOPIK_I;
  const filteredTopikII = selectedFilter === 'TOPIK_I'  ? [] : groupedExams.TOPIK_II;
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
        const old = await AsyncStorage.getItem('current_exam_session');
        if (old) await AsyncStorage.removeItem('current_exam_session');
      };
      clearSession().catch(() => undefined);
      loadData().catch(() => undefined);
    }, [loadData]),
  );

  const handleStartExam = async (exam: any) => {
    setActionError(null);
    const check = canStartExam(exam);
    if (!check.allowed && check.requiresPayment) { openPayment(); return; }

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

  if (isLoading || isStarting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#155DFC" />
        <Text style={styles.centerText}>
          {isStarting ? 'Шалгалт бэлтгэж байна...' : 'Ачаалж байна...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Icon name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.centerError}>{error}</Text>
        <CustomButton title="Дахин оролдох" onPress={loadData} style={styles.retryBtn} />
      </View>
    );
  }

  const ExamCard = ({ exam, theme }: { exam: any; theme: typeof TOPIK_I_THEME }) => (
    <View style={[styles.examCard, { borderLeftColor: theme.color }]}>
      <View style={styles.examCardTop}>
        <View style={styles.examCardLeft}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: theme.badgeBg }]}>
            <Text style={[styles.typeBadgeText, { color: theme.color }]}>{exam.exam_type.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={[styles.examIconBox, { backgroundColor: theme.bg }]}>
          <Icon name="document-text-outline" size={22} color={theme.color} />
        </View>
      </View>

      <View style={styles.examMeta}>
        <View style={styles.metaChip}>
          <Icon name="time-outline" size={13} color="#64748B" />
          <Text style={styles.metaChipText}>{exam.duration} мин</Text>
        </View>
        <View style={styles.metaChip}>
          <Icon name="help-circle-outline" size={13} color="#64748B" />
          <Text style={styles.metaChipText}>{exam.total_questions} асуулт</Text>
        </View>
        <View style={styles.metaChip}>
          <Icon name="volume-medium-outline" size={13} color="#64748B" />
          <Text style={styles.metaChipText}>Сонсгол {exam.listening_questions}</Text>
        </View>
        <View style={styles.metaChip}>
          <Icon name="book-outline" size={13} color="#64748B" />
          <Text style={styles.metaChipText}>Уншлага {exam.reading_questions}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: theme.color }]}
        onPress={() => handleStartExam(exam)}
        activeOpacity={0.85}
      >
        <Icon name="play" size={16} color="#fff" />
        <Text style={styles.startBtnText}>Шалгалт эхлүүлэх</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
      showsVerticalScrollIndicator={false}
    >
      <InlineMessage message={actionError} containerStyle={styles.message} />

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Өгсөн',       value: String(stats.taken),       icon: 'checkmark-circle-outline', color: '#059669', bg: '#ECFDF5' },
          { label: 'Дундаж оноо', value: `${stats.avgScore}%`,      icon: 'stats-chart-outline',      color: '#155DFC', bg: '#EFF6FF' },
          { label: 'Нийт',        value: String(exams.length),      icon: 'library-outline',           color: '#8B5CF6', bg: '#F5F3FF' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
              <Icon name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {filterItems.map((item) => {
          const active = selectedFilter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setSelectedFilter(item.key)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* TOPIK I */}
      {filteredTopikI.length > 0 && (
        <>
          <View style={styles.groupHeader}>
            <View style={[styles.groupDot, { backgroundColor: TOPIK_I_THEME.color }]} />
            <Text style={[styles.groupTitle, { color: TOPIK_I_THEME.color }]}>TOPIK I</Text>
            <Text style={styles.groupSub}>Анхан шат</Text>
          </View>
          {filteredTopikI.map((exam) => (
            <ExamCard key={exam.id} exam={exam} theme={TOPIK_I_THEME} />
          ))}
        </>
      )}

      {/* TOPIK II */}
      {filteredTopikII.length > 0 && (
        <>
          <View style={styles.groupHeader}>
            <View style={[styles.groupDot, { backgroundColor: TOPIK_II_THEME.color }]} />
            <Text style={[styles.groupTitle, { color: TOPIK_II_THEME.color }]}>TOPIK II</Text>
            <Text style={styles.groupSub}>Дунд / Гүнзгий шат</Text>
          </View>
          {filteredTopikII.map((exam) => (
            <ExamCard key={exam.id} exam={exam} theme={TOPIK_II_THEME} />
          ))}
        </>
      )}

      {!hasVisibleExams && (
        <View style={styles.empty}>
          <Icon name="file-tray-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {exams.length === 0 ? 'Шалгалт олдсонгүй' : 'Энэ шүүлтүүрт таарах шалгалт олдсонгүй'}
          </Text>
        </View>
      )}

      <Payment
        visible={showPayment}
        onClose={closePayment}
        onSelectPlan={(item) => {
          navigation.navigate('PaymentCheckout', {
            planId: item.id, planTitle: item.title, planPrice: item.price, planMonths: item.months,
          });
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24, gap: 12 },
  centerText: { fontSize: 14, color: '#64748B' },
  centerError: { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  retryBtn: { marginTop: 8 },
  message: { marginBottom: 12 },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  /* Filter */
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: '#155DFC', borderColor: '#155DFC' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },

  /* Group header */
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 },
  groupDot: { width: 4, height: 20, borderRadius: 2 },
  groupTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  groupSub: { fontSize: 12, color: '#94A3B8' },

  /* Exam card */
  examCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  examCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  examCardLeft: { flex: 1, gap: 6 },
  examTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  examIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  examMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  metaChipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: '#94A3B8' },
});

export default ExamScreen;
