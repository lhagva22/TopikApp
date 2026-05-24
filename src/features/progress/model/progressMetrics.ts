import type { ExamResult, ProgressSection } from './types';

export interface WeakAreaSummary {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
  errors: number;
}

export const getScorePercentage = (score: number, maxScore: number) =>
  Math.round((score / Math.max(maxScore, 1)) * 100);

export const getSectionAccuracy = (section: ProgressSection) =>
  section.totalQuestions > 0 ? Math.round((section.correctAnswers / section.totalQuestions) * 100) : 0;

export const buildWeakAreas = (results: Array<Pick<ExamResult, 'sections'>>): WeakAreaSummary[] =>
  Object.entries(
    results.reduce<Record<string, { correct: number; total: number }>>((acc, result) => {
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
      correct: stats.correct,
      total: stats.total,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      errors: stats.total - stats.correct,
    }))
    .sort((left, right) => left.accuracy - right.accuracy || right.errors - left.errors);
