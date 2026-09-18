const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JUNGSEONG_COUNT = 21;
const JONGSEONG_COUNT = 28;

export const normalizeKoreanSpeech = (value: string): string =>
  value.normalize('NFKC').toLowerCase().replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]/g, '');

const decomposeForComparison = (value: string): number[] => {
  const output: number[] = [];

  for (const character of normalizeKoreanSpeech(value)) {
    const code = character.charCodeAt(0);
    if (code < HANGUL_BASE || code > HANGUL_LAST) {
      output.push(code);
      continue;
    }

    const syllableIndex = code - HANGUL_BASE;
    const initial = Math.floor(syllableIndex / (JUNGSEONG_COUNT * JONGSEONG_COUNT));
    const medial = Math.floor((syllableIndex % (JUNGSEONG_COUNT * JONGSEONG_COUNT)) / JONGSEONG_COUNT);
    const final = syllableIndex % JONGSEONG_COUNT;

    output.push(0x1100 + initial, 0x1161 + medial);
    if (final > 0) {
      output.push(0x11a7 + final);
    }
  }

  return output;
};

const levenshteinDistance = (left: number[], right: number[]): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  left.forEach((leftValue, leftIndex) => {
    const current = [leftIndex + 1];
    right.forEach((rightValue, rightIndex) => {
      current.push(Math.min(
        current[rightIndex] + 1,
        previous[rightIndex + 1] + 1,
        previous[rightIndex] + (leftValue === rightValue ? 0 : 1),
      ));
    });
    previous.splice(0, previous.length, ...current);
  });

  return previous[right.length];
};

export type PronunciationScore = {
  recognizedText: string;
  score: number;
  isExact: boolean;
};

export const scoreKoreanPronunciation = (
  expected: string,
  recognitionAlternatives: string[],
): PronunciationScore => {
  const expectedNormalized = normalizeKoreanSpeech(expected);
  const expectedParts = decomposeForComparison(expectedNormalized);
  const candidates = recognitionAlternatives.length > 0 ? recognitionAlternatives : [''];

  return candidates.reduce<PronunciationScore>((best, candidate) => {
    const candidateNormalized = normalizeKoreanSpeech(candidate);
    const candidateParts = decomposeForComparison(candidateNormalized);
    const maxLength = Math.max(expectedParts.length, candidateParts.length, 1);
    const distance = levenshteinDistance(expectedParts, candidateParts);
    const score = Math.max(0, Math.round((1 - distance / maxLength) * 100));
    const result = {
      recognizedText: candidate,
      score,
      isExact: candidateNormalized === expectedNormalized,
    };

    if (result.isExact && !best.isExact) {
      return result;
    }
    return result.score > best.score ? result : best;
  }, { recognizedText: '', score: 0, isExact: false });
};

export type SentenceWordResult = {
  word: string;
  isCorrect: boolean;
};

export type SentencePronunciationScore = PronunciationScore & {
  isCorrect: boolean;
  wordAccuracy: number;
  completeness: number;
  phonemeScore: number;
  words: SentenceWordResult[];
};

const tokenizeSentence = (value: string): string[] =>
  value
    .normalize('NFKC')
    .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const alignExpectedWords = (expected: string[], recognized: string[]): boolean[] => {
  const rows = expected.length + 1;
  const columns = recognized.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let left = 1; left < rows; left += 1) {
    for (let right = 1; right < columns; right += 1) {
      table[left][right] = normalizeKoreanSpeech(expected[left - 1]) === normalizeKoreanSpeech(recognized[right - 1])
        ? table[left - 1][right - 1] + 1
        : Math.max(table[left - 1][right], table[left][right - 1]);
    }
  }

  const matches = Array<boolean>(expected.length).fill(false);
  let left = expected.length;
  let right = recognized.length;
  while (left > 0 && right > 0) {
    if (normalizeKoreanSpeech(expected[left - 1]) === normalizeKoreanSpeech(recognized[right - 1])) {
      matches[left - 1] = true;
      left -= 1;
      right -= 1;
    } else if (table[left - 1][right] >= table[left][right - 1]) {
      left -= 1;
    } else {
      right -= 1;
    }
  }

  return matches;
};

export const scoreKoreanSentence = (
  expected: string,
  recognitionAlternatives: string[],
): SentencePronunciationScore => {
  const closest = scoreKoreanPronunciation(expected, recognitionAlternatives);
  const expectedWords = tokenizeSentence(expected);
  const recognizedWords = tokenizeSentence(closest.recognizedText);
  const matches = closest.isExact
    ? Array<boolean>(expectedWords.length).fill(true)
    : alignExpectedWords(expectedWords, recognizedWords);
  const matchedCount = matches.filter(Boolean).length;
  const completeness = Math.round((matchedCount / Math.max(expectedWords.length, 1)) * 100);
  const wordAccuracy = Math.round((matchedCount / Math.max(expectedWords.length, recognizedWords.length, 1)) * 100);
  const score = Math.round(wordAccuracy * 0.5 + closest.score * 0.3 + completeness * 0.2);

  return {
    ...closest,
    score,
    phonemeScore: closest.score,
    wordAccuracy,
    completeness,
    isCorrect: score >= 85,
    words: expectedWords.map((word, index) => ({ word, isCorrect: matches[index] })),
  };
};
