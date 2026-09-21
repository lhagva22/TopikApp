import { describe, expect, it } from '@jest/globals';

import {
  listeningCategories,
  listeningPracticeItems,
} from '../src/features/lessons/domain/listeningPracticeData';

describe('listening practice content', () => {
  it('contains five valid exercises for every category', () => {
    expect(listeningCategories).toHaveLength(6);
    expect(listeningPracticeItems).toHaveLength(30);

    listeningCategories.forEach((category) => {
      expect(listeningPracticeItems.filter((item) => item.category === category.id)).toHaveLength(5);
    });
  });

  it('has four choices and a valid answer for every exercise', () => {
    listeningPracticeItems.forEach((item) => {
      expect(item.speechText.trim()).not.toBe('');
      expect(item.options).toHaveLength(4);
      expect(item.correctIndex).toBeGreaterThanOrEqual(0);
      expect(item.correctIndex).toBeLessThan(item.options.length);
    });
  });
});
