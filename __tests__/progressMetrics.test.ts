import { describe, expect, it } from '@jest/globals';

import { buildProgressSummaries, buildWeakAreas, filterResultsByPeriod, getScorePercentage, getSectionAccuracy } from '../src/features/progress/domain/progressMetrics';
import type { ExamResult } from '../src/features/progress/domain/types';

const exam = (day: number, score: number, extra: Partial<ExamResult> = {}): ExamResult => ({
  id: `result-${day}`,
  examTitle: 'TOPIK I 35',
  examType: 'TOPIK I',
  date: new Date(`2026-09-${String(day).padStart(2, '0')}T12:00:00Z`),
  totalScore: score,
  maxScore: 200,
  sections: [],
  duration: 600,
  ...extra,
});

describe('progress metrics', () => {
  it('finds the weak area from all selected exam results', () => {
    const weakAreas = buildWeakAreas([
      {
        sections: [
          { name: 'listening', score: 70, maxScore: 100, correctAnswers: 7, totalQuestions: 10 },
          { name: 'reading', score: 40, maxScore: 100, correctAnswers: 4, totalQuestions: 10 },
        ],
      },
      {
        sections: [
          { name: 'listening', score: 80, maxScore: 100, correctAnswers: 8, totalQuestions: 10 },
          { name: 'reading', score: 50, maxScore: 100, correctAnswers: 5, totalQuestions: 10 },
        ],
      },
    ]);

    expect(weakAreas[0]).toEqual({
      category: 'reading',
      correct: 9,
      total: 20,
      accuracy: 45,
      errors: 11,
    });
    expect(weakAreas[1].accuracy).toBe(75);
  });

  it('calculates exam and section percentages consistently', () => {
    expect(getScorePercentage(140, 200)).toBe(70);
    expect(
      getSectionAccuracy({
        name: 'reading',
        score: 0,
        maxScore: 100,
        correctAnswers: 14,
        totalQuestions: 20,
      }),
    ).toBe(70);
  });

  it('keeps TOPIK types separate and uses actual available points for averages', () => {
    const summaries = buildProgressSummaries([
      exam(1, 100),
      exam(2, 100, { maxScore: 100 }),
      exam(3, 160, { examType: 'TOPIK II' }),
    ]);

    expect(summaries[0]).toMatchObject({ count: 2, average: 67, best: 100, improvement: 50 });
    expect(summaries[1]).toMatchObject({ examType: 'TOPIK II', average: 80, improvement: null });
  });

  it('compares distinct recent and previous attempts, including just two or three results', () => {
    const unsorted = [exam(1, 20), exam(3, 180), exam(2, 80)];
    expect(buildProgressSummaries(unsorted)[0]).toMatchObject({ improvement: 50, comparisonCount: 1 });
    expect(unsorted[0].id).toBe('result-1');
    expect(buildProgressSummaries([exam(1, 100), exam(2, 80)])[0].improvement).toBe(-10);
    expect(buildProgressSummaries([exam(1, 0)])[0]).toMatchObject({ average: 0, best: 0, improvement: null });
  });

  it('does not invent a zero score or trend when maximum points are unavailable', () => {
    expect(buildProgressSummaries([exam(1, 100, { maxScore: 0 })])[0])
      .toMatchObject({ average: null, best: null, improvement: null });
    expect(buildProgressSummaries([exam(1, 100, { maxScore: 0 }), exam(2, 0)])[0])
      .toMatchObject({ average: 0, best: 0, improvement: null });
    expect(getScorePercentage(5, 0)).toBe(0);
    expect(getScorePercentage(Number.NaN, 200)).toBe(0);
  });

  it('weights skill accuracy by question count and ignores unavailable sections', () => {
    const section = (correctAnswers: number, totalQuestions: number) => ({
      name: 'Сонсгол', score: 0, maxScore: 100, correctAnswers, totalQuestions,
    });
    const areas = buildWeakAreas([
      { sections: [section(1, 1), { ...section(0, 0), name: 'Уншлага' }] },
      { sections: [section(0, 9)] },
    ]);
    expect(areas).toEqual([{ category: 'Сонсгол', correct: 1, total: 10, accuracy: 10, errors: 9 }]);
  });

  it('uses a rolling 30-day period and returns the newest result first', () => {
    const now = new Date('2026-03-31T12:00:00Z');
    const results = [
      exam(1, 0, { id: 'outside', date: new Date('2026-03-01T11:59:59Z') }),
      exam(1, 0, { id: 'boundary', date: new Date('2026-03-01T12:00:00Z') }),
      exam(1, 0, { id: 'latest', date: now }),
    ];
    expect(filterResultsByPeriod(results, 'month', now).map((result) => result.id)).toEqual(['latest', 'boundary']);
  });
});
