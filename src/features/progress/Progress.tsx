import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-gifted-charts';

import type { RootDrawerParamList } from '../../app/navigation/types';
import { InlineMessage } from '../../shared/components/feedback';
import Button from '../../shared/components/molecules/button';
import { SubscriptionStatus } from '../../shared/components/organisms/SubscriptionStatus';
import { useProgress } from './index';

type ProgressNavigationProp = DrawerScreenProps<RootDrawerParamList, 'Progress'>['navigation'];

const METRIC_CARDS = (avg: number, count: number, rate: number, time: number) => [
  { icon: 'locate',  color: '#155DFC', bg: '#EFF6FF', label: 'Дундаж оноо',    value: `${avg}%`,        extra: null },
  { icon: 'trophy',  color: '#059669', bg: '#ECFDF5', label: 'Өгсөн шалгалт',  value: `${count}`,       extra: null },
  { icon: 'pulse',   color: '#8B5CF6', bg: '#F5F3FF', label: 'Өөрчлөлт',       value: `${rate > 0 ? '+' : ''}${rate}%`, extra: rate },
  { icon: 'time',    color: '#EA580C', bg: '#FFF7ED', label: 'Дундаж хугацаа',  value: `${time}`,        extra: 'мин' },
];

export function Progress() {
  const navigation = useNavigation<ProgressNavigationProp>();
  const {
    examResults,
    isLoading,
    error,
    reloadData,
    getAverageScore,
    getTotalExamsTaken,
    getWeakAreas,
  } = useProgress();
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [timePeriod, setTimePeriod] = useState<'all' | 'week' | 'month'>('all');
  const [chartWidth, setChartWidth] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      void reloadData();
    }, [reloadData]),
  );

  const averageScore = getAverageScore();
  const totalExams = getTotalExamsTaken();
  const weakAreas = getWeakAreas();

  const getFilteredResults = () => {
    if (timePeriod === 'all') return examResults;
    const now = new Date();
    const cutoff = new Date();
    if (timePeriod === 'week') cutoff.setDate(now.getDate() - 7);
    else cutoff.setMonth(now.getMonth() - 1);
    return examResults.filter((result) => new Date(result.date) >= cutoff);
  };

  const filteredResults = getFilteredResults();
  const recentResults = filteredResults.slice(0, 10);

  const totalStudyTime = filteredResults.reduce((sum, r) => sum + r.duration, 0);
  const avgStudyTime = filteredResults.length > 0 ? Math.round(totalStudyTime / filteredResults.length / 60) : 0;

  const getImprovementRate = () => {
    if (filteredResults.length < 2) return 0;
    const recent = filteredResults.slice(0, Math.min(3, filteredResults.length));
    const older = filteredResults.slice(Math.max(0, filteredResults.length - 3));
    const recentAvg = recent.reduce((s, r) => s + (r.totalScore / r.maxScore) * 100, 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + (r.totalScore / r.maxScore) * 100, 0) / older.length;
    return Math.round(recentAvg - olderAvg);
  };

  const improvementRate = getImprovementRate();

  const chartData = recentResults.slice().reverse().map((result, index) => ({
    value: Math.round((result.totalScore / result.maxScore) * 100),
    label: `${index + 1}`,
  }));

  const sectionData = weakAreas.map((area) => ({ name: area.category, value: area.accuracy }));

  const getErrorFrequency = () => {
    const errorMap: Record<string, number> = {};
    filteredResults.forEach((result) => {
      result.sections.forEach((section) => {
        const errors = section.totalQuestions - section.correctAnswers;
        errorMap[section.name] = (errorMap[section.name] || 0) + errors;
      });
    });
    return Object.entries(errorMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  };

  const errorFrequency = getErrorFrequency();
  const metrics = METRIC_CARDS(averageScore, filteredResults.length, improvementRate, avgStudyTime);

  if (isLoading && examResults.length === 0 && !error) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Icon name="trending-up-outline" size={28} color="#60A5FA" />
          </View>
          <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
        </View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Icon name="hourglass-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Ачааллаж байна...</Text>
          <Text style={styles.emptyDesc}>Мэдээлэл татаж байна, хүлээнэ үү.</Text>
        </View>
      </ScrollView>
    );
  }

  if (totalExams === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Icon name="trending-up-outline" size={28} color="#60A5FA" />
          </View>
          <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
          <Text style={styles.heroDesc}>Таны сурлагын явцыг энд харна.</Text>
        </View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Icon name="bar-chart-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Шалгалт өгөөгүй байна</Text>
          <Text style={styles.emptyDesc}>
            Эхний шалгалтаа өгч, ахиц дэвшлээ хянах боломжтой.
          </Text>
          <Button onPress={() => navigation.navigate('Exam')} title="Шалгалт өгөх" />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading && examResults.length > 0}
          onRefresh={() => void reloadData()}
          tintColor="#155DFC"
        />
      }
    >
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-back" size={20} color="#0F172A" />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Icon name="trending-up-outline" size={28} color="#60A5FA" />
        </View>
        <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
        <Text style={styles.heroDesc}>Таны сурлагын явцыг энд харна.</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {(['all', 'month', 'week'] as const).map((p) => {
          const labels = { all: 'Бүгд', month: 'Сар', week: '7 хоног' };
          const active = timePeriod === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setTimePeriod(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{labels[p]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <InlineMessage message={error} containerStyle={styles.message} />

      {isLoading && examResults.length > 0 && (
        <View style={styles.refreshBanner}>
          <Icon name="sync-outline" size={14} color="#155DFC" />
          <Text style={styles.refreshText}>Шинэчилж байна...</Text>
        </View>
      )}

      {/* Subscription */}
      <View style={styles.subWrap}>
        <SubscriptionStatus />
      </View>

      {/* Metrics */}
      <View style={styles.metricsGrid}>
        {metrics.map((m, i) => (
          <View key={i} style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: m.bg }]}>
              <Icon name={m.icon} size={18} color={m.color} />
            </View>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text
              style={[
                styles.metricValue,
                m.extra !== null && typeof m.extra === 'number'
                  ? m.extra >= 0 ? styles.positiveVal : styles.negativeVal
                  : null,
              ]}
            >
              {m.value}
              {m.extra === 'мин' && <Text style={styles.metricUnit}> мин</Text>}
            </Text>
          </View>
        ))}
      </View>

      {/* Chart / List card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Үр дүнгийн график</Text>
          </View>
          <View style={styles.toggleRow}>
            {(['chart', 'list'] as const).map((mode) => {
              const active = viewMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                  onPress={() => setViewMode(mode)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={mode === 'chart' ? 'bar-chart-outline' : 'list-outline'}
                    size={14}
                    color={active ? '#fff' : '#64748B'}
                  />
                  <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                    {mode === 'chart' ? 'График' : 'Жагсаалт'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {viewMode === 'chart' && chartData.length > 0 ? (
          <View
            style={styles.chartWrap}
            onLayout={(e) => {
              const w = Math.floor(e.nativeEvent.layout.width);
              if (w !== chartWidth) setChartWidth(w);
            }}
          >
            <LineChart
              data={chartData}
              width={Math.max(chartWidth - 8, 220)}
              height={200}
              color="#155DFC"
              dataPointsColor="#155DFC"
              textColor="#64748B"
              thickness={3}
              hideRules={false}
              showVerticalLines={false}
            />
          </View>
        ) : viewMode === 'list' ? (
          <View style={styles.listGap}>
            {recentResults.map((result) => {
              const pct = Math.round((result.totalScore / result.maxScore) * 100);
              const scoreColor = pct >= 80 ? '#059669' : pct >= 60 ? '#155DFC' : '#EF4444';
              const scoreBg   = pct >= 80 ? '#ECFDF5' : pct >= 60 ? '#EFF6FF' : '#FEF2F2';
              return (
                <View key={result.id} style={styles.listItem}>
                  <View style={[styles.scoreBadge, { backgroundColor: scoreBg }]}>
                    <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{pct}</Text>
                    <Text style={[styles.scoreBadgeUnit, { color: scoreColor }]}>%</Text>
                  </View>
                  <View style={styles.listItemBody}>
                    <Text style={styles.listItemTitle} numberOfLines={1}>{result.examTitle}</Text>
                    <Text style={styles.listItemDate}>{new Date(result.date).toLocaleDateString('mn-MN')}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemScore}>{result.totalScore}/{result.maxScore}</Text>
                    <Icon name="chevron-forward" size={16} color="#CBD5E1" />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Section performance */}
      {weakAreas.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: '#059669' }]} />
            <Text style={styles.sectionTitle}>Хэсэг тус бүрийн гүйцэтгэл</Text>
          </View>
          <View style={styles.barsGap}>
            {sectionData.map((item, i) => (
              <View key={i} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.name}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${item.value}%`, backgroundColor: '#155DFC' }]} />
                </View>
                <Text style={styles.barValue}>{item.value}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Error frequency */}
      {weakAreas.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.sectionTitle}>Алдааны давтамж</Text>
          </View>
          <View style={styles.barsGap}>
            {errorFrequency.map((item, i) => (
              <View key={i} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.category}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(item.count / 10, 1) * 100}%`, backgroundColor: '#EF4444' }]} />
                </View>
                <Text style={styles.barValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Detailed analysis */}
      {weakAreas.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.sectionTitle}>Дэлгэрэнгүй дүн шинжилгээ</Text>
          </View>
          <View style={styles.detailGap}>
            {weakAreas.map((area, i) => {
              const danger = area.accuracy < 60;
              const warn   = area.accuracy < 75;
              const accent = danger ? '#EF4444' : warn ? '#F59E0B' : '#059669';
              const badgeBg = danger ? '#FEF2F2' : warn ? '#FFFBEB' : '#ECFDF5';
              const barColor = accent;
              return (
                <View key={i} style={styles.detailItem}>
                  <View style={styles.detailTop}>
                    <View style={styles.detailLeft}>
                      <Text style={styles.detailCategory}>{area.category}</Text>
                      <View style={[styles.detailBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.detailBadgeText, { color: accent }]}>
                          {area.accuracy}% амжилт
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.detailPct, { color: accent }]}>{area.accuracy}%</Text>
                  </View>
                  <View style={styles.detailTrack}>
                    <View style={[styles.detailFill, { width: `${area.accuracy}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.detailHint}>
                    {danger
                      ? 'Энэ хэсэгт илүү их анхаарч, давтан дасгал хийхийг зөвлөж байна.'
                      : warn
                        ? 'Сайн байна. Тогтмол дасгал хийснээр илүү сайн үр дүнд хүрнэ.'
                        : 'Маш сайн гүйцэтгэл. Энэ түвшинг хадгалж, бусад хэсэгтээ анхаараарай.'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Recommendations */}
      <View style={styles.recLesson}>
        <View style={styles.recIconBox}>
          <Icon name="book-outline" size={20} color="#155DFC" />
        </View>
        <View style={styles.recBody}>
          <Text style={styles.recTitle}>Санал болгох дасгал</Text>
          <Text style={styles.recDesc}>
            {weakAreas[0]?.category} хэсэгт {errorFrequency[0]?.count ?? 0} алдаа гаргасан байна.
            Энэ хэсгийг сайжруулахын тулд хичээл, давтлага руу шилжээрэй.
          </Text>
          <TouchableOpacity style={styles.recBtn} onPress={() => navigation.navigate('Lesson')} activeOpacity={0.8}>
            <Text style={styles.recBtnText}>Хичээл үзэх</Text>
            <Icon name="arrow-forward" size={14} color="#155DFC" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.recLesson, styles.recExam]}>
        <View style={[styles.recIconBox, { backgroundColor: '#ECFDF5' }]}>
          <Icon name="trophy-outline" size={20} color="#059669" />
        </View>
        <View style={styles.recBody}>
          <Text style={styles.recTitle}>Шинэ шалгалт өгөх</Text>
          <Text style={styles.recDesc}>
            {improvementRate >= 0
              ? `Таны ахиц ${improvementRate}%-аар өссөн байна. Шинэ шалгалт өгч үр дүнгээ шалгаарай.`
              : 'Шинэ шалгалт өгч, ахиц дэвшлээ хянаарай.'}
          </Text>
          <TouchableOpacity style={[styles.recBtn, styles.recBtnGreen]} onPress={() => navigation.navigate('Exam')} activeOpacity={0.8}>
            <Text style={[styles.recBtnText, { color: '#059669' }]}>Шалгалт өгөх</Text>
            <Icon name="arrow-forward" size={14} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },

  /* Hero */
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  heroIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.3 },
  heroDesc:  { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  /* Filter */
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: { backgroundColor: '#155DFC', borderColor: '#155DFC' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },

  message: { marginBottom: 12 },

  refreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  refreshText: { fontSize: 12, color: '#155DFC', fontWeight: '600' },

  subWrap: { marginBottom: 14 },

  /* Metrics */
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  metricCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  metricIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  metricUnit: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  positiveVal: { color: '#059669' },
  negativeVal: { color: '#EF4444' },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },

  /* Toggle */
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  toggleBtnActive: { backgroundColor: '#155DFC' },
  toggleText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: '#fff' },

  /* Chart */
  chartWrap: { borderRadius: 12, overflow: 'hidden', width: '100%' },

  /* List */
  listGap: { gap: 8 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: { fontSize: 16, fontWeight: '800', lineHeight: 18 },
  scoreBadgeUnit: { fontSize: 10, fontWeight: '600' },
  listItemBody: { flex: 1 },
  listItemTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  listItemDate: { fontSize: 11, color: '#94A3B8' },
  listItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listItemScore: { fontSize: 12, fontWeight: '700', color: '#374151' },

  /* Bars */
  barsGap: { gap: 12 },
  barRow: { gap: 5 },
  barLabel: { fontSize: 12, color: '#374151', fontWeight: '600' },
  barTrack: { height: 7, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 11, color: '#64748B', fontWeight: '600', textAlign: 'right' },

  /* Detail */
  detailGap: { gap: 14 },
  detailItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  detailTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  detailLeft: { flex: 1, gap: 6 },
  detailCategory: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  detailBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  detailBadgeText: { fontSize: 11, fontWeight: '700' },
  detailPct: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  detailTrack: { height: 7, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  detailFill: { height: '100%', borderRadius: 4 },
  detailHint: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  /* Recommendations */
  recLesson: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recExam: { borderColor: '#E2E8F0' },
  recIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  recBody: { flex: 1, gap: 6 },
  recTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  recDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  recBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    marginTop: 2,
  },
  recBtnGreen: { backgroundColor: '#ECFDF5' },
  recBtnText: { fontSize: 12, fontWeight: '700', color: '#155DFC' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
});
