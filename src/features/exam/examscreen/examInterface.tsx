// src/features/exam/screens/ExamInterface.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { examApi } from '../api/examApi';

const { width: screenWidth } = Dimensions.get('window');

interface Question {
  id: string;
  section: string;
  question_number: number;
  question_text: string;
  options: string[];
  audio_url?: string;
}

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={[styles.progressFill, { width: `${progress}%` }]} />
  </View>
);

export const ExamInterface = () => {
  const route = useRoute();
  const navigation = useNavigation<any>(); // ✅ any ашиглах
  const params = route.params as any;
  
  const examId = params?.examId;
  const examTitle = params?.examTitle || 'TOPIK Шалгалт';
  const examType = params?.examType || 'TOPIK_I';
  const duration = params?.duration || 100;
  const initialQuestions = params?.questions || [];
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start exam function - шинэ session үүсгэх
  const startExam = useCallback(async () => {
    console.log('🚀 startExam called, examId:', examId);
    
    setHasSubmitted(false);
    setAnswers({});
    setCurrentQuestion(0);
    
    if (!examId) {
      setError('Шалгалтын ID олдсонгүй');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📤 Calling API: startExam with ID:', examId);
      
      const response = await examApi.startExam(examId);
      
      console.log('📥 Start exam response success:', response.success);
      
      if (response.success && response.session) {
        const newSessionId = response.session.id;
        console.log('✅ New session created:', newSessionId);
        
        setSessionId(newSessionId);
        await AsyncStorage.setItem('current_exam_session', newSessionId);
        console.log('💾 Session saved to storage');
        
        if (response.questions && response.questions.length > 0) {
          setQuestions(response.questions);
        }
        if (response.test?.duration) {
          setTimeLeft(response.test.duration * 60);
        }
      } else if (!response.success) {
        setError(response.error || 'Шалгалт эхлүүлэхэд алдаа гарлаа');
      }
    } catch (err) {
      console.error('Start exam error:', err);
      setError('Серверт холбогдоход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  // Component mount үед шинэ session үүсгэх
  useEffect(() => {
    const initExam = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 ExamInterface mounted');
      console.log('📌 examId:', examId);
      console.log('📌 initialQuestions length:', initialQuestions.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (!examId) {
        setError('Шалгалтын ID олдсонгүй');
        setLoading(false);
        return;
      }
      
      // Хуучин session-ийг цэвэрлэх
      const oldSession = await AsyncStorage.getItem('current_exam_session');
      if (oldSession) {
        console.log('🧹 Clearing old session:', oldSession);
        await AsyncStorage.removeItem('current_exam_session');
      }
      
      // Шинэ session үүсгэх
      console.log('🚀 Creating new session');
      await startExam();
    };
    
    initExam();
  }, [examId]);

  // Timer
  useEffect(() => {
    if (!sessionId || questions.length === 0 || loading || hasSubmitted) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, questions.length, loading, hasSubmitted]);

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

// src/features/exam/screens/ExamInterface.tsx - handleSubmit функц

const handleSubmit = async () => {
  console.log('🔍 Submit button pressed');
  console.log('🔍 Current sessionId state:', sessionId);
  
  if (hasSubmitted || isSubmitting) {
    console.log('⏳ Already submitting, ignoring...');
    return;
  }
  
  let currentSessionId = sessionId;
  
  if (!currentSessionId) {
    currentSessionId = await AsyncStorage.getItem('current_exam_session');
    if (currentSessionId) {
      setSessionId(currentSessionId);
    }
  }
  
  if (!currentSessionId) {
    Alert.alert('Алдаа', 'Шалгалтын session олдсонгүй. Дахин оролдоно уу.');
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
    
    console.log('📥 Submit exam response success:', result.success);
    
    await AsyncStorage.removeItem('current_exam_session');
    setSessionId(null);
    
    if (result.success && 'result' in result) {
      Alert.alert(
        'Шалгалт дууслаа',
        `Та ${result.result.score}/${result.result.totalQuestions} оноо авлаа.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // ✅ Home screen руу шууд очих
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });// replace ашиглах нь илүү цэвэр
            } 
          }
        ]
      );
    } else if (!result.success && 'error' in result) {
      Alert.alert('Алдаа', result.error || 'Шалгалт дуусгахад алдаа гарлаа');
      setHasSubmitted(false);
    }
  } catch (err) {
    console.error('Submit exam error:', err);
    Alert.alert('Алдаа', 'Серверт холбогдоход алдаа гарлаа');
    setHasSubmitted(false);
  } finally {
    setIsSubmitting(false);
    setShowSubmitModal(false);
  }
};
  const handleAutoSubmit = () => {
    if (hasSubmitted) return;
    Alert.alert(
      'Хугацаа дууссан',
      'Шалгалтын хугацаа дууссан тул автоматаар дуусгаж байна.',
      [{ text: 'OK', onPress: handleSubmit }]
    );
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const currentQ = questions[currentQuestion];

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#155DFC" />
        <Text style={styles.loadingText}>Шалгалт бэлтгэж байна...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={startExam}>
          <Text style={styles.retryButtonText}>Дахин оролдох</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No questions
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
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
        <Text style={styles.progressText}>{answeredCount}/{questions.length} хариулсан</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQ?.question_text}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQ?.options.map((option, index) => {
            const isSelected = answers[currentQ.id] === option;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, isSelected && styles.optionSelected]}
                onPress={() => handleAnswerSelect(option)}
                disabled={hasSubmitted}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
                {isSelected && (
                  <Icon name="checkmark-circle" size={20} color="#fff" />
                )}
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
              {'\n'}Шалгалтыг дуусгахдаа итгэлтэй байна уу?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.modalCancelText}>Үргэлжлүүлэх</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSubmit}
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
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  questionText: { fontSize: 18, lineHeight: 28, color: '#333' },
  optionsContainer: { gap: 12, marginBottom: 20 },
  optionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#E5E7EB' },
  optionSelected: { borderColor: '#155DFC', backgroundColor: '#EFF6FF' },
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