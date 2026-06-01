import { describe, expect, it } from '@jest/globals';

import { buildWeakAreas, getScorePercentage, getSectionAccuracy } from '../src/features/progress/domain/progressMetrics';

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
});
