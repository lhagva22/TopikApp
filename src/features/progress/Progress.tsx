import React, { useState } from 'react';
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

import type { RootDrawerParamList } from '../../app/navigation/types';
import { InlineMessage } from '../../shared/components/feedback';
import Button from '../../shared/components/molecules/button';
import { ProtectedTouchable } from '../../shared/components/molecules/protectedTouchable';
import { SubscriptionStatus } from '../../shared/components/organisms/SubscriptionStatus';
import { useProgress } from './index';
import { lessonCategorySlugMap, type LessonCategorySlug } from '../lessons/lessonCategories';
import type { ProgressRecommendation, ProgressSection } from './model/types';

type ProgressNavigationProp = DrawerScreenProps<RootDrawerParamList, 'Progress'>['navigation'];
type TrendMode = 'chart' | 'list';
type TimePeriod = 'all' | 'week' | 'month';

const getScorePercentage = (score: number, maxScore: number) =>
  Math.round((score / Math.max(maxScore, 1)) * 100);

const getSectionAccuracy = (section: ProgressSection) =>
  section.totalQuestions > 0 ? Math.round((section.correctAnswers / section.totalQuestions) * 100) : 0;

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

const getChartLabel = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

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
  const { examResults, recommendations, isLoading, error, reloadData } = useProgress();

  const [viewMode, setViewMode] = useState<TrendMode>('chart');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [chartWidth, setChartWidth] = useState(0);

  const canGoBack = navigation.canGoBack();
  const progressEntryIcon = canGoBack ? 'arrow-back' : 'home-outline';

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Home');
  };

  useFocusEffect(
    React.useCallback(() => {
      reloadData().catch(() => undefined);
    }, [reloadData]),
  );

  const totalExams = examResults.length;

  const filteredResults = examResults.filter((result) => {
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
  const previousResult = filteredResults[1] ?? null;
  const trendResults = filteredResults.slice(0, 6);
  const recentResults = filteredResults.slice(0, 5);
  const totalStudyTime = filteredResults.reduce((sum, result) => sum + result.duration, 0);
  const avgStudyTime = hasFilteredResults ? Math.round(totalStudyTime / filteredResults.length / 60) : 0;
  const periodAverageScore = hasFilteredResults
    ? Math.round(
        filteredResults.reduce((sum, result) => sum + getScorePercentage(result.totalScore, result.maxScore), 0) /
          filteredResults.length,
      )
    : 0;

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

  const weakAreas = Object.entries(
    filteredResults.reduce<Record<string, { correct: number; total: number }>>((acc, result) => {
      result.sections.forEach((section) => {
        if (!acc[section.name]) {
          acc[section.name] = { correct: 0, total: 0 };
        }

        acc[section.name].correct += section.correctAnswers;
        acc[section.name].total += section.totalQuestions;
      });

      return acc;
    }, {}),
  )
    .map(([category, stats]) => ({
      category,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))
    .sort((left, right) => left.accuracy - right.accuracy);

  const errorFrequency = Object.entries(
    filteredResults.reduce<Record<string, number>>((acc, result) => {
      result.sections.forEach((section) => {
        const errors = section.totalQuestions - section.correctAnswers;
        acc[section.name] = (acc[section.name] || 0) + errors;
      });
      return acc;
    }, {}),
  )
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count);

  const latestResultPercentage = latestResult
    ? getScorePercentage(latestResult.totalScore, latestResult.maxScore)
    : 0;
  const previousResultPercentage = previousResult
    ? getScorePercentage(previousResult.totalScore, previousResult.maxScore)
    : null;
  const latestChange = previousResultPercentage === null ? null : latestResultPercentage - previousResultPercentage;

  const latestSections = latestResult
    ? latestResult.sections.map((section) => ({
        ...section,
        accuracy: getSectionAccuracy(section),
      }))
    : [];

  const latestWeakSection = latestSections.slice().sort((left, right) => left.accuracy - right.accuracy)[0] || null;

  const focusArea = latestWeakSection?.name || weakAreas[0]?.category || null;
  const focusAccuracy = latestWeakSection?.accuracy ?? weakAreas[0]?.accuracy ?? null;
  const periodLabel = getPeriodLabel(timePeriod);
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
  const primaryRecommendation = visibleRecommendations[0] ?? null;

  const changeColor =
    latestChange === null ? '#155DFC' : latestChange > 0 ? '#059669' : latestChange < 0 ? '#EF4444' : '#155DFC';
  const changeSurface =
    latestChange === null ? '#EFF6FF' : latestChange > 0 ? '#ECFDF5' : latestChange < 0 ? '#FEF2F2' : '#EFF6FF';
  const changeIcon =
    latestChange === null ? 'analytics-outline' : latestChange > 0 ? 'trending-up-outline' : latestChange < 0 ? 'trending-down-outline' : 'remove-outline';
  const changeValue = latestChange === null ? `${periodAverageScore}%` : `${latestChange > 0 ? '+' : ''}${latestChange}%`;
  const changeLabel = latestChange === null ? 'Энэ хугацааны дундаж' : 'Өмнөх шалгалтаас';
  const changeDescription =
    latestChange === null
      ? 'Харьцуулах өмнөх оролдлого цөөн байна. Дараагийн дүн орж ирэхэд өсөлт автоматаар харагдана.'
      : latestChange > 0
        ? `Сүүлийн шалгалтын дүн өмнөхөөс ${latestChange}% өссөн байна.`
        : latestChange < 0
          ? `Сүүлийн шалгалтын дүн өмнөхөөс ${Math.abs(latestChange)}% буурсан байна.`
          : 'Сүүлийн хоёр шалгалтын дүн ойролцоо түвшинд байна.';

  const chartData = trendResults
    .slice()
    .reverse()
    .map((result) => ({
      value: getScorePercentage(result.totalScore, result.maxScore),
      label: getChartLabel(new Date(result.date)),
    }));

  const latestSummary = latestWeakSection
    ? `${latestWeakSection.name} хэсэг одоогоор хамгийн сул байна. Эхлээд энэ хэсгийн тайлбараа review хийгээрэй.`
    : 'Сүүлийн шалгалтынхаа ерөнхий дүн болон хэсэг тус бүрийн гүйцэтгэлийг эндээс харна.';

  const nextStepSummary = focusArea
    ? `${focusArea} дээр төвлөрөөд, дараа нь шинэ mock test өгвөл ахиц хамгийн ойлгомжтой харагдана.`
    : 'Сүүлийн шалгалтынхаа review-г хийж дуусаад дараагийн mock test-ээр ахицаа шалгаарай.';

  const recommendationSummary = primaryRecommendation?.reason?.trim();

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

  if (isLoading && totalExams === 0 && !error) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
          <Icon name={progressEntryIcon} size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Icon name="trending-up-outline" size={28} color="#60A5FA" />
          </View>
          <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
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

  if (totalExams === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
          <Icon name={progressEntryIcon} size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Icon name="trending-up-outline" size={28} color="#60A5FA" />
          </View>
          <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
          <Text style={styles.heroDesc}>Өгсөн шалгалтын үр дүн энд харагдана.</Text>
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
          refreshing={isLoading && totalExams > 0}
          onRefresh={() => {
            reloadData().catch(() => undefined);
          }}
          tintColor="#155DFC"
        />
      }
    >
      <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
        <Icon name={progressEntryIcon} size={20} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Icon name="trending-up-outline" size={28} color="#60A5FA" />
        </View>
        <Text style={styles.heroTitle}>Ахиц дэвшил</Text>
        <Text style={styles.heroDesc}>Сүүлийн дүн, өөрчлөлт, сул хэсэг, дараагийн алхмаа эндээс нэг дор харна.</Text>
      </View>

      <View style={styles.filterRow}>
        {([
          ['all', 'Бүгд'],
          ['month', 'Сар'],
          ['week', '7 хоног'],
        ] as const).map(([key, label]) => {
          const active = timePeriod === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setTimePeriod(key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <InlineMessage message={error} containerStyle={styles.message} />

      {isLoading && totalExams > 0 ? (
        <View style={styles.refreshBanner}>
          <Icon name="sync-outline" size={14} color="#155DFC" />
          <Text style={styles.refreshText}>Шинэчилж байна...</Text>
        </View>
      ) : null}

      <View style={styles.subWrap}>
        <SubscriptionStatus />
      </View>

      {!hasFilteredResults ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Icon name="calendar-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Энэ хугацаанд шалгалт алга</Text>
          <Text style={styles.emptyDesc}>
            {`${periodLabel} өгсөн шалгалт олдсонгүй. Бүх хугацааны дүнгээ харах эсвэл шинэ mock test өгч үр дүнгээ нэмээрэй.`}
          </Text>
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={() => setTimePeriod('all')}
            activeOpacity={0.85}
          >
            <Text style={styles.resetFilterText}>Бүх хугацааг харах</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderTight}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Сүүлийн шалгалт</Text>
              </View>
              <Text style={styles.blockMeta}>
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

                    <Text style={styles.latestSummary}>{latestSummary}</Text>
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
                  <Text style={styles.primaryCtaText}>Сүүлийн шалгалтын review харах</Text>
                  <Icon name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderTight}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Өөрчлөлт</Text>
              </View>
              <Text style={styles.blockMeta}>{periodLabel}</Text>
            </View>

            <View style={[styles.changeBanner, { backgroundColor: changeSurface }]}>
              <View style={styles.changeIconBox}>
                <Icon name={changeIcon} size={20} color={changeColor} />
              </View>
              <View style={styles.changeBody}>
                <Text style={[styles.changeValue, { color: changeColor }]}>{changeValue}</Text>
                <Text style={styles.changeLabel}>{changeLabel}</Text>
                <Text style={styles.changeDescription}>{changeDescription}</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Энэ хугацааны дундаж</Text>
                <Text style={styles.statValue}>{periodAverageScore}%</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Шалгалтын тоо</Text>
                <Text style={styles.statValue}>{filteredResults.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Дундаж хугацаа</Text>
                <Text style={styles.statValue}>{avgStudyTime} мин</Text>
              </View>
            </View>

            <View style={styles.subsectionHeader}>
              <Text style={styles.subsectionTitle}>Сүүлийн шалгалтууд</Text>
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
              chartData.length > 0 ? (
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
              )
            ) : (
              <View style={styles.listGap}>
                {recentResults.map((result) => {
                  const pct = getScorePercentage(result.totalScore, result.maxScore);
                  const scoreColor = pct >= 80 ? '#059669' : pct >= 60 ? '#155DFC' : '#EF4444';
                  const scoreBg = pct >= 80 ? '#ECFDF5' : pct >= 60 ? '#EFF6FF' : '#FEF2F2';

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
                        <Text style={styles.listItemDate}>{new Date(result.date).toLocaleDateString('mn-MN')}</Text>
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
                <Text style={styles.sectionTitle}>Сул хэсэг</Text>
              </View>
              {focusAccuracy !== null ? <Text style={styles.blockMeta}>{focusAccuracy}%</Text> : null}
            </View>

            <View style={styles.focusCard}>
              <Text style={styles.focusEyebrow}>Яг одоо анхаарах хэсэг</Text>
              <Text style={styles.focusTitle}>{focusArea || 'Тодорхойгүй'}</Text>
              <Text style={styles.focusDesc}>
                {focusArea
                  ? `${focusArea} дээр алдаа арай өндөр байна. Энэ хэсгийн тайлбар, review-д түрүүлж анхаарвал хамгийн үр дүнтэй.`
                  : 'Одоогоор сул хэсгийг тодорхойлоход хангалттай өгөгдөл алга.'}
              </Text>
            </View>

            <View style={styles.barsGap}>
              {weakAreas.map((area) => (
                <View key={area.category} style={styles.weakRow}>
                  <View style={styles.weakHeader}>
                    <Text style={styles.weakLabel}>{area.category}</Text>
                    <Text style={styles.weakValue}>{area.accuracy}%</Text>
                  </View>
                  <View style={styles.weakTrack}>
                    <View style={[styles.weakFill, { width: `${area.accuracy}%` }]} />
                  </View>
                </View>
              ))}
            </View>

            {errorFrequency.length > 0 ? (
              <View style={styles.errorChipRow}>
                {errorFrequency.slice(0, 2).map((item) => (
                  <View key={item.category} style={styles.errorChip}>
                    <Text style={styles.errorChipLabel}>{item.category}</Text>
                    <Text style={styles.errorChipValue}>{item.count} алдаа</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderTight}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Дараагийн алхам</Text>
              </View>
            </View>

            <View style={styles.nextStepCallout}>
              <Icon name="sparkles-outline" size={18} color="#155DFC" />
              <Text style={styles.nextStepCalloutText}>{recommendationSummary || nextStepSummary}</Text>
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
                          {recommendation.reason?.trim() || content.description || 'Энэ материалыг одоо review-тэйгээ хамт үзвэл илүү үр дүнтэй.'}
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
                      <Text style={styles.actionTitle}>Сүүлийн шалгалтаа review хийх</Text>
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
                    <Text style={styles.actionButtonPrimaryText}>Review руу орох</Text>
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
                        : 'Review хийж дуусаад дахин шалгалт өгөх нь алдаагаа тогтворжуулахад хамгийн тохиромжтой.'}
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
  heroDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

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
  blockMeta: { fontSize: 12, color: '#64748B', fontWeight: '600' },

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
  chartWrap: { borderRadius: 12, overflow: 'hidden', width: '100%' },
  innerEmpty: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
  },
  innerEmptyText: { fontSize: 13, color: '#64748B' },

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
  weakTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' },
  weakFill: { height: '100%', borderRadius: 999, backgroundColor: '#155DFC' },
  errorChipRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  errorChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    gap: 4,
  },
  errorChipLabel: { fontSize: 11, color: '#991B1B', fontWeight: '700' },
  errorChipValue: { fontSize: 12, color: '#B91C1C', fontWeight: '800' },

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
