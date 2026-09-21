import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootDrawerParamList } from '../../../../../app/navigation/types';
import { koreanTts } from '../../../../../core/native/koreanTts';
import { IconButton } from '../../../../../shared/components/molecules/IconButton';
import {
  listeningCategories,
  listeningPracticeItems,
  type ListeningCategory,
  type ListeningPracticeItem,
} from '../../../domain/listeningPracticeData';

const MAX_LISTENS = 3;
type ListeningSpeed = 'slow' | 'normal';
const LISTENING_RATES: Record<ListeningSpeed, number> = {
  slow: 0.62,
  normal: 0.82,
};

const ListeningPracticeScreen = () => {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
  const [category, setCategory] = useState<ListeningCategory>('response');
  const [session, setSession] = useState<ListeningPracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listenCount, setListenCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectItems, setIncorrectItems] = useState<ListeningPracticeItem[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [listeningSpeed, setListeningSpeed] = useState<ListeningSpeed>('slow');
  const [isStartingAudio, setIsStartingAudio] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const currentItem = session[currentIndex];
  const hasAnswered = selectedIndex != null;
  const currentCategory = listeningCategories.find((item) => item.id === category);

  const startSession = (nextCategory: ListeningCategory, items?: ListeningPracticeItem[]) => {
    koreanTts.stop().catch(() => undefined);
    const nextItems = items || listeningPracticeItems.filter((item) => item.category === nextCategory);
    setCategory(nextCategory);
    setSession(nextItems);
    setCurrentIndex(0);
    setListenCount(0);
    setSelectedIndex(null);
    setCorrectCount(0);
    setIncorrectItems([]);
    setIsComplete(false);
    setIsStartingAudio(false);
    setTtsError(null);
  };

  useEffect(() => {
    startSession('response');
    return () => {
      koreanTts.stop().catch(() => undefined);
    };
  }, []);

  const playAudio = async () => {
    if (!currentItem || listenCount >= MAX_LISTENS || hasAnswered || isStartingAudio) {
      return;
    }
    if (!koreanTts.isSupported) {
      setTtsError('Энэ дасгал одоогоор зөвхөн Android төхөөрөмжийн Korean TTS-тэй ажиллана.');
      return;
    }

    setIsStartingAudio(true);
    setTtsError(null);
    try {
      await koreanTts.speak(currentItem.speechText, LISTENING_RATES[listeningSpeed]);
      setListenCount((count) => count + 1);
    } catch {
      setTtsError('Солонгос дуу хоолой ажилласангүй. Android-ийн Korean voice data суусан эсэхийг шалгана уу.');
    } finally {
      setIsStartingAudio(false);
    }
  };

  const selectAnswer = (answerIndex: number) => {
    if (!currentItem || listenCount === 0 || hasAnswered) {
      return;
    }

    setSelectedIndex(answerIndex);
    if (answerIndex === currentItem.correctIndex) {
      setCorrectCount((count) => count + 1);
    } else {
      setIncorrectItems((items) => [...items, currentItem]);
    }
  };

  const nextQuestion = () => {
    koreanTts.stop().catch(() => undefined);
    if (currentIndex >= session.length - 1) {
      setIsComplete(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setListenCount(0);
    setSelectedIndex(null);
    setTtsError(null);
  };

  const progress = session.length > 0
    ? Math.round(((currentIndex + (hasAnswered ? 1 : 0)) / session.length) * 100)
    : 0;

  const answerStatus = useMemo(() => {
    if (!currentItem || selectedIndex == null) {
      return null;
    }
    return selectedIndex === currentItem.correctIndex;
  }, [currentItem, selectedIndex]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <IconButton name="arrow-back" onPress={() => navigation.navigate('Lesson')} style={styles.backButton} size={36} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}><Icon name="headset-outline" size={25} color="#fff" /></View>
        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>Сонсголын дасгал</Text>
          <Text style={styles.heroDescription}>Богино яриаг сонсоод зөв хариултыг сонгоорой</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Дасгалын төрөл</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
        {listeningCategories.map((item) => {
          const active = category === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => startSession(item.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Icon name={item.icon} size={17} color={active ? '#fff' : '#475569'} />
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{item.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isComplete ? (
        <View style={styles.summaryCard}>
          <Icon name="trophy-outline" size={48} color="#F59E0B" />
          <Text style={styles.summaryTitle}>{currentCategory?.title}</Text>
          <Text style={styles.summaryScore}>{correctCount} / {session.length}</Text>
          <Text style={styles.summaryText}>Зөв хариулт</Text>
          {incorrectItems.length > 0 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => startSession(category, incorrectItems)}>
              <Icon name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Алдсан {incorrectItems.length} дасгалаа давтах</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => startSession(category)}>
            <Text style={styles.secondaryButtonText}>Дахин эхлэх</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isComplete && currentItem ? (
        <>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{currentIndex + 1} / {session.length}</Text>
            <Text style={styles.progressScore}>Зөв: {correctCount}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.audioCard}>
            <View style={styles.audioCircle}>
              <Icon name="volume-high" size={34} color="#155DFC" />
            </View>
            <Text style={styles.audioTitle}>Аудиог анхааралтай сонсоно уу</Text>
            <Text style={styles.audioHint}>{listenCount} / {MAX_LISTENS} удаа сонссон</Text>
            <View style={styles.speedSelector}>
              <TouchableOpacity
                style={[styles.speedButton, listeningSpeed === 'slow' && styles.speedButtonActive]}
                onPress={() => setListeningSpeed('slow')}
                disabled={hasAnswered}
                accessibilityRole="button"
                accessibilityState={{ selected: listeningSpeed === 'slow', disabled: hasAnswered }}
              >
                <Text style={[styles.speedButtonText, listeningSpeed === 'slow' && styles.speedButtonTextActive]}>
                  Удаан
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.speedButton, listeningSpeed === 'normal' && styles.speedButtonActive]}
                onPress={() => setListeningSpeed('normal')}
                disabled={hasAnswered}
                accessibilityRole="button"
                accessibilityState={{ selected: listeningSpeed === 'normal', disabled: hasAnswered }}
              >
                <Text style={[styles.speedButtonText, listeningSpeed === 'normal' && styles.speedButtonTextActive]}>
                  Хэвийн
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.playButton, (listenCount >= MAX_LISTENS || hasAnswered || isStartingAudio) && styles.disabledButton]}
              disabled={listenCount >= MAX_LISTENS || hasAnswered || isStartingAudio}
              onPress={() => playAudio().catch(() => undefined)}
              accessibilityRole="button"
              accessibilityLabel="Солонгос өгүүлбэрийг сонсох"
            >
              {isStartingAudio ? <ActivityIndicator color="#fff" /> : <Icon name="play" size={20} color="#fff" />}
              <Text style={styles.playButtonText}>{isStartingAudio ? 'Бэлтгэж байна...' : listenCount === 0 ? 'Сонсох' : 'Дахин сонсох'}</Text>
            </TouchableOpacity>
            {ttsError ? <Text style={styles.ttsError}>{ttsError}</Text> : null}
          </View>

          <Text style={styles.question}>{currentItem.question}</Text>
          <View style={styles.options}>
            {currentItem.options.map((option, index) => {
              const isCorrectOption = hasAnswered && index === currentItem.correctIndex;
              const isWrongSelection = hasAnswered && index === selectedIndex && index !== currentItem.correctIndex;
              return (
                <TouchableOpacity
                  key={`${option}-${index}`}
                  disabled={listenCount === 0 || hasAnswered}
                  activeOpacity={0.75}
                  onPress={() => selectAnswer(index)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: listenCount === 0 || hasAnswered, selected: index === selectedIndex }}
                  style={[
                    styles.option,
                    listenCount === 0 && styles.optionLocked,
                    isCorrectOption && styles.optionCorrect,
                    isWrongSelection && styles.optionWrong,
                  ]}
                >
                  <View style={[
                    styles.optionNumber,
                    isCorrectOption && styles.optionNumberCorrect,
                    isWrongSelection && styles.optionNumberWrong,
                  ]}>
                    <Text style={styles.optionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                  {isCorrectOption ? <Icon name="checkmark-circle" size={21} color="#059669" /> : null}
                  {isWrongSelection ? <Icon name="close-circle" size={21} color="#DC2626" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {listenCount === 0 ? <Text style={styles.lockHint}>Эхлээд аудиог сонсоно уу.</Text> : null}

          {hasAnswered ? (
            <View style={[styles.feedbackCard, answerStatus ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={[styles.feedbackTitle, answerStatus ? styles.feedbackTitleCorrect : styles.feedbackTitleWrong]}>
                {answerStatus ? 'Зөв хариуллаа!' : 'Буруу хариуллаа'}
              </Text>
              <Text style={styles.transcriptLabel}>Сонсголын текст</Text>
              <Text style={styles.transcript}>{currentItem.speechText}</Text>
              <Text style={styles.explanation}>{currentItem.explanation}</Text>
              <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
                <Text style={styles.nextButtonText}>{currentIndex === session.length - 1 ? 'Үр дүн харах' : 'Дараагийн дасгал'}</Text>
                <Icon name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.notice}>
        <Icon name="information-circle-outline" size={18} color="#64748B" />
        <Text style={styles.noticeText}>Эдгээр нь TOPIK I хэв маягийн сургалтын дасгал бөгөөд албан ёсны шалгалтын аудио биш. Android-ийн Korean TTS хоолой ашиглана; хариулсны дараа transcript болон тайлбар нээгдэнэ.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },
  backButton: { borderRadius: 10, marginBottom: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 18, padding: 16, gap: 12, marginBottom: 18 },
  heroIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  heroBody: { flex: 1 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  heroDescription: { color: '#94A3B8', fontSize: 12, lineHeight: 17, marginTop: 3 },
  sectionLabel: { color: '#334155', fontSize: 13, fontWeight: '800', marginBottom: 9 },
  categoryList: { gap: 8, paddingBottom: 16 },
  categoryChip: { height: 40, borderRadius: 12, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  categoryChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  categoryChipText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  categoryChipTextActive: { color: '#fff' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { color: '#334155', fontSize: 13, fontWeight: '800' },
  progressScore: { color: '#059669', fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: '#EDE9FE', borderRadius: 999, overflow: 'hidden', marginBottom: 14 },
  progressFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 999 },
  audioCard: { backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', padding: 22, borderWidth: 1, borderColor: '#E2E8F0' },
  audioCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  audioTitle: { color: '#0F172A', fontSize: 15, fontWeight: '800', marginTop: 12 },
  audioHint: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  speedSelector: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 11, padding: 3, gap: 3, marginTop: 12 },
  speedButton: { minWidth: 78, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  speedButtonActive: { backgroundColor: '#DBEAFE' },
  speedButtonText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  speedButtonTextActive: { color: '#155DFC' },
  playButton: { height: 48, borderRadius: 14, backgroundColor: '#155DFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 8, marginTop: 14 },
  playButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  ttsError: { color: '#B91C1C', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 10 },
  question: { color: '#0F172A', fontSize: 16, lineHeight: 23, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  options: { gap: 8 },
  option: { minHeight: 54, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  optionLocked: { opacity: 0.55 },
  optionCorrect: { borderColor: '#6EE7B7', backgroundColor: '#ECFDF5' },
  optionWrong: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  optionNumber: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  optionNumberCorrect: { backgroundColor: '#A7F3D0' },
  optionNumberWrong: { backgroundColor: '#FECACA' },
  optionNumberText: { color: '#334155', fontSize: 12, fontWeight: '800' },
  optionText: { flex: 1, color: '#334155', fontSize: 14, lineHeight: 20 },
  lockHint: { color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 10 },
  feedbackCard: { borderRadius: 18, padding: 16, marginTop: 14, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  feedbackWrong: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  feedbackTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  feedbackTitleCorrect: { color: '#047857' },
  feedbackTitleWrong: { color: '#B91C1C' },
  transcriptLabel: { color: '#64748B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  transcript: { color: '#0F172A', fontSize: 16, lineHeight: 24, fontWeight: '700', marginTop: 4 },
  explanation: { color: '#475569', fontSize: 12, lineHeight: 19, marginTop: 9 },
  nextButton: { height: 46, borderRadius: 13, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  nextButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 22, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  summaryScore: { color: '#7C3AED', fontSize: 40, fontWeight: '900' },
  summaryText: { color: '#64748B', fontSize: 13, marginBottom: 8 },
  primaryButton: { alignSelf: 'stretch', height: 48, borderRadius: 14, backgroundColor: '#7C3AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondaryButton: { alignSelf: 'stretch', minHeight: 46, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 13, gap: 8, marginTop: 16 },
  noticeText: { flex: 1, color: '#64748B', fontSize: 11, lineHeight: 17 },
});

export default ListeningPracticeScreen;
