import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-gifted-charts';

import type { RootDrawerParamList } from '../../app/navigation/types';
import { InlineMessage } from '../../shared/components/feedback';
import { Card } from '../../shared/components/molecules/card';
import Button from '../../shared/components/molecules/button';
import { SubscriptionStatus } from '../../shared/components/organisms/SubscriptionStatus';
import { useProgress } from './index';

type ProgressNavigationProp = DrawerScreenProps<RootDrawerParamList, 'Progress'>['navigation'];

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

    if (timePeriod === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setMonth(now.getMonth() - 1);
    }

    return examResults.filter((result) => new Date(result.date) >= cutoff);
  };

  const filteredResults = getFilteredResults();
  const recentResults = filteredResults.slice(0, 10);

  const totalStudyTime = filteredResults.reduce((sum, result) => sum + result.duration, 0);
  const avgStudyTime =
    filteredResults.length > 0 ? Math.round(totalStudyTime / filteredResults.length / 60) : 0;

  const getImprovementRate = () => {
    if (filteredResults.length < 2) return 0;

    const recent = filteredResults.slice(0, Math.min(3, filteredResults.length));
    const older = filteredResults.slice(Math.max(0, filteredResults.length - 3));

    const recentAvg =
      recent.reduce((sum, result) => sum + (result.totalScore / result.maxScore) * 100, 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, result) => sum + (result.totalScore / result.maxScore) * 100, 0) /
      older.length;

    return Math.round(recentAvg - olderAvg);
  };

  const improvementRate = getImprovementRate();

  const chartData = recentResults
    .slice()
    .reverse()
    .map((result, index) => ({
      value: Math.round((result.totalScore / result.maxScore) * 100),
      label: `${index + 1}`,
    }));

  const sectionData = weakAreas.map((area) => ({
    name: area.category,
    value: area.accuracy,
  }));

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
      .sort((left, right) => right.count - left.count);
  };

  const errorFrequency = getErrorFrequency();
  const showInitialLoading = isLoading && examResults.length === 0 && !error;
  const handleGoBack = () => navigation.goBack();
  if (showInitialLoading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.pageTitle}>Ахиц дэвшил</Text>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Мэдээлэл ачааллаж байна...</Text>
          </Card>
        </View>
      </ScrollView>
    );
  }

  if (totalExams === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.pageTitle}>Ахиц дэвшил</Text>

          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Icon name="bar-chart" size={32} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>Шалгалт өгөөгүй байна</Text>
            <Text style={styles.emptyText}>
              Та одоогоор шалгалт өгөөгүй байна. Эхний шалгалтаа өгч, ахиц дэвшлээ хянах боломжтой.
            </Text>
            <Button onPress={() => navigation.navigate('Exam')} title="Шалгалт өгөх" />
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView

      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading && examResults.length > 0}
          onRefresh={() => void reloadData()}
          tintColor="#3b82f6"
        />
      }
    >


      <View style={styles.contentContainer}>
      <TouchableOpacity style={{margin: 10}}onPress={handleGoBack}>
        <Icon name="arrow-back-outline" size={24} color="#333" />
      </TouchableOpacity>
        <View style={styles.header}>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, timePeriod === 'all' && styles.filterButtonActive]}
              onPress={() => setTimePeriod('all')}
            >
              <Text style={[styles.filterText, timePeriod === 'all' && styles.filterTextActive]}>
                Бүгд
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, timePeriod === 'month' && styles.filterButtonActive]}
              onPress={() => setTimePeriod('month')}
            >
              <Text style={[styles.filterText, timePeriod === 'month' && styles.filterTextActive]}>
                Сар
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, timePeriod === 'week' && styles.filterButtonActive]}
              onPress={() => setTimePeriod('week')}
            >
              <Text style={[styles.filterText, timePeriod === 'week' && styles.filterTextActive]}>
                7 хоног
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <InlineMessage message={error} containerStyle={styles.message} />

        {isLoading && examResults.length > 0 ? (
          <Card style={styles.loadingCard}>
            <Text style={styles.loadingText}>Шинэчилж ачааллаж байна...</Text>
          </Card>
        ) : null}

        <View style={styles.subscriptionContainer}>
          <SubscriptionStatus />
        </View>

        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#dbeafe' }]}>
              <Icon name="locate" size={20} color="#2563eb" />
            </View>
            <Text style={styles.metricLabel}>Дундаж оноо</Text>
            <Text style={styles.metricValue}>{averageScore}%</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#dcfce7' }]}>
              <Icon name="trophy" size={20} color="#16a34a" />
            </View>
            <Text style={styles.metricLabel}>Өгсөн шалгалт</Text>
            <Text style={styles.metricValue}>{filteredResults.length}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#f3e8ff' }]}>
              <Icon name="pulse" size={20} color="#9333ea" />
            </View>
            <Text style={styles.metricLabel}>Өөрчлөлт</Text>
            <Text
              style={[
                styles.metricValue,
                improvementRate >= 0 ? styles.positiveText : styles.negativeText,
              ]}
            >
              {improvementRate > 0 ? '+' : ''}
              {improvementRate}%
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#ffedd5' }]}>
              <Icon name="time" size={20} color="#ea580c" />
            </View>
            <Text style={styles.metricLabel}>Дундаж хугацаа</Text>
            <Text style={styles.metricValue}>
              {avgStudyTime}
              <Text style={styles.metricUnit}>мин</Text>
            </Text>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <Icon name="trending-up" size={20} color="#6b7280" />
              <Text style={styles.chartTitle}>Үр дүнгийн график</Text>
            </View>
            <View style={styles.viewModeContainer}>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'chart' && styles.viewModeActive]}
                onPress={() => setViewMode('chart')}
              >
                <Icon name="bar-chart" size={16} color={viewMode === 'chart' ? '#fff' : '#6b7280'} />
                <Text style={[styles.viewModeText, viewMode === 'chart' && styles.viewModeTextActive]}>
                  График
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeActive]}
                onPress={() => setViewMode('list')}
              >
                <Icon name="list" size={16} color={viewMode === 'list' ? '#fff' : '#6b7280'} />
                <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
                  Жагсаалт
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {viewMode === 'chart' && chartData.length > 0 ? (
            <View
              style={styles.chart}
              onLayout={(event) => {
                const nextWidth = Math.floor(event.nativeEvent.layout.width);
                if (nextWidth !== chartWidth) {
                  setChartWidth(nextWidth);
                }
              }}
            >
              <LineChart
                data={chartData}
                width={Math.max(chartWidth - 8, 220)}
                height={220}
                color="#3b82f6"
                dataPointsColor="#3b82f6"
                textColor="#6b7280"
                thickness={3}
                hideRules={false}
                showVerticalLines={false}
              />
            </View>
          ) : viewMode === 'list' ? (
            <View style={styles.listContainer}>
              {recentResults.map((result) => {
                const percentage = Math.round((result.totalScore / result.maxScore) * 100);
                return (
                  <TouchableOpacity key={result.id} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <View
                        style={[
                          styles.listItemScore,
                          percentage >= 80
                            ? styles.scoreHigh
                            : percentage >= 60
                              ? styles.scoreMedium
                              : styles.scoreLow,
                        ]}
                      >
                        <Text style={styles.listItemScoreText}>{percentage}</Text>
                      </View>
                      <View>
                        <Text style={styles.listItemTitle}>{result.examTitle}</Text>
                        <Text style={styles.listItemDate}>
                          {new Date(result.date).toLocaleDateString('mn-MN')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.listItemRight}>
                      <View style={styles.listItemScoreDetail}>
                        <Text style={styles.listItemScoreLabel}>Оноо</Text>
                        <Text style={styles.listItemScoreValue}>
                          {result.totalScore}/{result.maxScore}
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={20} color="#9ca3af" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </Card>

        {weakAreas.length > 0 && (
          <View style={styles.analysisGrid}>
            <Card style={styles.analysisCard}>
              <View style={styles.analysisTitle}>
                <Icon name="bar-chart" size={20} color="#6b7280" />
                <Text style={styles.analysisTitleText}>Хэсэг тус бүрийн гүйцэтгэл</Text>
              </View>
              <View style={styles.barChartContainer}>
                {sectionData.map((item, index) => (
                  <View key={index} style={styles.barChartItem}>
                    <Text style={styles.barChartLabel}>{item.name}</Text>
                    <View style={styles.barChartBarContainer}>
                      <View
                        style={[
                          styles.barChartBar,
                          { width: `${item.value}%`, backgroundColor: '#3b82f6' },
                        ]}
                      />
                    </View>
                    <Text style={styles.barChartValue}>{item.value}%</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.analysisCard}>
              <View style={styles.analysisTitle}>
                <Icon name="alert-circle" size={20} color="#6b7280" />
                <Text style={styles.analysisTitleText}>Алдааны давтамж</Text>
              </View>
              <View style={styles.barChartContainer}>
                {errorFrequency.map((item, index) => (
                  <View key={index} style={styles.barChartItem}>
                    <Text style={styles.barChartLabel}>{item.category}</Text>
                    <View style={styles.barChartBarContainer}>
                      <View
                        style={[
                          styles.barChartBar,
                          { width: `${Math.min(item.count / 10, 100)}%`, backgroundColor: '#ef4444' },
                        ]}
                      />
                    </View>
                    <Text style={styles.barChartValue}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {weakAreas.length > 0 && (
          <Card style={styles.detailedCard}>
            <View style={styles.detailedTitle}>
              <Icon name="locate" size={20} color="#6b7280" />
              <Text style={styles.detailedTitleText}>Дэлгэрэнгүй дүн шинжилгээ</Text>
            </View>
            <View style={styles.detailedList}>
              {weakAreas.map((area, index) => (
                <View key={index} style={styles.detailedItem}>
                  <View style={styles.detailedItemHeader}>
                    <View style={styles.detailedItemInfo}>
                      <Text style={styles.detailedItemCategory}>{area.category}</Text>
                      <View
                        style={[
                          styles.badge,
                          area.accuracy < 60
                            ? styles.badgeDanger
                            : area.accuracy < 75
                              ? styles.badgeWarning
                              : styles.badgeSuccess,
                        ]}
                      >
                        <Text style={styles.badgeText}>{area.accuracy}% амжилт</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.detailedItemPercentage,
                        area.accuracy < 60
                          ? styles.percentageDanger
                          : area.accuracy < 75
                            ? styles.percentageWarning
                            : styles.percentageSuccess,
                      ]}
                    >
                      {area.accuracy}%
                    </Text>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        area.accuracy < 60
                          ? styles.progressBarDanger
                          : area.accuracy < 75
                            ? styles.progressBarWarning
                            : styles.progressBarSuccess,
                        { width: `${area.accuracy}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.detailedItemDescription}>
                    {area.accuracy < 60
                      ? 'Энэ хэсэгт илүү их анхаарч, давтан дасгал хийхийг зөвлөж байна.'
                      : area.accuracy < 75
                        ? 'Сайн байна. Тогтмол дасгал хийснээр илүү сайн үр дүнд хүрнэ.'
                        : 'Маш сайн гүйцэтгэл. Энэ түвшинг хадгалж, бусад хэсэгтээ анхаараарай.'}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={styles.recommendationsContainer}>
          <Card style={[styles.recommendationCard, styles.primaryRecommendation]}>
            <View style={styles.recommendationContent}>
              <View style={styles.recommendationIcon}>
                <Icon name="book" size={24} color="#fff" />
              </View>
              <View style={styles.recommendationText}>
                <Text style={styles.recommendationTitle}>Санал болгох дасгал</Text>
                <Text style={styles.recommendationDescription}>
                  {weakAreas[0]?.category} хэсэгт {errorFrequency[0]?.count} алдаа гаргасан байна. Энэ
                  хэсгийг сайжруулахын тулд хичээл, давтлага руу шилжээрэй.
                </Text>
                <Button onPress={() => navigation.navigate('Lesson')} title="Хичээл үзэх" />
              </View>
            </View>
          </Card>

          <Card style={[styles.recommendationCard, styles.secondaryRecommendation]}>
            <View style={styles.recommendationContent}>
              <View style={[styles.recommendationIcon, styles.secondaryIcon]}>
                <Icon name="trophy" size={24} color="#fff" />
              </View>
              <View style={styles.recommendationText}>
                <Text style={styles.recommendationTitle}>Шинэ шалгалт өгөх</Text>
                <Text style={styles.recommendationDescription}>
                  {improvementRate >= 0
                    ? `Таны ахиц ${improvementRate}%-аар өссөн байна. Шинэ шалгалт өгч үр дүнгээ шалгаарай.`
                    : 'Шинэ шалгалт өгч, ахиц дэвшлээ хянаарай.'}
                </Text>
                <Button onPress={() => navigation.navigate('Exam')} title="Шалгалт өгөх" />
              </View>
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  contentContainer: { padding: 16 },
  paymentCard: { padding: 32, alignItems: 'center', maxWidth: 400 },
  paymentTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  paymentText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#6b7280' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  headerTextGroup: { flex: 1, minWidth: 180 },
  message: { marginBottom: 16 },
  loadingCard: { marginBottom: 16, backgroundColor: '#eff6ff' },
  loadingText: { color: '#1d4ed8', textAlign: 'center', fontSize: 13, fontWeight: '500' },
  filterContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  filterButtonActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 14, color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  subscriptionContainer: { marginBottom: 24 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: { width: '47%', padding: 16 },
  metricIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  metricUnit: { fontSize: 14, fontWeight: 'normal', color: '#6b7280' },
  positiveText: { color: '#16a34a' },
  negativeText: { color: '#dc2626' },
  chartCard: { padding: 16, marginBottom: 24, overflow: 'hidden' },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  chartTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  viewModeContainer: { flexDirection: 'row', gap: 8, flexShrink: 1 },
  viewModeButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f3f4f6', gap: 4 },
  viewModeActive: { backgroundColor: '#3b82f6' },
  viewModeText: { fontSize: 12, color: '#6b7280' },
  viewModeTextActive: { color: '#fff' },
  chart: { borderRadius: 16, width: '100%', overflow: 'hidden' },
  listContainer: { gap: 8 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listItemScore: { width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  scoreHigh: { backgroundColor: '#dcfce7' },
  scoreMedium: { backgroundColor: '#dbeafe' },
  scoreLow: { backgroundColor: '#fee2e2' },
  listItemScoreText: { fontSize: 16, fontWeight: 'bold' },
  listItemTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
  listItemDate: { fontSize: 12, color: '#6b7280' },
  listItemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listItemScoreDetail: { alignItems: 'flex-end' },
  listItemScoreLabel: { fontSize: 10, color: '#6b7280' },
  listItemScoreValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  analysisGrid: { flexDirection: 'column', gap: 16, marginBottom: 24 },
  analysisCard: { width: '100%', padding: 16 },
  analysisTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  analysisTitleText: { fontSize: 16, fontWeight: '600', color: '#111827', flexShrink: 1 },
  barChartContainer: { gap: 12 },
  barChartItem: { gap: 4 },
  barChartLabel: { fontSize: 12, color: '#6b7280' },
  barChartBarContainer: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barChartBar: { height: '100%', borderRadius: 4 },
  barChartValue: { fontSize: 12, fontWeight: '500', color: '#111827', textAlign: 'right' },
  detailedCard: { padding: 16, marginBottom: 24 },
  detailedTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  detailedTitleText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  detailedList: { gap: 16 },
  detailedItem: { padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
  detailedItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  detailedItemInfo: { flex: 1, gap: 8 },
  detailedItemCategory: { fontSize: 14, fontWeight: '500', color: '#111827' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeDanger: { backgroundColor: '#fee2e2' },
  badgeWarning: { backgroundColor: '#fef3c7' },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 10, fontWeight: '500' },
  detailedItemPercentage: { fontSize: 24, fontWeight: 'bold' },
  percentageDanger: { color: '#dc2626' },
  percentageWarning: { color: '#d97706' },
  percentageSuccess: { color: '#16a34a' },
  progressBarContainer: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: '100%', borderRadius: 4 },
  progressBarDanger: { backgroundColor: '#dc2626' },
  progressBarWarning: { backgroundColor: '#d97706' },
  progressBarSuccess: { backgroundColor: '#16a34a' },
  detailedItemDescription: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  recommendationsContainer: { flexDirection: 'column', gap: 16, marginBottom: 24 },
  recommendationCard: { width: '100%', padding: 16 },
  primaryRecommendation: { backgroundColor: '#eff6ff' },
  secondaryRecommendation: { backgroundColor: '#f0fdf4' },
  recommendationContent: { flexDirection: 'row', gap: 16 },
  recommendationIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  secondaryIcon: { backgroundColor: '#16a34a' },
  recommendationText: { flex: 1, gap: 8 },
  recommendationTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  recommendationDescription: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
});
