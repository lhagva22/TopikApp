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

import { resolveApiAssetUrl } from '../../../core/api/apiClient';
import { InlineMessage } from '../../../shared/components/feedback';
import { getErrorMessage, logError } from '../../../shared/lib/errors';
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
      const result = await examApi.submitExam(currentSessionId, answerList, timeSpent);

      await AsyncStorage.removeItem('current_exam_session');
      setSessionId(null);

      if (result.success && 'result' in result) {
        navigation.navigate('ExamResultScreen', {
          ...result.result,
          examTitle,
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
    navigation,
    sessionId,
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  errorText: { marginTop: 12, fontSize: 16, color: '#EF4444', textAlign: 'center' },
  retryButton: { marginTop: 20, backgroundColor: '#155DFC', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backButtonText: { color: '#666', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButtonHeader: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  timerText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  progressWrapper: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  progressContainer: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#155DFC', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#6B7280', marginTop: 8, textAlign: 'right' },
  content: { flex: 1, padding: 16 },
  message: { marginBottom: 16 },
  audioCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  audioHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  audioTextWrap: { flex: 1 },
  audioTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  audioSubtitle: { marginTop: 4, fontSize: 12, lineHeight: 18, color: '#6B7280' },
  audioToggleButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#155DFC', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  audioToggleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  audioPlayerWrap: { height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A' },
  audioPlayer: { width: '100%', height: '100%' },
  audioErrorText: { marginTop: 10, fontSize: 13, color: '#EF4444' },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  questionImage: { width: '100%', height: 240, marginBottom: 16, borderRadius: 12, backgroundColor: '#F8FAFC' },
  questionText: { fontSize: 18, lineHeight: 28, color: '#333' },
  optionsContainer: { gap: 12, marginBottom: 20 },
  optionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#E5E7EB', gap: 12 },
  optionSelected: { borderColor: '#155DFC', backgroundColor: '#EFF6FF' },
  optionContent: { flex: 1 },
  optionImage: { width: '100%', aspectRatio: 1.5, borderRadius: 10, marginBottom: 12, backgroundColor: '#E5E7EB' },
  optionText: { flex: 1, fontSize: 16, color: '#374151' },
  optionTextSelected: { color: '#155DFC', fontWeight: '500' },
  gridCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  gridTitle: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 },
  questionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridButton: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  gridButtonCurrent: { backgroundColor: '#155DFC', borderColor: '#155DFC' },
  gridButtonAnswered: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  gridButtonUnanswered: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  gridButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  gridButtonTextCurrent: { color: '#fff' },
  gridButtonTextAnswered: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#155DFC', paddingVertical: 12, borderRadius: 8, gap: 4 },
  navButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  disabledButton: { backgroundColor: '#9CA3AF', opacity: 0.5 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, gap: 6 },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', width: screenWidth - 48 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16, marginBottom: 8 },
  modalText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelButton: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: '#6B7280', fontSize: 16, fontWeight: '500' },
  modalConfirmButton: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ExamInterface;
