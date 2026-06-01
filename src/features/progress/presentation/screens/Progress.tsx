import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-gifted-charts';

import type { RootDrawerParamList } from '../../../../app/navigation/types';
import { InlineMessage } from '../../../../shared/components/feedback';
import Button from '../../../../shared/components/molecules/button';
import { IconButton } from '../../../../shared/components/molecules/IconButton';
import { ProtectedTouchable } from '../../../../shared/components/molecules/protectedTouchable';
import { SubscriptionStatus } from '../../../../shared/components/organisms/SubscriptionStatus';
import { useProgress } from '../providers/progressContext';
import { progressUseCases } from '../dependencies';
import { lessonCategorySlugMap, type LessonCategorySlug } from '../../../lessons';
import { getScorePercentage, getSectionAccuracy } from '../../domain/progressMetrics';
import type { ProgressRecommendation, ProgressSection } from '../../domain/types';

type ProgressNavigationProp = DrawerScreenProps<RootDrawerParamList, 'Progress'>['navigation'];
type TrendMode = 'chart' | 'list';
type TimePeriod = 'all' | 'week' | 'month';
type ProgressSource = 'level_test' | 'mock';
type TopikExamType = 'all' | 'TOPIK I' | 'TOPIK II';
type ChartMetric = 'total' | 'listening' | 'reading';
type RepeatedQuestionInsight = {
  key: string;
  sectionLabel: string;
  questionNumber: number;
  misses: number;
  attempts: number;
  latestResultId: string;
  correctAnswer: string;
};

const REPEATED_QUESTION_PREVIEW_LIMIT = 5;

const getDurationLabel = (durationInSeconds: number) => `${Math.round(durationInSeconds / 60)} мин`;

const getPeriodLabel = (period: TimePeriod) => {
  if (period === 'week') {
    return 'сүүлийн 7 хоног';
  }

  if (period === 'month') {
    return 'сүүлийн 30 хоног';
  }

  return 'бүх хугацаа';
};

const getChartAttemptLabel = (attemptIndex: number) => `${attemptIndex + 1}`;

const getChartMetricLabel = (metric: ChartMetric) => {
  if (metric === 'listening') {
    return 'Сонсгол';
  }

  if (metric === 'reading') {
    return 'Уншлага';
  }

  return 'Нийт';
};

const getChartMetricPercentage = (result: { totalScore: number; maxScore: number; sections: ProgressSection[] }, metric: ChartMetric) => {
  if (metric === 'total') {
    return getScorePercentage(result.totalScore, result.maxScore);
  }

  const sectionName = metric === 'listening' ? 'Сонсгол' : 'Уншлага';
  const section = result.sections.find((item) => item.name === sectionName);

  return section ? getSectionAccuracy(section) : 0;
};

const getResultSectionAccuracy = (
  result: { sections: ProgressSection[] },
  sectionName: string,
) => {
  const section = result.sections.find((item) => item.name === sectionName);

  return section ? getSectionAccuracy(section) : null;
};

const isLessonCategorySlug = (slug?: string | null): slug is LessonCategorySlug =>
  Boolean(slug && Object.prototype.hasOwnProperty.call(lessonCategorySlugMap, slug));

const getRecommendationActionLabel = (recommendation: ProgressRecommendation) => {
  if (recommendation.content?.contentUrl) {
    return 'Материал нээх';
  }

  if (recommendation.content?.category) {
    return 'Хичээлийн хэсэг рүү';
  }

  return 'Хичээл харах';
};

const getRecommendationTypeLabel = (contentType?: string | null) => {
  switch (contentType) {
    case 'book':
      return 'Ном';
    case 'pdf':
      return 'PDF';
    case 'quiz':
      return 'Дасгал';
    case 'article':
      return 'Тайлбар';
    default:
      return 'Материал';
  }
};

export function Progress() {
  const navigation = useNavigation<ProgressNavigationProp>();
  const {
    examResults,
    levelTestResults,
    recommendations,
    isLoading,
    error,
    reloadData,
  } = useProgress();

  const [viewMode, setViewMode] = useState<TrendMode>('chart');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [progressSource, setProgressSource] = useState<ProgressSource>('level_test');
  const [topikExamType, setTopikExamType] = useState<TopikExamType>('all');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('total');
  const [chartExamTitle, setChartExamTitle] = useState<string | null>(null);
  const [repeatedQuestionInsights, setRepeatedQuestionInsights] = useState<RepeatedQuestionInsight[]>([]);
  const [isLoadingRepeatedQuestions, setIsLoadingRepeatedQuestions] = useState(false);
  const [showAllRepeatedQuestions, setShowAllRepeatedQuestions] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  const progressEntryIcon = 'home-outline';

  const handleBackPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      reloadData().catch(() => undefined);
    }, [reloadData]),
  );

  const activeResults = progressSource === 'level_test' ? levelTestResults : examResults;
  const examTypeResults =
    topikExamType === 'all'
      ? activeResults
      : activeResults.filter((result) => result.examType === topikExamType);
  const totalAvailableResults = examResults.length + levelTestResults.length;

  const filteredResults = examTypeResults.filter((result) => {
    if (timePeriod === 'all') {
      return true;
    }

    const now = new Date();
    const cutoff = new Date();

    if (timePeriod === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setMonth(now.getMonth() - 1);
    }

    return new Date(result.date) >= cutoff;
  });

  const hasFilteredResults = filteredResults.length > 0;
  const latestResult = filteredResults[0] ?? null;
  const trendResults = filteredResults;

  const getImprovementRate = () => {
    if (filteredResults.length < 2) {
      return 0;
    }

    const recent = filteredResults.slice(0, Math.min(3, filteredResults.length));
    const older = filteredResults.slice(Math.max(0, filteredResults.length - 3));

    const recentAvg =
      recent.reduce((sum, result) => sum + getScorePercentage(result.totalScore, result.maxScore), 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, result) => sum + getScorePercentage(result.totalScore, result.maxScore), 0) /
      older.length;

    return Math.round(recentAvg - olderAvg);
  };

  const improvementRate = getImprovementRate();

  const latestResultPercentage = latestResult
    ? getScorePercentage(latestResult.totalScore, latestResult.maxScore)
    : 0;
  const latestSections = latestResult
    ? latestResult.sections.map((section) => ({
        ...section,
        accuracy: getSectionAccuracy(section),
      }))
    : [];

  const periodLabel = getPeriodLabel(timePeriod);
  const selectedResultsLabel = `${topikExamType === 'all' ? 'TOPIK бүгд' : topikExamType} · ${periodLabel}`;
  const resultMatchedRecommendations = latestResult
    ? recommendations.filter(
        (recommendation) => recommendation.content && recommendation.resultId === latestResult.id,
      )
    : [];
  const genericRecommendations = recommendations.filter(
    (recommendation) => recommendation.content && !recommendation.resultId,
  );
  const fallbackRecommendations = recommendations.filter(
    (recommendation) =>
      recommendation.content &&
      recommendation.resultId !== latestResult?.id &&
      recommendation.resultId !== null &&
      recommendation.resultId !== undefined,
  );
  const visibleRecommendations = [
    ...resultMatchedRecommendations,
    ...genericRecommendations,
    ...fallbackRecommendations,
  ].slice(0, 2);

  const chartExamGroups = useMemo(() => {
    const groups = new Map<string, typeof trendResults>();

    trendResults.forEach((result) => {
      const group = groups.get(result.examTitle) ?? [];
      group.push(result);
      groups.set(result.examTitle, group);
    });

    return Array.from(groups.entries())
      .map(([title, results]) => ({
        title,
        results: results.slice().sort((left, right) => left.date.getTime() - right.date.getTime()),
        latestDate: Math.max(...results.map((result) => result.date.getTime())),
      }))
      .sort((left, right) => right.latestDate - left.latestDate);
  }, [trendResults]);

  useEffect(() => {
    if (chartExamGroups.length === 0) {
      if (chartExamTitle !== null) {
        setChartExamTitle(null);
      }
      return;
    }

    if (!chartExamGroups.some((group) => group.title === chartExamTitle)) {
      setChartExamTitle(chartExamGroups[0].title);
    }
  }, [chartExamGroups, chartExamTitle]);

  const selectedChartGroup =
    chartExamGroups.find((group) => group.title === chartExamTitle) ?? chartExamGroups[0] ?? null;
  const chartData =
    selectedChartGroup?.results.map((result, index) => ({
      value: getChartMetricPercentage(result, chartMetric),
      label: getChartAttemptLabel(index),
    })) ?? [];
  const selectedChartResultIds = selectedChartGroup?.results.map((result) => result.id).join('|') ?? '';
  const selectedChartAttemptCount = selectedChartGroup?.results.length ?? 0;
  const visibleRepeatedQuestionInsights = showAllRepeatedQuestions
    ? repeatedQuestionInsights
    : repeatedQuestionInsights.slice(0, REPEATED_QUESTION_PREVIEW_LIMIT);
  const hiddenRepeatedQuestionCount = Math.max(
    0,
    repeatedQuestionInsights.length - visibleRepeatedQuestionInsights.length,
  );

  useEffect(() => {
    setShowAllRepeatedQuestions(false);
  }, [selectedChartResultIds]);

  useEffect(() => {
    const resultIds = selectedChartResultIds ? selectedChartResultIds.split('|') : [];

    if (resultIds.length < 2) {
      setRepeatedQuestionInsights([]);
      setIsLoadingRepeatedQuestions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingRepeatedQuestions(true);

    const loadRepeatedQuestions = async () => {
      try {
        const responses = await Promise.all(
          resultIds.map((resultId) => progressUseCases.getResultDetail(resultId)),
        );
        const stats = new Map<string, RepeatedQuestionInsight>();

        responses.forEach((response) => {
          if (!response.success || !response.detail) {
            return;
          }

          const detail = response.detail;

          detail.reviewQuestions.forEach((question) => {
            if (question.isCorrect) {
              return;
            }

            const key = `${question.section}:${question.questionNumber}`;
            const existing = stats.get(key);

            stats.set(key, {
              key,
              sectionLabel: question.sectionLabel,
              questionNumber: question.questionNumber,
              misses: (existing?.misses ?? 0) + 1,
              attempts: selectedChartAttemptCount,
              latestResultId: detail.result.id,
              correctAnswer: question.correctAnswer,
            });
          });
        });

        if (!cancelled) {
          setRepeatedQuestionInsights(
            Array.from(stats.values())
              .filter((item) => item.misses > 1)
              .sort((left, right) => right.misses - left.misses || left.questionNumber - right.questionNumber),
          );
        }
      } catch {
        if (!cancelled) {
          setRepeatedQuestionInsights([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRepeatedQuestions(false);
        }
      }
    };

    loadRepeatedQuestions().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [selectedChartAttemptCount, selectedChartResultIds]);

      // const latestSummary = latestWeakSection
      //   ? `${latestWeakSection.name} хэсэг одоогоор хамгийн сул байна. Эхлээд энэ хэсгийн тайлбараа үзээрэй.`
      //   : 'Сүүлийн шалгалтынхаа ерөнхий дүн болон хэсэг тус бүрийн гүйцэтгэлийг эндээс харна.';


  const handleOpenRecommendation = async (recommendation: ProgressRecommendation) => {
    const content = recommendation.content;

    if (!content) {
      navigation.navigate('Lesson');
      return;
    }

    const contentUrl = content.contentUrl?.trim();

    if (contentUrl) {
      try {
        const supported = await Linking.canOpenURL(contentUrl);

        if (supported) {
          await Linking.openURL(contentUrl);
          return;
        }
      } catch {
        // Fall back to lesson navigation when the device cannot open the resource URL.
      }
    }

    const categorySlug = content.category?.slug;

    if (isLessonCategorySlug(categorySlug)) {
      navigation.navigate(lessonCategorySlugMap[categorySlug].route);
      return;
    }

    navigation.navigate('Lesson');
  };

  if (isLoading && totalAvailableResults === 0 && !error) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <IconButton name={progressEntryIcon} onPress={handleBackPress} style={styles.backBtn} />
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.heroIconBox}>
              <Icon name="trending-up-outline" size={20} color="#60A5FA" />
            </View>
            <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
          </View>
        </View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <ActivityIndicator size="large" color="#155DFC" />
          </View>
          <Text style={styles.emptyTitle}>Мэдээлэл ачааллаж байна...</Text>
          <Text style={styles.emptyDesc}>Таны шалгалтын үр дүнг бэлдэж байна.</Text>
        </View>
      </ScrollView>
    );
  }

  if (totalAvailableResults === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <IconButton name={progressEntryIcon} onPress={handleBackPress} style={styles.backBtn} />
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.heroIconBox}>
              <Icon name="trending-up-outline" size={20} color="#60A5FA" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
              <Text style={styles.heroDesc}>Өгсөн шалгалтын үр дүн энд харагдана.</Text>
            </View>
          </View>
        </View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Icon name="bar-chart-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Шалгалтын өгөгдөл алга</Text>
          <Text style={styles.emptyDesc}>Эхний mock test-ээ өгөөд үр дүн, сул хэсгээ эндээс хараарай.</Text>
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
          refreshing={isLoading && totalAvailableResults > 0}
          onRefresh={() => {
            reloadData(true).catch(() => undefined);
          }}
          tintColor="#155DFC"
        />
      }
    >
      <IconButton name={progressEntryIcon} onPress={handleBackPress} style={styles.backBtn} />

      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.heroIconBox}>
            <Icon name="trending-up-outline" size={20} color="#60A5FA" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
            <Text style={styles.heroDesc}>Дүн, өөрчлөлт, сул хэсэг, дараагийн алхам</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterCard}>
        <View style={styles.filterCardRow}>
          <View style={styles.filterCardLabelWrap}>
            <Icon name="layers-outline" size={13} color="#94A3B8" />
            <Text style={styles.filterCardLabel}>Төрөл</Text>
          </View>
          <View style={styles.filterSegment}>
            {([
              ['level_test', 'Түвшин тогтоох'],
              ['mock', 'Mock test'],
            ] as const).map(([key, label], index, arr) => {
              const active = progressSource === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterSegmentBtn,
                    index === 0 && styles.filterSegmentBtnFirst,
                    index === arr.length - 1 && styles.filterSegmentBtnLast,
                    active && styles.filterSegmentBtnActive,
                  ]}
                  onPress={() => setProgressSource(key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterSegmentText, active && styles.filterSegmentTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterCardDivider} />

        <View style={styles.filterCardRow}>
          <View style={styles.filterCardLabelWrap}>
            <Icon name="calendar-outline" size={13} color="#94A3B8" />
            <Text style={styles.filterCardLabel}>Хугацаа</Text>
          </View>
          <View style={styles.filterSegment}>
            {([
              ['all', 'Бүгд'],
              ['month', 'Сар'],
              ['week', '7 хоног'],
            ] as const).map(([key, label], index, arr) => {
              const active = timePeriod === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterSegmentBtn,
                    index === 0 && styles.filterSegmentBtnFirst,
                    index === arr.length - 1 && styles.filterSegmentBtnLast,
                    active && styles.filterSegmentBtnActive,
                  ]}
                  onPress={() => setTimePeriod(key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterSegmentText, active && styles.filterSegmentTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterCardDivider} />

        <View style={styles.filterCardRow}>
          <View style={styles.filterCardLabelWrap}>
            <Icon name="school-outline" size={13} color="#94A3B8" />
            <Text style={styles.filterCardLabel}>TOPIK</Text>
          </View>
          <View style={styles.filterSegment}>
            {([
              ['all', 'Бүгд'],
              ['TOPIK I', 'TOPIK I'],
              ['TOPIK II', 'TOPIK II'],
            ] as const).map(([key, label], index, arr) => {
              const active = topikExamType === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterSegmentBtn,
                    index === 0 && styles.filterSegmentBtnFirst,
                    index === arr.length - 1 && styles.filterSegmentBtnLast,
                    active && styles.filterSegmentBtnActive,
                  ]}
                  onPress={() => setTopikExamType(key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterSegmentText, active && styles.filterSegmentTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <InlineMessage message={error} containerStyle={styles.message} />

      {isLoading && totalAvailableResults > 0 ? (
        <View style={styles.refreshBanner}>
          <Icon name="sync-outline" size={14} color="#155DFC" />
          <Text style={styles.refreshText}>Шинэчилж байна...</Text>
        </View>
      ) : null}

      {!hasFilteredResults ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Icon name="calendar-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Энэ хугацаанд шалгалт алга</Text>
          <Text style={styles.emptyDesc}>
            {`${topikExamType === 'all' ? '' : `${topikExamType} - `}${periodLabel} өгсөн шалгалт олдсонгүй. Шүүлтээ өөрчлөх эсвэл шинэ mock test өгч үр дүнгээ нэмээрэй.`}
          </Text>
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={() => {
              setTimePeriod('all');
              setTopikExamType('all');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.resetFilterText}>Бүх шалгалтыг харах</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderTight}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Сүүлийн шалгалтын дүн</Text>
              </View>
              <Text style={styles.blockMeta} numberOfLines={1}>
                {latestResult ? new Date(latestResult.date).toLocaleDateString('mn-MN') : ''}
              </Text>
            </View>

            {latestResult ? (
              <>
                <View style={styles.latestTop}>
                  <View style={styles.latestScorePanel}>
                    <Text style={styles.latestScoreValue}>{latestResultPercentage}%</Text>
                    <Text style={styles.latestScoreMeta}>
                      {latestResult.totalScore}/{latestResult.maxScore}
                    </Text>
                  </View>

                  <View style={styles.latestBody}>
                    <Text style={styles.latestExamTitle}>{latestResult.examTitle}</Text>

                    <View style={styles.infoPillRow}>
                      <View style={styles.infoPill}>
                        <Icon name="document-text-outline" size={14} color="#155DFC" />
                        <Text style={styles.infoPillText}>{latestResult.examType}</Text>
                      </View>
                      <View style={styles.infoPill}>
                        <Icon name="time-outline" size={14} color="#155DFC" />
                        <Text style={styles.infoPillText}>{getDurationLabel(latestResult.duration)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionMiniGrid}>
                  {latestSections.map((section) => (
                    <View key={section.name} style={styles.sectionMiniCard}>
                      <View style={styles.sectionMiniHeader}>
                        <Text style={styles.sectionMiniLabel}>{section.name}</Text>
                        <Text style={styles.sectionMiniValue}>{section.accuracy}%</Text>
                      </View>
                      <View style={styles.sectionMiniTrack}>
                        <View style={[styles.sectionMiniFill, { width: `${section.accuracy}%` }]} />
                      </View>
                      <Text style={styles.sectionMiniMeta}>
                        {section.correctAnswers}/{section.totalQuestions} зөв
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.primaryCta}
                  onPress={() => navigation.navigate('ExamReview', { resultId: latestResult.id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryCtaText}>Сүүлийн шалгалтын үр дүн харах</Text>
                  <Icon name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderTight}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Шалгалт бүрийн гүйцэтгэл</Text>
              </View>
              <Text style={styles.blockMeta} numberOfLines={1}>{selectedResultsLabel}</Text>
            </View>

            <View style={styles.subsectionHeader}>
              <Text style={styles.subsectionTitle}>
                {topikExamType === 'all' ? 'Сонгосон шалгалтууд' : `${topikExamType} гүйцэтгэл`}
              </Text>
              <View style={styles.toggleRow}>
                {(['chart', 'list'] as const).map((mode) => {
                  const active = viewMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                      onPress={() => setViewMode(mode)}
                      activeOpacity={0.75}
                    >
                      <Icon
                        name={mode === 'chart' ? 'bar-chart-outline' : 'list-outline'}
                        size={14}
                        color={active ? '#fff' : '#64748B'}
                      />
                      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                        {mode === 'chart' ? 'Тренд' : 'Жагсаалт'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {viewMode === 'chart' ? (
              <>
                {chartExamGroups.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartExamRow}
                  >
                    {chartExamGroups.map((group) => {
                      const active = selectedChartGroup?.title === group.title;

                      return (
                        <TouchableOpacity
                          key={group.title}
                          style={[styles.chartExamBtn, active && styles.chartExamBtnActive]}
                          onPress={() => setChartExamTitle(group.title)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[styles.chartExamText, active && styles.chartExamTextActive]}
                            numberOfLines={1}
                          >
                            {group.title}
                          </Text>
                          <Text style={[styles.chartExamMeta, active && styles.chartExamMetaActive]}>
                            {group.results.length} удаа
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : null}

                <View style={styles.metricRow}>
                  {(['total', 'listening', 'reading'] as const).map((metric) => {
                    const active = chartMetric === metric;
                    return (
                      <TouchableOpacity
                        key={metric}
                        style={[styles.metricBtn, active && styles.metricBtnActive]}
                        onPress={() => setChartMetric(metric)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.metricText, active && styles.metricTextActive]}>
                          {getChartMetricLabel(metric)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.chartMetricCaption}>
                  {selectedChartGroup
                    ? `${selectedChartGroup.title} · ${getChartMetricLabel(chartMetric)} гүйцэтгэл · оролдлогоор (%)`
                    : `${getChartMetricLabel(chartMetric)} гүйцэтгэл (%)`}
                </Text>

                {chartData.length > 0 ? (
                  <View
                    style={styles.chartWrap}
                    onLayout={(event) => {
                      const nextWidth = Math.floor(event.nativeEvent.layout.width);
                      if (nextWidth !== chartWidth) {
                        setChartWidth(nextWidth);
                      }
                    }}
                  >
                    <LineChart
                      data={chartData}
                      width={Math.max(chartWidth - 16, 240)}
                      height={220}
                      color="#155DFC"
                      dataPointsColor="#155DFC"
                      maxValue={100}
                      noOfSections={5}
                      textColor="#64748B"
                      thickness={3}
                      hideRules={false}
                      showVerticalLines={false}
                    />
                  </View>
                ) : (
                  <View style={styles.innerEmpty}>
                    <Text style={styles.innerEmptyText}>Энэ хугацаанд харуулах trend алга.</Text>
                  </View>
                )}

              </>
            ) : (
              <View style={styles.listGap}>
                {filteredResults.map((result) => {
                  const pct = getScorePercentage(result.totalScore, result.maxScore);
                  const scoreColor = pct >= 80 ? '#059669' : pct >= 60 ? '#155DFC' : '#EF4444';
                  const scoreBg = pct >= 80 ? '#ECFDF5' : pct >= 60 ? '#EFF6FF' : '#FEF2F2';
                  const sectionSummaries = ([
                    ['Сонсгол', getResultSectionAccuracy(result, 'Сонсгол')],
                    ['Уншлага', getResultSectionAccuracy(result, 'Уншлага')],
                  ] as const).filter(([, accuracy]) => accuracy !== null);

                  return (
                    <TouchableOpacity
                      key={result.id}
                      style={styles.listItem}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('ExamReview', { resultId: result.id })}
                    >
                      <View style={[styles.scoreBadge, { backgroundColor: scoreBg }]}>
                        <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{pct}</Text>
                        <Text style={[styles.scoreBadgeUnit, { color: scoreColor }]}>%</Text>
                      </View>
                      <View style={styles.listItemBody}>
                        <Text style={styles.listItemTitle} numberOfLines={1}>
                          {result.examTitle}
                        </Text>
                        <Text style={styles.listItemDate}>
                          {result.examType} · {new Date(result.date).toLocaleDateString('mn-MN')}
                        </Text>
                        {sectionSummaries.length > 0 ? (
                          <View style={styles.listSectionRow}>
                            {sectionSummaries.map(([label, accuracy]) => (
                              <View key={label} style={styles.listSectionPill}>
                                <Text style={styles.listSectionText}>
                                  {label} {accuracy}%
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.listItemRight}>
                        <Text style={styles.listItemScore}>
                          {result.totalScore}/{result.maxScore}
                        </Text>
                        <Icon name="chevron-forward" size={16} color="#CBD5E1" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderTight}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Олон удаа алдсан асуултууд</Text>
              </View>
              <Text style={styles.blockMeta} numberOfLines={1}>
                {selectedChartGroup ? selectedChartGroup.title : selectedResultsLabel}
              </Text>
            </View>

            <View style={[styles.repeatedCard, styles.repeatedCardFlush]}>
              <View style={styles.repeatedHeader}>
                <View>
                  <Text style={styles.repeatedTitle}>
                    {selectedChartGroup
                      ? `${selectedChartGroup.title} шалгалтын оролдлогууд`
                      : 'Сонгосон шалгалтын оролдлогууд'}
                  </Text>
                  <Text style={styles.repeatedSubtitle}>Ижил асуулт дээр давтан алдсан давтамж</Text>
                </View>
                {isLoadingRepeatedQuestions ? (
                  <ActivityIndicator size="small" color="#155DFC" />
                ) : (
                  <Icon name="repeat-outline" size={18} color="#155DFC" />
                )}
              </View>

              {selectedChartAttemptCount < 2 ? (
                <Text style={styles.repeatedEmptyText}>
                  Давтан алдааг харахын тулд энэ шалгалтыг дор хаяж 2 удаа өгсөн байх хэрэгтэй.
                </Text>
              ) : repeatedQuestionInsights.length > 0 ? (
                <View style={styles.repeatedList}>
                  {visibleRepeatedQuestionInsights.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.repeatedItem}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('ExamReview', { resultId: item.latestResultId })}
                    >
                      <View style={styles.repeatedQuestionBadge}>
                        <Text style={styles.repeatedQuestionBadgeText}>Q{item.questionNumber}</Text>
                      </View>
                      <View style={styles.repeatedItemBody}>
                        <Text style={styles.repeatedItemTitle}>
                          {item.sectionLabel} · {item.questionNumber}-р асуулт
                        </Text>
                        <Text style={styles.repeatedItemMeta}>
                          {item.misses} удаа алдсан · {item.attempts} оролдлогоос
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  ))}
                  {repeatedQuestionInsights.length > REPEATED_QUESTION_PREVIEW_LIMIT ? (
                    <TouchableOpacity
                      style={styles.repeatedToggle}
                      activeOpacity={0.85}
                      onPress={() => setShowAllRepeatedQuestions((current) => !current)}
                    >
                      <Text style={styles.repeatedToggleText}>
                        {showAllRepeatedQuestions
                          ? 'Хураах'
                          : `Бүгдийг харах (${hiddenRepeatedQuestionCount} нэмэлт)`}
                      </Text>
                      <Icon
                        name={showAllRepeatedQuestions ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#155DFC"
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.repeatedEmptyText}>
                  Энэ шалгалтын оролдлогууд дээр 2 ба түүнээс олон давтагдсан алдаа одоогоор алга.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.subWrap}>
            <SubscriptionStatus />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderTight}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Дараагийн алхам</Text>
              </View>
            </View>


            <View style={styles.actionList}>
              {visibleRecommendations.map((recommendation) => {
                const content = recommendation.content;

                if (!content) {
                  return null;
                }

                const metaItems = [
                  getRecommendationTypeLabel(content.contentType),
                  content.category?.title,
                  content.level,
                  content.isPremium ? 'Premium' : 'Free',
                ].filter(Boolean);

                return (
                  <View key={recommendation.id} style={styles.actionCard}>
                    <View style={styles.actionTop}>
                      <View style={[styles.actionIconBox, styles.actionIconBoxRecommendation]}>
                        <Icon name="book-outline" size={18} color="#B45309" />
                      </View>
                      <View style={styles.actionBody}>
                        <Text style={styles.recommendationEyebrow}>Танд санал болгох материал</Text>
                        <Text style={styles.actionTitle}>{content.title}</Text>
                        {metaItems.length > 0 ? (
                          <Text style={styles.recommendationMeta}>{metaItems.join(' • ')}</Text>
                        ) : null}
                        <Text style={styles.actionDesc}>
                          {recommendation.reason?.trim() || content.description || 'Энэ материалыг шалгалтын тайлбартайгаа хамт үзвэл илүү үр дүнтэй.'}
                        </Text>
                      </View>
                    </View>
                    <ProtectedTouchable
                      style={[styles.actionButtonPrimary, styles.recommendationButton]}
                      requiredStatus={content.isPremium ? 'paid' : 'registered'}
                      onPress={() => {
                        handleOpenRecommendation(recommendation).catch(() => undefined);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.actionButtonContent}>
                        <Text style={styles.actionButtonPrimaryText}>
                          {getRecommendationActionLabel(recommendation)}
                        </Text>
                        <Icon name="arrow-forward" size={14} color="#fff" />
                      </View>
                    </ProtectedTouchable>
                  </View>
                );
              })}

              {latestResult ? (
                <View style={styles.actionCard}>
                  <View style={styles.actionTop}>
                    <View style={styles.actionIconBox}>
                      <Icon name="help-buoy-outline" size={18} color="#155DFC" />
                    </View>
                    <View style={styles.actionBody}>
                      <Text style={styles.actionTitle}>Сүүлийн шалгалтын үр дүн харах</Text>
                      <Text style={styles.actionDesc}>
                        Алдсан асуултын тайлбаруудыг уншаад, яагаад зөв байсныг нэг бүрчлэн ойлгоорой.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.actionButtonPrimary}
                    onPress={() => navigation.navigate('ExamReview', { resultId: latestResult.id })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionButtonPrimaryText}>Үр дүн харах</Text>
                    <Icon name="arrow-forward" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.actionCard}>
                <View style={styles.actionTop}>
                  <View style={[styles.actionIconBox, styles.actionIconBoxSuccess]}>
                    <Icon name="flag-outline" size={18} color="#059669" />
                  </View>
                  <View style={styles.actionBody}>
                    <Text style={styles.actionTitle}>Дараагийн mock test өгөх</Text>
                    <Text style={styles.actionDesc}>
                      {improvementRate >= 0
                        ? 'Одоогийн урсгалаа үргэлжлүүлээд шинэ шалгалтаар ахицаа баталгаажуулаарай.'
                        : 'Шалгалтын тайлбараа үзээд дахин шалгалт өгөх нь алдаагаа тогтворжуулахад хамгийн тохиромжтой.'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={() => navigation.navigate('Exam')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionButtonSecondaryText}>Шалгалт өгөх</Text>
                  <Icon name="arrow-forward" size={14} color="#059669" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

  backBtn: {
    marginBottom: 16,
  },

  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.2 },
  heroDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },

  filterRow: { flexDirection: 'row', gap: 8 },
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

  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filterCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  filterCardLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 68,
  },
  filterCardLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterCardDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 14 },
  filterSegment: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  filterSegmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterSegmentBtnFirst: {},
  filterSegmentBtnLast: {},
  filterSegmentBtnActive: {
    backgroundColor: '#155DFC',
    shadowColor: '#155DFC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterSegmentText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterSegmentTextActive: { color: '#fff', fontWeight: '700' },

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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  sectionHeaderTight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  blockMeta: { fontSize: 12, color: '#64748B', fontWeight: '600', flexShrink: 1, textAlign: 'right' },

  latestTop: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  latestScorePanel: {
    width: 108,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  latestScoreValue: { fontSize: 28, fontWeight: '900', color: '#155DFC' },
  latestScoreMeta: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#334155' },
  latestBody: { flex: 1, gap: 10 },
  latestExamTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', lineHeight: 24 },
  infoPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoPillText: { fontSize: 12, color: '#334155', fontWeight: '700' },
  latestSummary: { fontSize: 13, lineHeight: 20, color: '#64748B' },
  sectionMiniGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  sectionMiniCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionMiniHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionMiniLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  sectionMiniValue: { fontSize: 12, fontWeight: '800', color: '#155DFC' },
  sectionMiniTrack: { height: 7, borderRadius: 999, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  sectionMiniFill: { height: '100%', borderRadius: 999, backgroundColor: '#155DFC' },
  sectionMiniMeta: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#155DFC',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryCtaText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  changeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  changeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBody: { flex: 1, gap: 4 },
  changeValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  changeLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  changeDescription: { fontSize: 12, lineHeight: 18, color: '#64748B' },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  statValue: { fontSize: 18, color: '#0F172A', fontWeight: '800' },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 14,
  },
  insightBody: { flex: 1, gap: 4 },
  insightTitle: { fontSize: 11, fontWeight: '800', color: '#155DFC', textTransform: 'uppercase' },
  insightText: { fontSize: 12, lineHeight: 18, color: '#334155', fontWeight: '600' },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  subsectionTitle: { fontSize: 13, color: '#334155', fontWeight: '700' },

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
  chartExamRow: { gap: 8, paddingBottom: 10 },
  chartExamBtn: {
    maxWidth: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
  },
  chartExamBtnActive: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  chartExamText: { fontSize: 12, color: '#334155', fontWeight: '800' },
  chartExamTextActive: { color: '#155DFC' },
  chartExamMeta: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  chartExamMetaActive: { color: '#2563EB' },
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metricBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
  },
  metricBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
  metricText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  metricTextActive: { color: '#155DFC' },
  chartMetricCaption: { marginBottom: 8, fontSize: 11, color: '#64748B', fontWeight: '600' },
  chartWrap: { borderRadius: 12, overflow: 'hidden', width: '100%' },
  innerEmpty: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
  },
  innerEmptyText: { fontSize: 13, color: '#64748B' },
  repeatedCard: {
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  repeatedCardFlush: { marginTop: 0 },
  repeatedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  repeatedTitle: { fontSize: 13, color: '#0F172A', fontWeight: '800' },
  repeatedSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  repeatedList: { gap: 8 },
  repeatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  repeatedQuestionBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  repeatedQuestionBadgeText: { fontSize: 12, color: '#EF4444', fontWeight: '900' },
  repeatedItemBody: { flex: 1 },
  repeatedItemTitle: { fontSize: 12, color: '#0F172A', fontWeight: '800', marginBottom: 3 },
  repeatedItemMeta: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  repeatedCountPill: {
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  repeatedCountText: { fontSize: 11, color: '#EF4444', fontWeight: '900' },
  repeatedToggle: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  repeatedToggleText: { fontSize: 12, color: '#155DFC', fontWeight: '900' },
  repeatedEmptyText: { fontSize: 12, lineHeight: 18, color: '#64748B', fontWeight: '600' },

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
  listSectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  listSectionPill: {
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  listSectionText: { fontSize: 11, color: '#155DFC', fontWeight: '700' },
  listItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listItemScore: { fontSize: 12, fontWeight: '700', color: '#374151' },

  focusCard: {
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  focusEyebrow: { fontSize: 11, color: '#155DFC', fontWeight: '800', textTransform: 'uppercase' },
  focusTitle: { fontSize: 22, color: '#0F172A', fontWeight: '900', letterSpacing: -0.4 },
  focusDesc: { fontSize: 12, lineHeight: 18, color: '#475569' },
  barsGap: { gap: 12 },
  weakRow: { gap: 6 },
  weakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  weakLabel: { fontSize: 12, color: '#374151', fontWeight: '700' },
  weakValue: { fontSize: 12, color: '#155DFC', fontWeight: '800' },
  weakMeta: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  weakTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' },
  weakFill: { height: '100%', borderRadius: 999, backgroundColor: '#155DFC' },

  nextStepCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  nextStepCalloutText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#475569', fontWeight: '600' },
  actionList: { gap: 12 },
  actionCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  actionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBoxSuccess: { backgroundColor: '#ECFDF5' },
  actionIconBoxRecommendation: { backgroundColor: '#FEF3C7' },
  actionBody: { flex: 1, gap: 4 },
  recommendationEyebrow: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recommendationMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  actionDesc: { fontSize: 12, lineHeight: 18, color: '#64748B' },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#155DFC',
    paddingVertical: 11,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonPrimaryText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  recommendationButton: { backgroundColor: '#0F172A' },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    paddingVertical: 11,
  },
  actionButtonSecondaryText: { fontSize: 12, fontWeight: '800', color: '#059669' },

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
  resetFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#155DFC',
  },
  resetFilterText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
