import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video/lib/index';
import type { VideoRef } from 'react-native-video';

import { useAppStore } from '../../../app/store';
import { resolveApiAssetUrl } from '../../../core/api/apiClient';
import { InlineMessage } from '../../../shared/components/feedback';
import { getErrorMessage, logError } from '../../../shared/lib/errors';
import { authApi } from '../../auth/api/authApi';
import { examApi } from '../api/examApi';
import type { ExamProgressBarProps, Question } from './types';

const { width: screenWidth } = Dimensions.get('window');

const ProgressBar = ({ progress }: ExamProgressBarProps) => (
  <View style={styles.progressContainer}>
    <View style={[styles.progressFill, { width: `${progress}%` }]} />
  </View>
);

export const ExamInterface = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params ?? {};

  const examId = params.examId;
  const initialSessionId = params.sessionId ?? null;
  const examTitle = params.examTitle || 'TOPIK Шалгалт';
  const duration = params.duration || 100;
  const initialQuestions = useMemo(() => params.questions ?? [], [params.questions]);
  const isLevelTest = Boolean(params.isLevelTest);
  const { updateUser } = useAppStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [audioPaused, setAudioPaused] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<VideoRef | null>(null);
  const allowExitRef = useRef(false);

  const stopAudioPlayback = useCallback((resetPosition = false, syncState = true) => {
    if (syncState) {
      setAudioPaused(true);
      setAudioError(null);
    }

    const player = audioPlayerRef.current;

    if (!player) {
      return;
    }

    try {
      player.pause();
    } catch {
      return;
    }

    try {
      player.dismissFullscreenPlayer();
    } catch {
      // Fullscreen audio controls may not be active.
    }

    if (resetPosition) {
      try {
        player.seek(0);
      } catch {
        // Ignore seek failures during cleanup.
      }
    }
  }, []);

  const syncProfile = useCallback(async () => {
    const response = await authApi.getProfile();

    if (response.success && response.user) {
      updateUser(response.user);
    }
  }, [updateUser]);

  const exitExam = useCallback(
    async (action?: any) => {
      allowExitRef.current = true;
      stopAudioPlayback(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await AsyncStorage.removeItem('current_exam_session');
      setSessionId(null);

      if (action) {
        navigation.dispatch(action);
        return;
      }

      navigation.goBack();
    },
    [navigation, stopAudioPlayback],
  );

  const requestExitExam = useCallback(
    (action?: any) => {
      const shouldConfirm = !loading && !hasSubmitted && !isSubmitting && Boolean(sessionId);

      if (!shouldConfirm) {
        exitExam(action).catch(() => undefined);
        return;
      }

      Alert.alert('Шалгалтаас гарах уу?', 'Гарвал энэ оролдлого дуусч, буцаад үргэлжлүүлэхгүй.', [
        { text: 'Үлдэх', style: 'cancel' },
        {
          text: 'Гарах',
          style: 'destructive',
          onPress: () => {
            exitExam(action).catch(() => undefined);
          },
        },
      ]);
    },
    [exitExam, hasSubmitted, isSubmitting, loading, sessionId],
  );

  const startExam = useCallback(async () => {
    setHasSubmitted(false);
    setAnswers({});
    setCurrentQuestion(0);
    setSubmissionError(null);
    stopAudioPlayback(true);

    if (!examId) {
      setError('Шалгалтын ID олдсонгүй.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await examApi.startExam(examId);

      if (response.success && response.session) {
        const newSessionId = response.session.id;

        setSessionId(newSessionId);
        await AsyncStorage.setItem('current_exam_session', newSessionId);

        if (response.questions && response.questions.length > 0) {
          setQuestions(response.questions);
        }

        if (response.test?.duration) {
          setTimeLeft(response.test.duration * 60);
        }
        return;
      }

      setError(getErrorMessage(response, 'Шалгалт эхлүүлэхэд алдаа гарлаа.'));
    } catch (err) {
      logError('Start exam error', err);
      setError(getErrorMessage(err, 'Серверт холбогдоход алдаа гарлаа.'));
    } finally {
      setLoading(false);
    }
  }, [examId, stopAudioPlayback]);

  useEffect(() => {
    const initExam = async () => {
      setAnswers({});
      setCurrentQuestion(0);
      setShowSubmitModal(false);
      setSubmissionError(null);
      setError(null);
      setHasSubmitted(false);
      stopAudioPlayback(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (!examId) {
        setError('Шалгалтын ID олдсонгүй.');
        setLoading(false);
        return;
      }

      const oldSession = await AsyncStorage.getItem('current_exam_session');
      if (oldSession) {
        await AsyncStorage.removeItem('current_exam_session');
      }

      if (initialSessionId && initialQuestions.length > 0) {
        setSessionId(initialSessionId);
        setQuestions(initialQuestions);
        setTimeLeft(duration * 60);
        await AsyncStorage.setItem('current_exam_session', initialSessionId);
        setLoading(false);
        return;
      }

      await startExam();
    };

    void initExam();
  }, [duration, examId, initialQuestions, initialSessionId, startExam, stopAudioPlayback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerText: string) => {
    if (hasSubmitted) return;
    const currentQ = questions[currentQuestion];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: answerText,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (hasSubmitted || isSubmitting) {
      return;
    }

    stopAudioPlayback(true);
    let currentSessionId = sessionId;
    setSubmissionError(null);

    if (!currentSessionId) {
      currentSessionId = await AsyncStorage.getItem('current_exam_session');
      if (currentSessionId) {
        setSessionId(currentSessionId);
      }
    }

    if (!currentSessionId) {
      setSubmissionError('Шалгалтын session олдсонгүй. Дахин оролдоно уу.');
      return;
    }

    setHasSubmitted(true);
    setIsSubmitting(true);

    try {
      const answerList = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const timeSpent = duration * 60 - timeLeft;
      const result = isLevelTest
        ? await examApi.submitLevelTest(currentSessionId, answerList, timeSpent)
        : await examApi.submitExam(currentSessionId, answerList, timeSpent);

      await AsyncStorage.removeItem('current_exam_session');
      setSessionId(null);

      if (result.success && 'result' in result) {
        if (isLevelTest) {
          await syncProfile();
        }

        navigation.navigate('ExamResultScreen', {
          ...result.result,
          examTitle,
          isLevelTest,
          currentExamType: params.examType,
          nextLevelTest: 'nextLevelTest' in result ? result.nextLevelTest : undefined,
        });
        return;
      }

      setSubmissionError(getErrorMessage(result, 'Шалгалт дуусгахад алдаа гарлаа.'));
      setHasSubmitted(false);
    } catch (err) {
      logError('Submit exam error', err);
      setSubmissionError(getErrorMessage(err, 'Серверт холбогдоход алдаа гарлаа.'));
      setHasSubmitted(false);
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  }, [
    answers,
    duration,
    examTitle,
    hasSubmitted,
    isSubmitting,
    isLevelTest,
    navigation,
    params.examType,
    sessionId,
    syncProfile,
    stopAudioPlayback,
    timeLeft,
  ]);

  const handleAutoSubmit = useCallback(() => {
    if (hasSubmitted) return;
    stopAudioPlayback(true);
    Alert.alert('Хугацаа дууссан', 'Шалгалтын хугацаа дууссан тул автоматаар дуусгаж байна.', [
      { text: 'OK', onPress: () => void handleSubmit() },
    ]);
  }, [handleSubmit, hasSubmitted, stopAudioPlayback]);

  useEffect(() => {
    if (!sessionId || questions.length === 0 || loading || hasSubmitted) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          handleAutoSubmit();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId, questions.length, loading, hasSubmitted, handleAutoSubmit]);

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const currentQ = questions[currentQuestion];
  const currentAudioUrl = resolveApiAssetUrl(currentQ?.audio_url);
  const currentQuestionImageUrl = resolveApiAssetUrl(currentQ?.question_image_url);

  useEffect(() => {
    stopAudioPlayback(false);
  }, [currentQ?.id, stopAudioPlayback]);

  useEffect(() => {
    if (showSubmitModal || hasSubmitted) {
      stopAudioPlayback(hasSubmitted);
    }
  }, [showSubmitModal, hasSubmitted, stopAudioPlayback]);

  useEffect(() => () => {
    stopAudioPlayback(true, false);
  }, [stopAudioPlayback]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopAudioPlayback(true);
      };
    }, [stopAudioPlayback]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (allowExitRef.current) {
        allowExitRef.current = false;
        return;
      }

      const shouldConfirm = !loading && !hasSubmitted && !isSubmitting && Boolean(sessionId);
      if (!shouldConfirm) {
        stopAudioPlayback(true);
        return;
      }

      event.preventDefault();
      requestExitExam(event.data.action);
    });

    return unsubscribe;
  }, [navigation, hasSubmitted, isSubmitting, loading, requestExitExam, sessionId, stopAudioPlayback]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#155DFC" />
        <Text style={styles.loadingText}>Шалгалт бэлтгэж байна...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void startExam()}>
          <Text style={styles.retryButtonText}>Дахин оролдох</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            requestExitExam();
          }}
        >
          <Text style={styles.backButtonText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#155DFC" />
        <Text style={styles.loadingText}>Асуултуудыг ачаалж байна...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            requestExitExam();
          }}
          style={styles.backButtonHeader}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {examTitle}
          </Text>
          <Text style={styles.headerSubtitle}>
            Асуулт {currentQuestion + 1} / {questions.length}
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <Icon name="time-outline" size={20} color="#EF4444" />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={progressPercent} />
        <Text style={styles.progressText}>
          {answeredCount}/{questions.length} хариулсан
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <InlineMessage message={submissionError} containerStyle={styles.message} />

        {currentAudioUrl ? (
          <View style={styles.audioCard}>
            <View style={styles.audioHeaderRow}>
              <View style={styles.audioTextWrap}>
                <Text style={styles.audioTitle}>Сонсголын аудио</Text>
                <Text style={styles.audioSubtitle}>Play дарж дуугаа эхлүүлээд, шаардлагатай бол seek хийнэ.</Text>
              </View>

              <TouchableOpacity
                style={styles.audioToggleButton}
                onPress={() => {
                  setAudioPaused((prev) => !prev);
                  setAudioError(null);
                }}
              >
                <Icon name={audioPaused ? 'play' : 'pause'} size={18} color="#fff" />
                <Text style={styles.audioToggleText}>{audioPaused ? 'Play' : 'Pause'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.audioPlayerWrap}>
              {!hasSubmitted ? (
                <Video
                  ref={audioPlayerRef}
                  source={{ uri: currentAudioUrl }}
                  style={styles.audioPlayer}
                  controls={true}
                  paused={audioPaused}
                  playInBackground={false}
                  onEnd={() => stopAudioPlayback(true)}
                  onError={() => {
                    setAudioError('Аудио ачааллах үед алдаа гарлаа.');
                    setAudioPaused(true);
                  }}
                />
              ) : null}
            </View>

            {audioError ? <Text style={styles.audioErrorText}>{audioError}</Text> : null}
          </View>
        ) : null}

        <View style={styles.questionCard}>
          {currentQuestionImageUrl ? (
            <Image
              source={{ uri: currentQuestionImageUrl }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.questionText}>{currentQ?.question_text}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQ?.options.map((option, index) => {
            const isSelected = answers[currentQ.id] === option;
            const optionImageUrl = resolveApiAssetUrl(currentQ?.option_image_urls?.[index] ?? null);
            return (
              <TouchableOpacity
                key={`${currentQ.id}-${index}`}
                style={[styles.optionButton, isSelected && styles.optionSelected]}
                onPress={() => handleAnswerSelect(option)}
                disabled={hasSubmitted}
              >
                <View style={styles.optionContent}>
                  {optionImageUrl ? (
                    <Image
                      source={{ uri: optionImageUrl }}
                      style={styles.optionImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
                </View>
                {isSelected && <Icon name="checkmark-circle" size={20} color="#155DFC" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.gridCard}>
          <Text style={styles.gridTitle}>Асуултын төлөв:</Text>
          <View style={styles.questionGrid}>
            {questions.map((q, index) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = index === currentQuestion;

              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.gridButton,
                    isCurrent && styles.gridButtonCurrent,
                    isAnswered && !isCurrent && styles.gridButtonAnswered,
                    !isAnswered && !isCurrent && styles.gridButtonUnanswered,
                  ]}
                  onPress={() => setCurrentQuestion(index)}
                  disabled={hasSubmitted}
                >
                  <Text
                    style={[
                      styles.gridButtonText,
                      isCurrent && styles.gridButtonTextCurrent,
                      isAnswered && !isCurrent && styles.gridButtonTextAnswered,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestion === 0 && styles.disabledButton]}
          onPress={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0 || hasSubmitted}
        >
          <Icon name="chevron-back" size={20} color="#fff" />
          <Text style={styles.navButtonText}>Өмнөх</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => setShowSubmitModal(true)}
          disabled={isSubmitting || hasSubmitted}
        >
          <Icon name="flag-outline" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Дуусгах</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentQuestion === questions.length - 1 && styles.disabledButton]}
          onPress={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
          disabled={currentQuestion === questions.length - 1 || hasSubmitted}
        >
          <Text style={styles.navButtonText}>Дараах</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Icon name="alert-circle-outline" size={48} color="#F59E0B" />
            <Text style={styles.modalTitle}>Шалгалт дуусгах уу?</Text>
            <Text style={styles.modalText}>
              Та {answeredCount}/{questions.length} асуултад хариулсан байна.
              {'\n'}Шалгалтыг дуусгахад итгэлтэй байна уу?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.modalCancelText}>Үргэлжлүүлэх</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => void handleSubmit()}
                disabled={isSubmitting || hasSubmitted}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Дуусгах</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24, gap: 12 },
  loadingText: { fontSize: 14, color: '#64748B' },
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  retryButton: { backgroundColor: '#155DFC', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9' },
  backButtonText: { color: '#64748B', fontSize: 15, fontWeight: '600' },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButtonHeader: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, gap: 4 },
  timerText: { fontSize: 14, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },

  /* Progress */
  progressWrapper: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  progressContainer: { height: 7, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#155DFC', borderRadius: 4 },
  progressText: { fontSize: 11, color: '#94A3B8', marginTop: 6, textAlign: 'right', fontWeight: '500' },

  content: { flex: 1, padding: 14 },
  message: { marginBottom: 12 },

  /* Audio */
  audioCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  audioHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  audioTextWrap: { flex: 1 },
  audioTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  audioSubtitle: { marginTop: 3, fontSize: 11, lineHeight: 16, color: '#94A3B8' },
  audioToggleButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#155DFC', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  audioToggleText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  audioPlayerWrap: { height: 52, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A' },
  audioPlayer: { width: '100%', height: '100%' },
  audioErrorText: { marginTop: 8, fontSize: 12, color: '#EF4444' },

  /* Question */
  questionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  questionImage: { width: '100%', height: 220, marginBottom: 16, borderRadius: 12, backgroundColor: '#F8FAFC' },
  questionText: { fontSize: 17, lineHeight: 28, color: '#1E293B', fontWeight: '500' },

  /* Options */
  optionsContainer: { gap: 10, marginBottom: 16 },
  optionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#E2E8F0', gap: 12 },
  optionSelected: { borderColor: '#155DFC', backgroundColor: '#EFF6FF' },
  optionContent: { flex: 1 },
  optionImage: { width: '100%', aspectRatio: 1.5, borderRadius: 10, marginBottom: 12, backgroundColor: '#E2E8F0' },
  optionText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 },
  optionTextSelected: { color: '#155DFC', fontWeight: '600' },

  /* Grid */
  gridCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  gridTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  questionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridButton: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  gridButtonCurrent: { backgroundColor: '#155DFC', borderColor: '#155DFC' },
  gridButtonAnswered: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  gridButtonUnanswered: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  gridButtonText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  gridButtonTextCurrent: { color: '#fff' },
  gridButtonTextAnswered: { color: '#fff' },

  /* Footer */
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 10 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', paddingVertical: 13, borderRadius: 12, gap: 4 },
  navButtonText: { color: '#155DFC', fontSize: 15, fontWeight: '700' },
  disabledButton: { backgroundColor: '#F1F5F9', opacity: 0.6 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, gap: 6 },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', width: screenWidth - 48 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 14, marginBottom: 8, letterSpacing: -0.3 },
  modalText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancelButton: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontSize: 15, fontWeight: '700' },
  modalConfirmButton: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ExamInterface;
