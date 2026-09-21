import type { ExamResult, ProgressSection } from './types';

export interface WeakAreaSummary {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
  errors: number;
}

export const getScorePercentage = (score: number, maxScore: number) =>
  Number.isFinite(score) && Number.isFinite(maxScore) && maxScore > 0
    ? Math.round(Math.min(1, Math.max(0, score / maxScore)) * 100)
    : 0;

export const getSectionAccuracy = (section: ProgressSection) =>
  getScorePercentage(section.correctAnswers, section.totalQuestions);

export const sortResultsByDate = (results: ExamResult[]) =>
  results.slice().sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

export const filterResultsByPeriod = (
  results: ExamResult[],
  period: 'all' | 'week' | 'month',
  now = new Date(),
) => {
  const cutoff = now.getTime() - (period === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000;
  return sortResultsByDate(results.filter((result) => period === 'all' || new Date(result.date).getTime() >= cutoff));
};

const hasScore = (result: ExamResult) =>
  Number.isFinite(result.totalScore) && Number.isFinite(result.maxScore) && result.maxScore > 0;

const getWeightedScore = (results: ExamResult[]) => {
  const scoredResults = results.filter(hasScore);
  if (scoredResults.length === 0) {
    return null;
  }

  return getScorePercentage(
    scoredResults.reduce((sum, result) => sum + Math.min(result.maxScore, Math.max(0, result.totalScore)), 0),
    scoredResults.reduce((sum, result) => sum + result.maxScore, 0),
  );
};

export const buildProgressSummaries = (results: ExamResult[]) =>
  (['TOPIK I', 'TOPIK II'] as const).flatMap((examType) => {
    const matching = sortResultsByDate(results.filter((result) => result.examType === examType));
    if (matching.length === 0) {
      return [];
    }

    const scoredResults = matching.filter(hasScore);
    const comparisonCount = Math.min(3, Math.floor(scoredResults.length / 2));
    const recent = getWeightedScore(scoredResults.slice(0, comparisonCount));
    const previous = getWeightedScore(scoredResults.slice(comparisonCount, comparisonCount * 2));

    return [{
      examType,
      count: matching.length,
      average: getWeightedScore(matching),
      best: scoredResults.length > 0
        ? Math.max(...scoredResults.map((result) => getScorePercentage(result.totalScore, result.maxScore)))
        : null,
      improvement: recent !== null && previous !== null ? recent - previous : null,
      comparisonCount,
      weakAreas: buildWeakAreas(matching),
    }];
  });

export const buildWeakAreas = (results: Array<Pick<ExamResult, 'sections'>>): WeakAreaSummary[] =>
  Object.entries(
    results.reduce<Record<string, { correct: number; total: number }>>((acc, result) => {
      result.sections.forEach((section) => {
        if (section.totalQuestions <= 0) {
          return;
        }
        if (!acc[section.name]) {
          acc[section.name] = { correct: 0, total: 0 };
        }

        acc[section.name].correct += Math.min(section.totalQuestions, Math.max(0, section.correctAnswers));
        acc[section.name].total += section.totalQuestions;
      });

      return acc;
    }, {}),
  )
    .map(([category, stats]) => ({
      category,
      correct: stats.correct,
      total: stats.total,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      errors: stats.total - stats.correct,
    }))
    .sort((left, right) => left.accuracy - right.accuracy || right.errors - left.errors);
