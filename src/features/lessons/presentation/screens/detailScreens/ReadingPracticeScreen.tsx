import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootDrawerParamList } from '../../../../../app/navigation/types';
import { koreanSpeechRecognizer } from '../../../../../core/native/koreanSpeechRecognizer';
import { koreanTts } from '../../../../../core/native/koreanTts';
import { dictionaryUseCases } from '../../../../dictionary/presentation/dependencies';
import type { DictionaryWord } from '../../../../dictionary/domain/types';
import { IconButton } from '../../../../../shared/components/molecules/IconButton';
import { getErrorMessage } from '../../../../../shared/lib/errors';
import {
  scoreKoreanPronunciation,
  scoreKoreanSentence,
  type SentenceWordResult,
} from '../../../domain/pronunciationScore';

const WORD_SESSION_SIZE = 10;
const SENTENCE_SESSION_SIZE = 5;
type PracticeMode = 'word' | 'sentence';
type PracticeItem = {
  id: string;
  text: string;
  meaning?: string;
  pronunciation?: string;
};

type AttemptResult = {
  expected: string;
  recognizedText: string;
  score: number;
  isCorrect: boolean;
  wordAccuracy?: number;
  completeness?: number;
  phonemeScore?: number;
  words?: SentenceWordResult[];
};

const cleanSentence = (value: string): string | null => {
  const match = value.trim().match(/^<문장>\s*(.+)$/);
  if (!match) {
    return null;
  }
  const sentence = match[1].replace(/\s+/g, ' ').trim();
  const wordCount = sentence.split(/\s+/).length;
  return wordCount >= 3 && sentence.length <= 120 ? sentence : null;
};

const ReadingPracticeScreen = () => {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
  const [mode, setMode] = useState<PracticeMode>('word');
  const [words, setWords] = useState<PracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [incorrectWords, setIncorrectWords] = useState<PracticeItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? Math.round(((currentIndex + (result ? 1 : 0)) / words.length) * 100) : 0;

  const resetSession = useCallback((nextWords: PracticeItem[]) => {
    setWords(nextWords);
    setCurrentIndex(0);
    setResult(null);
    setIncorrectWords([]);
    setCorrectCount(0);
    setIsComplete(false);
  }, []);

  const loadSession = useCallback(async (targetMode: PracticeMode) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setMode(targetMode);

      let practiceItems: PracticeItem[];
      if (targetMode === 'sentence') {
        const sourceWords = await dictionaryUseCases.getSentencePracticeWords(120);
        practiceItems = sourceWords
          .flatMap((word: DictionaryWord) => word.examples.map((example, index) => {
            const sentence = cleanSentence(example);
            return sentence ? [{
              id: `${word.id}-${index}`,
              text: sentence,
              meaning: `Түлхүүр үг: ${word.koreanWord} — ${word.mongolianMeaning}`,
            }] : [];
          }).flat())
          .sort(() => Math.random() - 0.5)
          .slice(0, SENTENCE_SESSION_SIZE);
      } else {
        const practiceWords = await dictionaryUseCases.getPracticeWords(WORD_SESSION_SIZE);
        practiceItems = practiceWords.map((word: DictionaryWord) => ({
          id: word.id,
          text: word.koreanWord,
          meaning: word.mongolianMeaning,
          pronunciation: word.pronunciation,
        }));
      }

      if (practiceItems.length === 0) {
        throw new Error('Үгийн сангийн cache бэлэн болоогүй байна. Үгийн сан хэсгийг эхлээд нээнэ үү.');
      }
      resetSession(practiceItems);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Дасгалын үгсийг бэлдэхэд алдаа гарлаа.'));
    } finally {
      setIsLoading(false);
    }
  }, [resetSession]);

  useEffect(() => {
    loadSession('word').catch(() => undefined);
    return () => {
      koreanTts.stop().catch(() => undefined);
      koreanSpeechRecognizer.cancel().catch(() => undefined);
    };
  }, [loadSession]);

  const listen = async () => {
    if (!currentWord || isListening || result) {
      return;
    }

    try {
      await koreanTts.stop();
      setIsListening(true);
      const alternatives = await koreanSpeechRecognizer.start();
      const scored = mode === 'sentence'
        ? scoreKoreanSentence(currentWord.text, alternatives)
        : scoreKoreanPronunciation(currentWord.text, alternatives);
      const isCorrect = mode === 'sentence' ? scored.score >= 85 : scored.isExact;
      setResult({ ...scored, expected: currentWord.text, isCorrect });

      if (isCorrect) {
        setCorrectCount((count) => count + 1);
        setIncorrectWords((items) => items.filter((item) => item.id !== currentWord.id));
      } else {
        setIncorrectWords((items) => (
          items.some((item) => item.id === currentWord.id) ? items : [...items, currentWord]
        ));
      }
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes('MICROPHONE_PERMISSION_DENIED')) {
        Alert.alert('Микрофон хаалттай байна', 'Дуудлага шалгахын тулд микрофоны зөвшөөрөл өгнө үү.');
      } else if (message.includes('NO_MATCH') || message.includes('SPEECH_TIMEOUT')) {
        Alert.alert('Дуу танигдсангүй', 'Микрофонд ойрхон, үгээ дахин тод хэлнэ үү.');
      } else if (message.includes('NETWORK_ERROR')) {
        Alert.alert('Сүлжээ шаардлагатай', 'Таны утасны speech recognition үйлчилгээ интернэт шаардаж байна.');
      } else {
        Alert.alert('Дуудлага шалгаж чадсангүй', 'Google Speech Services суусан эсэхийг шалгаад дахин оролдоно уу.');
      }
    } finally {
      setIsListening(false);
    }
  };

  const nextWord = () => {
    if (currentIndex >= words.length - 1) {
      setIsComplete(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setResult(null);
  };

  const retryCurrent = () => {
    setResult(null);
  };

  const retryIncorrect = () => {
    if (incorrectWords.length > 0) {
      resetSession(incorrectWords);
    }
  };

  const status = useMemo(() => {
    if (!result) {
      return null;
    }
    if (result.isCorrect) {
      return { icon: 'checkmark-circle', color: '#059669', bg: '#ECFDF5', title: 'Зөв уншлаа!' };
    }
    return { icon: 'close-circle', color: '#DC2626', bg: '#FEF2F2', title: 'Дахин давтаарай' };
  }, [result]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <IconButton name="arrow-back" onPress={() => navigation.navigate('Lesson')} style={styles.backButton} size={36} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}><Icon name="mic-outline" size={24} color="#F8FAFC" /></View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Уншлагын дасгал</Text>
          <Text style={styles.heroDescription}>Сонсож, дагаж уншаад дуудлагаа шалгаарай</Text>
        </View>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'word' && styles.modeButtonActive]}
          disabled={isLoading || isListening}
          onPress={() => loadSession('word').catch(() => undefined)}
        >
          <Icon name="text-outline" size={18} color={mode === 'word' ? '#fff' : '#64748B'} />
          <Text style={[styles.modeButtonText, mode === 'word' && styles.modeButtonTextActive]}>Үг</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'sentence' && styles.modeButtonActive]}
          disabled={isLoading || isListening}
          onPress={() => loadSession('sentence').catch(() => undefined)}
        >
          <Icon name="reader-outline" size={18} color={mode === 'sentence' ? '#fff' : '#64748B'} />
          <Text style={[styles.modeButtonText, mode === 'sentence' && styles.modeButtonTextActive]}>Өгүүлбэр</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#155DFC" />
          <Text style={styles.stateText}>Дасгалын {mode === 'word' ? 'үгсийг' : 'өгүүлбэрүүдийг'} бэлдэж байна...</Text>
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={styles.stateCard}>
          <Icon name="alert-circle-outline" size={34} color="#DC2626" />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => loadSession(mode).catch(() => undefined)}>
            <Text style={styles.secondaryButtonText}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !loadError && isComplete ? (
        <View style={styles.summaryCard}>
          <Icon name="trophy-outline" size={48} color="#F59E0B" />
          <Text style={styles.summaryTitle}>Дасгал дууслаа</Text>
          <Text style={styles.summaryScore}>{correctCount} / {words.length}</Text>
          <Text style={styles.summaryDescription}>Зөв уншсан {mode === 'word' ? 'үг' : 'өгүүлбэр'}</Text>
          {incorrectWords.length > 0 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={retryIncorrect}>
              <Icon name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Алдсан {incorrectWords.length} {mode === 'word' ? 'үгээ' : 'өгүүлбэрээ'} давтах</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => loadSession(mode).catch(() => undefined)}>
            <Text style={styles.secondaryButtonText}>Шинэ {mode === 'word' ? '10 үг' : '5 өгүүлбэр'} эхлэх</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !loadError && !isComplete && currentWord ? (
        <>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{currentIndex + 1} / {words.length}</Text>
            <Text style={styles.progressScore}>Зөв: {correctCount}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.practiceCard}>
            <Text style={[styles.koreanWord, mode === 'sentence' && styles.koreanSentence]}>{currentWord.text}</Text>
            {!!currentWord.pronunciation && (
              <Text style={styles.pronunciation}>[{currentWord.pronunciation}]</Text>
            )}
            {!!currentWord.meaning && <Text style={styles.meaning}>{currentWord.meaning}</Text>}

            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => koreanTts.speak(currentWord.text, 0.72).catch(() => undefined)}
            >
              <Icon name="volume-high-outline" size={22} color="#155DFC" />
              <Text style={styles.listenButtonText}>Зөв дуудлагыг сонсох</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.micButton, (isListening || result) && styles.disabledButton]}
              disabled={isListening || Boolean(result)}
              onPress={() => listen().catch(() => undefined)}
            >
              {isListening ? <ActivityIndicator color="#fff" /> : <Icon name="mic" size={30} color="#fff" />}
              <Text style={styles.micButtonText}>{isListening ? 'Сонсож байна...' : 'Дарж унших'}</Text>
            </TouchableOpacity>
          </View>

          {result && status ? (
            <View style={[styles.resultCard, { backgroundColor: status.bg }]}>
              <Icon name={status.icon} size={32} color={status.color} />
              <Text style={[styles.resultTitle, { color: status.color }]}>{status.title}</Text>
              <Text style={styles.resultScore}>{result.score}% ойролцоо</Text>
              <Text style={styles.recognizedText}>Танигдсан: {result.recognizedText || '—'}</Text>
              {mode === 'sentence' && result.words ? (
                <View style={styles.wordFeedback}>
                  {result.words.map((word, index) => (
                    <View
                      key={`${word.word}-${index}`}
                      style={[styles.feedbackWord, word.isCorrect ? styles.feedbackWordCorrect : styles.feedbackWordWrong]}
                    >
                      <Text style={word.isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextWrong}>{word.word}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {mode === 'sentence' && result.wordAccuracy != null ? (
                <View style={styles.metricRow}>
                  <Text style={styles.metricText}>Үг: {result.wordAccuracy}%</Text>
                  <Text style={styles.metricText}>Бүрэн: {result.completeness}%</Text>
                  <Text style={styles.metricText}>Авиа: {result.phonemeScore}%</Text>
                </View>
              ) : null}
              <View style={styles.resultActions}>
                {!result.isCorrect ? (
                  <TouchableOpacity style={styles.retryButton} onPress={retryCurrent}>
                    <Icon name="refresh-outline" size={18} color="#155DFC" />
                    <Text style={styles.retryButtonText}>Дахин унших</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.nextButton} onPress={nextWord}>
                  <Text style={styles.nextButtonText}>
                    {currentIndex === words.length - 1
                      ? 'Үр дүн харах'
                      : `Дараагийн ${mode === 'word' ? 'үг' : 'өгүүлбэр'}`}
                  </Text>
                  <Icon name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.notice}>
        <Icon name="information-circle-outline" size={18} color="#64748B" />
        <Text style={styles.noticeText}>Энэ үнэлгээ Android-ийн таньсан үгийг Hangul авианы бүтэцтэй харьцуулсан ойролцоо оноо юм.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },
  backButton: { borderRadius: 10, marginBottom: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 18, padding: 16, gap: 12, marginBottom: 16 },
  heroIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#155DFC', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  heroTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  heroDescription: { color: '#94A3B8', fontSize: 12, marginTop: 3 },
  modeSelector: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 14, padding: 4, marginBottom: 16, gap: 4 },
  modeButton: { flex: 1, height: 42, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  modeButtonActive: { backgroundColor: '#155DFC' },
  modeButtonText: { color: '#64748B', fontSize: 13, fontWeight: '800' },
  modeButtonTextActive: { color: '#fff' },
  stateCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  stateText: { color: '#64748B', fontSize: 13 },
  errorText: { color: '#DC2626', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { color: '#334155', fontSize: 13, fontWeight: '800' },
  progressScore: { color: '#059669', fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: '#DBEAFE', borderRadius: 999, overflow: 'hidden', marginBottom: 14 },
  progressFill: { height: '100%', backgroundColor: '#155DFC', borderRadius: 999 },
  practiceCard: { backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  koreanWord: { color: '#0F172A', fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  koreanSentence: { fontSize: 25, lineHeight: 38, textAlign: 'center', letterSpacing: -0.4 },
  pronunciation: { color: '#64748B', fontSize: 14, marginTop: 4 },
  meaning: { color: '#334155', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  listenButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 14, paddingHorizontal: 16, height: 48, gap: 8, marginTop: 22 },
  listenButtonText: { color: '#155DFC', fontSize: 13, fontWeight: '800' },
  micButton: { backgroundColor: '#155DFC', borderRadius: 18, minWidth: 190, height: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 },
  micButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.65 },
  resultCard: { borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 14, gap: 5 },
  resultTitle: { fontSize: 17, fontWeight: '800' },
  resultScore: { color: '#0F172A', fontSize: 22, fontWeight: '900' },
  recognizedText: { color: '#64748B', fontSize: 13 },
  wordFeedback: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 9 },
  feedbackWord: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  feedbackWordCorrect: { backgroundColor: '#D1FAE5' },
  feedbackWordWrong: { backgroundColor: '#FEE2E2' },
  feedbackTextCorrect: { color: '#047857', fontSize: 13, fontWeight: '700' },
  feedbackTextWrong: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 8 },
  metricText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  resultActions: { alignSelf: 'stretch', gap: 8, marginTop: 10 },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 13, height: 46, paddingHorizontal: 18, gap: 8 },
  retryButtonText: { color: '#155DFC', fontSize: 13, fontWeight: '800' },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', borderRadius: 13, height: 46, paddingHorizontal: 20, gap: 8 },
  nextButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 22, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  summaryScore: { color: '#155DFC', fontSize: 40, fontWeight: '900' },
  summaryDescription: { color: '#64748B', fontSize: 13, marginBottom: 8 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#155DFC', borderRadius: 14, height: 48, paddingHorizontal: 18, gap: 8, alignSelf: 'stretch' },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 14, minHeight: 46, paddingHorizontal: 18, alignSelf: 'stretch' },
  secondaryButtonText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 13, gap: 8, marginTop: 16 },
  noticeText: { flex: 1, color: '#64748B', fontSize: 11, lineHeight: 17 },
});

export default ReadingPracticeScreen;
