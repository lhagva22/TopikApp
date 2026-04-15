// features/exam/screens/ExamInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../../shared/components/molecules/card';
import Icon from 'react-native-vector-icons/Ionicons';
import { useProgress } from '../../../store/ProgressContext';
import { useSharedStore } from '../../../store/sharedStore';

const { width: screenWidth } = Dimensions.get('window');

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  section: string;
}

interface ExamInterfaceProps {
  examTitle: string;
  examType: 'TOPIK I' | 'TOPIK II';
  duration: number;
  onComplete: () => void;
}

// Custom Progress компонент
const CustomProgress = ({ value, style }: { value: number; style?: any }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <View style={[styles.progressContainer, style]}>
      <View style={[styles.progressFill, { width: `${clampedValue}%` }]} />
    </View>
  );
};

// Mock questions generation
const generateMockQuestions = (type: 'TOPIK I' | 'TOPIK II'): Question[] => {
  const questions: Question[] = [];
  
  if (type === 'TOPIK I') {
    for (let i = 1; i <= 30; i++) {
      questions.push({
        id: i,
        question: `Сонсгол асуулт ${i}: Дараах яриаг сонсоод зөв хариултыг сонгоно уу?`,
        options: ["① 학교에 갑니다", "② 집에 갑니다", "③ 병원에 갑니다", "④ 회사에 갑니다"],
        correctAnswer: Math.floor(Math.random() * 4),
        section: "Сонсгол",
      });
    }
    for (let i = 31; i <= 70; i++) {
      questions.push({
        id: i,
        question: `Уншлага асуулт ${i - 30}: Дараах өгүүлбэрийг уншаад зөв хариултыг сонгоно уу?`,
        options: ["① 친구를 만났어요", "② 영화를 봤어요", "③ 밥을 먹었어요", "④ 책을 읽었어요"],
        correctAnswer: Math.floor(Math.random() * 4),
        section: "Уншлага",
      });
    }
  } else {
    for (let i = 1; i <= 50; i++) {
      questions.push({
        id: i,
        question: `Сонсгол асуулт ${i}: Дараах яриаг сонсоод зөв хариултыг сонгоно уу?`,
        options: ["① 가", "② 나", "③ 다", "④ 라"],
        correctAnswer: Math.floor(Math.random() * 4),
        section: "Сонсгол",
      });
    }
    for (let i = 51; i <= 100; i++) {
      questions.push({
        id: i,
        question: `Уншлага асуулт ${i - 50}: Дараах текстийг уншаад зөв хариултыг сонгоно уу?`,
        options: ["① 가", "② 나", "③ 다", "④ 라"],
        correctAnswer: Math.floor(Math.random() * 4),
        section: "Уншлага",
      });
    }
  }
  
  return questions;
};

const calculateLevel = (score: number, type: 'TOPIK I' | 'TOPIK II'): string => {
  if (type === 'TOPIK I') {
    if (score >= 140) return "2-р түвшин";
    if (score >= 80) return "1-р түвшин";
    return "Түвшин хүрээгүй";
  } else {
    if (score >= 230) return "6-р түвшин";
    if (score >= 190) return "5-р түвшин";
    if (score >= 150) return "4-р түвшин";
    if (score >= 120) return "3-р түвшин";
    return "Түвшин хүрээгүй";
  }
};

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  examTitle,
  examType,
  duration,
  onComplete,
}) => {
  const navigation = useNavigation<any>();
  const { addExamResult } = useProgress();
  const { user } = useSharedStore();
  const [questions] = useState(() => generateMockQuestions(examType));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentIndex].id]: answerIndex,
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Calculate scores
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });

    const sections = examType === 'TOPIK I' 
      ? [
          { name: "Сонсгол", start: 0, end: 30, maxScore: 100 },
          { name: "Уншлага", start: 30, end: 70, maxScore: 100 },
        ]
      : [
          { name: "Сонсгол", start: 0, end: 50, maxScore: 100 },
          { name: "Уншлага", start: 50, end: 100, maxScore: 100 },
        ];

    const sectionResults = sections.map((section) => {
      const sectionQuestions = questions.slice(section.start, section.end);
      const sectionCorrect = sectionQuestions.filter(
        (q) => answers[q.id] === q.correctAnswer
      ).length;
      
      return {
        name: section.name,
        score: Math.round((sectionCorrect / sectionQuestions.length) * section.maxScore),
        maxScore: section.maxScore,
        correctAnswers: sectionCorrect,
        totalQuestions: sectionQuestions.length,
      };
    });

    const totalScore = sectionResults.reduce((sum, s) => sum + s.score, 0);
    const maxScore = sectionResults.reduce((sum, s) => sum + s.maxScore, 0);
    const percentage = (totalScore / maxScore) * 100;

    const result = {
      id: Date.now().toString(),
      examTitle,
      examType,
      date: new Date(),
      totalScore: Math.round(percentage),
      maxScore: 100,
      sections: sectionResults,
      duration: duration * 60 - timeLeft,
      level: calculateLevel(totalScore, examType),
    };

    addExamResult(result);
    
    Alert.alert(
        "Шалгалт дууслаа",
        `Таны дүн: ${Math.round(percentage)}%`,
        [
            { 
                text: "OK", 
                onPress: () => {
                    onComplete();
                    // navigation.goBack() биш
                    navigation.replace('Exam');  // Exam screen руу шилжих
          } 
        }
      ]
    );
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{examTitle}</Text>
            <Text style={styles.questionCount}>
              Асуулт {currentIndex + 1} / {questions.length}
            </Text>
          </View>
          <View style={styles.timerContainer}>
            <Icon name="time-outline" size={20} color="#dc2626" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>
        <CustomProgress value={progress} style={styles.progressBar} />
      </Card>

      <ScrollView style={styles.content}>
        {/* Question */}
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Card>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionButton,
                answers[currentQuestion.id] === idx && styles.optionSelected,
              ]}
              onPress={() => handleAnswer(idx)}
            >
              <Text style={[styles.optionText, answers[currentQuestion.id] === idx && styles.optionTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Question Grid */}
        <Card style={styles.questionStatusCard}>
          <Text style={styles.questionStatusTitle}>Асуултын төлөв:</Text>
          <View style={styles.questionGrid}>
            {questions.map((q, index) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = index === currentIndex;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.questionButton,
                    isCurrent && styles.questionButtonCurrent,
                    isAnswered && !isCurrent && styles.questionButtonAnswered,
                    !isAnswered && !isCurrent && styles.questionButtonUnanswered,
                  ]}
                  onPress={() => goToQuestion(index)}
                >
                  <Text style={[
                    styles.questionButtonText,
                    isCurrent && styles.questionButtonTextCurrent,
                    isAnswered && !isCurrent && styles.questionButtonTextAnswered,
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <Icon name="chevron-back" size={20} color="#374151" />
          <Text style={styles.navButtonText}>Өмнөх</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => setShowSubmitModal(true)}
        >
          <Icon name="flag-outline" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Дуусгах</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentIndex === questions.length - 1 && styles.disabledButton]}
          onPress={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          <Text style={styles.navButtonText}>Дараах</Text>
          <Icon name="chevron-forward" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Submit Modal */}
      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Шалгалт дуусгах уу?</Text>
            <Text style={styles.modalText}>
              Та {answeredCount}/{questions.length} асуултад хариулсан байна.
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
              >
                <Text style={styles.modalConfirmText}>Дуусгах</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerCard: { margin: 16, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  questionCount: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },
  progressBar: { height: 6, marginTop: 8 },
  progressContainer: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 16 },
  questionCard: { padding: 24, marginBottom: 24 },
  questionText: { fontSize: 18, color: '#374151', lineHeight: 28 },
  optionsContainer: { gap: 12, marginBottom: 24 },
  optionButton: { padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  optionSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 16, color: '#374151' },
  optionTextSelected: { color: '#2563eb', fontWeight: '500' },
  questionStatusCard: { padding: 16, marginBottom: 24 },
  questionStatusTitle: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 },
  questionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  questionButton: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  questionButtonCurrent: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  questionButtonAnswered: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  questionButtonUnanswered: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
  questionButtonText: { fontSize: 12, fontWeight: '500' },
  questionButtonTextCurrent: { color: '#fff' },
  questionButtonTextAnswered: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', paddingVertical: 12, borderRadius: 8, gap: 4 },
  navButtonText: { fontSize: 16, fontWeight: '500', color: '#374151' },
  disabledButton: { opacity: 0.5 },
  submitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, gap: 4 },
  submitButtonText: { fontSize: 16, fontWeight: '500', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: screenWidth - 48, padding: 24, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#111827' },
  modalText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelButton: { flex: 1, backgroundColor: '#e5e7eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '500', color: '#374151' },
  modalConfirmButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalConfirmText: { fontSize: 16, fontWeight: '500', color: '#fff' },
});