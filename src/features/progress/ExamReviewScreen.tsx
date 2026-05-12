import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootDrawerParamList } from '../../app/navigation/types';
import { resolveApiAssetUrl } from '../../core/api/apiClient';
import { InlineMessage } from '../../shared/components/feedback';
import { getErrorMessage, logError } from '../../shared/lib/errors';
import { progressApi } from './api/progressApi';
import type { ExamResultDetail } from './model/types';

type Props = DrawerScreenProps<RootDrawerParamList, 'ExamReview'>;

export function ExamReviewScreen({ navigation, route }: Props) {
  const { resultId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultDetail, setResultDetail] = useState<ExamResultDetail | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'incorrect' | 'all'>('incorrect');

  const loadResultDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await progressApi.getResultDetail(resultId);

      if (response.success && response.detail) {
        setResultDetail({
          ...response.detail,
          result: {
            ...response.detail.result,
            date: new Date(response.detail.result.date),
          },
        });
        setReviewFilter(response.detail.incorrectQuestions > 0 ? 'incorrect' : 'all');
        return;
      }

      setResultDetail(null);
      setError(getErrorMessage(response.error, 'Шалгалтын review мэдээлэл ачааллагдсангүй.'));
    } catch (detailError) {
      logError('Error loading exam review', detailError);
      setResultDetail(null);
      setError(getErrorMessage(detailError, 'Шалгалтын review мэдээлэл ачааллагдсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    loadResultDetail().catch(() => undefined);
  }, [loadResultDetail]);

  const visibleReviewQuestions = resultDetail
    ? reviewFilter === 'incorrect'
      ? resultDetail.reviewQuestions.filter((question) => !question.isCorrect)
      : resultDetail.reviewQuestions
    : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading && !!resultDetail}
          onRefresh={() => {
            loadResultDetail().catch(() => undefined);
          }}
        />
      }
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-back" size={20} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.headerCard}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Шалгалтын review</Text>
          <Text style={styles.subtitle}>
            {resultDetail
              ? `${resultDetail.result.examTitle} · ${resultDetail.result.date.toLocaleDateString('mn-MN')}`
              : 'Шалгалтын дэлгэрэнгүй тайлбар'}
          </Text>
        </View>
      </View>

      {loading && !resultDetail ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#155DFC" />
          <Text style={styles.loadingText}>Review ачааллаж байна...</Text>
        </View>
      ) : null}

      <InlineMessage message={error} containerStyle={styles.message} />

      {!loading && !resultDetail ? (
        <View style={styles.emptyCard}>
          <Icon name="document-text-outline" size={28} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Review хараахан бэлэн биш байна</Text>
          <Text style={styles.emptyDesc}>
            Энэ шалгалтын асуулт, тайлбарын мэдээллийг ачаалж чадсангүй. Backend-ээ restart хийгээд дахин шалгаарай.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              loadResultDetail().catch(() => undefined);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {resultDetail ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryScoreBox}>
                <Text style={styles.summaryScore}>
                  {resultDetail.result.totalScore}
                </Text>
                <Text style={styles.summaryScoreText}>
                  {`Нийт ${resultDetail.result.maxScore} оноо`}
                </Text>
              </View>

              <View style={styles.summaryStats}>
                <View style={styles.statChip}>
                  <Text style={styles.statChipLabel}>Хариулсан</Text>
                  <Text style={styles.statChipValue}>{resultDetail.answeredQuestions}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipLabel}>Алдсан</Text>
                  <Text style={[styles.statChipValue, styles.statChipValueDanger]}>{resultDetail.incorrectQuestions}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipLabel}>Хоосон</Text>
                  <Text style={styles.statChipValue}>{resultDetail.unansweredQuestions}</Text>
                </View>
              </View>
            </View>

            {resultDetail.weakSections.length > 0 ? (
              <View style={styles.sectionList}>
                {resultDetail.weakSections.map((section) => (
                  <View key={section.name} style={styles.sectionItem}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>{section.name}</Text>
                      <Text style={styles.sectionAccuracy}>{section.accuracy}%</Text>
                    </View>
                    <Text style={styles.sectionMeta}>
                      {section.correctAnswers}/{section.totalQuestions} зөв · {section.incorrectAnswers} алдсан
                    </Text>
                    <View style={styles.sectionTrack}>
                      <View style={[styles.sectionFill, { width: `${section.accuracy}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.filterRow}>
            {([
              { key: 'incorrect', label: 'Алдсан асуултууд' },
              { key: 'all', label: 'Бүх асуулт' },
            ] as const).map((filter) => {
              const active = reviewFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setReviewFilter(filter.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {visibleReviewQuestions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="sparkles-outline" size={24} color="#059669" />
              <Text style={styles.emptyTitle}>Алдсан асуулт алга</Text>
              <Text style={styles.emptyDesc}>Энэ шалгалтын бүх асуултад зөв хариулсан байна.</Text>
            </View>
          ) : (
            <View style={styles.reviewList}>
              {visibleReviewQuestions.map((question) => (
                <View key={question.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        question.isCorrect ? styles.statusBadgeCorrect : styles.statusBadgeWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          question.isCorrect ? styles.statusTextCorrect : styles.statusTextWrong,
                        ]}
                      >
                        {question.isCorrect ? 'Зөв' : 'Алдсан'}
                      </Text>
                    </View>
                    <Text style={styles.questionMeta}>
                      {question.sectionLabel} · {question.questionNumber}-р асуулт
                    </Text>
                  </View>

                  {question.audioUrl ? (
                    <View style={styles.audioBadge}>
                      <Icon name="volume-high-outline" size={14} color="#155DFC" />
                      <Text style={styles.audioText}>Аудио асуулт</Text>
                    </View>
                  ) : null}

                  <Text style={styles.questionText}>{question.questionText}</Text>

                  {question.questionImageUrl ? (
                    <Image
                      source={{ uri: resolveApiAssetUrl(question.questionImageUrl) || undefined }}
                      style={styles.questionImage}
                      resizeMode="contain"
                    />
                  ) : null}

                  <View style={styles.optionsWrap}>
                    {question.options.map((option, index) => (
                      <View
                        key={`${question.id}-${index}`}
                        style={[
                          styles.optionItem,
                          option.isCorrect && styles.optionItemCorrect,
                          option.isSelected && !option.isCorrect && styles.optionItemWrong,
                        ]}
                      >
                        {option.imageUrl ? (
                          <Image
                            source={{ uri: resolveApiAssetUrl(option.imageUrl) || undefined }}
                            style={styles.optionImage}
                            resizeMode="cover"
                          />
                        ) : null}

                        <View style={styles.optionBody}>
                          <Text style={styles.optionText}>{option.text}</Text>
                        </View>

                        {option.isCorrect ? (
                          <Icon name="checkmark-circle" size={18} color="#059669" />
                        ) : option.isSelected ? (
                          <Icon name="close-circle" size={18} color="#EF4444" />
                        ) : null}
                      </View>
                    ))}
                  </View>

                  <View style={styles.answerSummary}>
                    <View style={styles.answerChip}>
                      <Text style={styles.answerLabel}>Таны хариулт</Text>
                      <Text style={styles.answerValue}>{question.selectedAnswer || 'Хариулаагүй'}</Text>
                    </View>
                    <View style={[styles.answerChip, styles.answerChipCorrect]}>
                      <Text style={styles.answerLabel}>Зөв хариулт</Text>
                      <Text style={styles.answerValue}>{question.correctAnswer}</Text>
                    </View>
                  </View>

                  <View style={styles.explanationBox}>
                    <Icon name="bulb-outline" size={18} color="#8B5CF6" />
                    <Text style={styles.explanationText}>{question.explanation}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
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
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  headerTextWrap: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  message: { marginBottom: 12 },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryScoreBox: {
    width: 108,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  summaryScore: {
    fontSize: 28,
    fontWeight: '900',
    color: '#155DFC',
  },
  summaryScoreText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  summaryStats: {
    flex: 1,
    gap: 8,
  },
  statChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statChipLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statChipValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statChipValueDanger: {
    color: '#EF4444',
  },
  sectionList: { gap: 12 },
  sectionItem: { gap: 6 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionAccuracy: {
    fontSize: 13,
    fontWeight: '800',
    color: '#155DFC',
  },
  sectionMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  sectionFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#155DFC',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#155DFC',
    borderColor: '#155DFC',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#fff',
  },
  reviewList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeCorrect: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeWrong: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextCorrect: {
    color: '#059669',
  },
  statusTextWrong: {
    color: '#EF4444',
  },
  questionMeta: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  audioBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  audioText: {
    fontSize: 11,
    color: '#155DFC',
    fontWeight: '700',
  },
  questionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#0F172A',
    fontWeight: '600',
  },
  questionImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  optionsWrap: { gap: 8 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionItemCorrect: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  optionItemWrong: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  optionImage: {
    width: 64,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  optionBody: { flex: 1 },
  optionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  answerSummary: {
    flexDirection: 'row',
    gap: 8,
  },
  answerChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  answerChipCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  answerLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  answerValue: {
    marginTop: 4,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
  },
  explanationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: '#4C1D95',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: '#64748B',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#155DFC',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
