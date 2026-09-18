import { describe, expect, it } from '@jest/globals';

import {
  normalizeKoreanSpeech,
  scoreKoreanPronunciation,
  scoreKoreanSentence,
} from '../src/features/lessons/domain/pronunciationScore';

describe('Korean pronunciation scoring', () => {
  it('normalizes spaces and punctuation before exact comparison', () => {
    expect(normalizeKoreanSpeech(' 학-교! ')).toBe('학교');
    expect(scoreKoreanPronunciation('학교', ['학 교']).isExact).toBe(true);
  });

  it('chooses the closest recognition alternative', () => {
    const result = scoreKoreanPronunciation('학교', ['사고', '학고']);

    expect(result.recognizedText).toBe('학고');
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThan(100);
    expect(result.isExact).toBe(false);
  });

  it('returns a perfect score when any alternative is exact', () => {
    expect(scoreKoreanPronunciation('읽다', ['익다', '읽다'])).toEqual({
      recognizedText: '읽다',
      score: 100,
      isExact: true,
    });
  });

  it('marks omitted sentence words and lowers completeness', () => {
    const result = scoreKoreanSentence(
      '오늘은 날씨가 정말 좋아요',
      ['오늘 날씨가 정말 좋아요'],
    );

    expect(result.words).toEqual([
      { word: '오늘은', isCorrect: false },
      { word: '날씨가', isCorrect: true },
      { word: '정말', isCorrect: true },
      { word: '좋아요', isCorrect: true },
    ]);
    expect(result.completeness).toBe(75);
    expect(result.score).toBeLessThan(100);
  });
});
