// features/exam/screens/LevelTestInterface.tsx
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Card } from '../../../shared/components/molecules/card';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSharedStore } from '../../../store/sharedStore';
import { useLevelTestStore } from './levelTestStore';

const { width: screenWidth } = Dimensions.get('window');

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface LevelTestResult {
  level: string;
  percentage: number;
  correctCount: number;
  levelValue: number;
}

interface LevelTestInterfaceProps {
  onComplete?: (result: LevelTestResult) => void;
}

// Түвшин тогтоох асуултууд
const levelTestQuestions: Question[] = [
  { id: 1, question: "가방이 _____ 있어요? (Цүнх хаана байна?)", options: ["어디에", "무엇에", "누구에", "언제에"], correctAnswer: 0 },
  { id: 2, question: "저는 학생_____ . (Би оюутан юм.)", options: ["이에요", "입니다", "예요", "있어요"], correctAnswer: 1 },
  { id: 3, question: "친구를 _____. (Найзтай уулзсан.)", options: ["만났어요", "만나요", "만날 거예요", "만나고 있어요"], correctAnswer: 0 },
  { id: 4, question: "내일 날씨가 _____. (Маргааш цаг агаар сайн байх.)", options: ["좋았어요", "좋아요", "좋을 거예요", "좋고 있어요"], correctAnswer: 2 },
  { id: 5, question: "저는 한국어를 _____ 싶어요. (Би солонгос хэл сурахыг хүсч байна.)", options: ["배우", "배우고", "배워", "배우면"], correctAnswer: 0 },
  { id: 6, question: "밥을 먹_____ 학교에 갔어요. (Хоол идээд сургууль явсан.)", options: ["고", "어서", "면서", "으니까"], correctAnswer: 0 },
  { id: 7, question: "시간이 _____니까 빨리 가세요. (Цаг байхгүй тул хурдан яв.)", options: ["없으", "없어", "없는", "없을"], correctAnswer: 0 },
  { id: 8, question: "책을 읽_____ 음악을 들었어요. (Ном уншаад хөгжим сонссон.)", options: ["고", "거나", "다가", "으면서"], correctAnswer: 3 },
  { id: 9, question: "한국어_____ 어렵지만 재미있어요. (Солонгос хэл хэцүү боловч сонирхолтой.)", options: ["는", "을", "이", "가"], correctAnswer: 0 },
  { id: 10, question: "친구_____ 같이 공부했어요. (Найзтайгаа хамт суралцсан.)", options: ["에", "와", "의", "로"], correctAnswer: 1 },
  { id: 11, question: "비가 _____ 우산을 가져가세요. (Бороо орж байгаа учраас шүхэр авч яв.)", options: ["오니까", "오면", "오는데", "오고"], correctAnswer: 0 },
  { id: 12, question: "저는 운동을 _____ 좋아해요. (Би дасгал хийх дуртай.)", options: ["하는 것을", "하는 거를", "하기를", "하고를"], correctAnswer: 2 },
  { id: 13, question: "커피_____ 차를 드시겠어요? (Кофе эсвэл цай уух уу?)", options: ["나", "이나", "하고", "랑"], correctAnswer: 1 },
  { id: 14, question: "숙제를 다 _____ 놀러 갈 거예요. (Даалгавраа бүгдийг нь хийгээд тоглож явна.)", options: ["하면", "해서", "한 후에", "하니까"], correctAnswer: 2 },
  { id: 15, question: "이 음식은 너무 _____ 못 먹겠어요. (Энэ хоол хэтэрхий халуун байгаа учраас идэж чадахгүй.)", options: ["뜨거워서", "뜨거우니까", "뜨거운데", "뜨거우면"], correctAnswer: 0 },
  { id: 16, question: "시간이 _____ 빨리 가야 돼요. (Цаг байхгүй тул хурдан явах ёстой.)", options: ["없어서", "없으니까", "없는데", "없으면"], correctAnswer: 0 },
  { id: 17, question: "한국에 _____ 지 3년이 됐어요. (Солонгост ирээд 3 жил болж байна.)", options: ["오", "온", "올", "와"], correctAnswer: 1 },
  { id: 18, question: "영화를 보_____ 울었어요. (Кино үзээд уйлсан.)", options: ["고", "다가", "면서", "니까"], correctAnswer: 1 },
  { id: 19, question: "아침에 일찍 _____ 피곤해요. (Өглөө эрт босоод ядарч байна.)", options: ["일어나서", "일어나니까", "일어나는데", "일어나면"], correctAnswer: 0 },
  { id: 20, question: "한국어를 잘 _____ 위해 열심히 공부해요. (Солонгос хэл сайн ярихын тулд шаргуу суралцдаг.)", options: ["하", "할", "하는", "한"], correctAnswer: 2 },
];

// Custom Progress компонент
const CustomProgress = ({ value, style }: { value: number; style?: any }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <View style={[styles.progressContainer, style]}>
      <View style={[styles.progressFill, { width: `${clampedValue}%` }]} />
    </View>
  );
};

export const LevelTestInterface: React.FC<LevelTestInterfaceProps> = ({ onComplete }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { saveResult } = useLevelTestStore();

  // Screen-с гарах үед timer-ыг цэвэрлэх
 useFocusEffect(
    React.useCallback(() => {
      // Шинэ шалгалт эхлэхэд бүх state-г цэвэрлэх
      setCurrentIndex(0);
      setAnswers({});
      setTimeLeft(15 * 60);
      setShowSubmitModal(false);
      
      // Timer эхлүүлэх
      startTimer();
      
      return () => {
        // Screen-с гарах үед timer-ыг цэвэрлэх
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [])
  );


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

  // Route params-с onComplete авах
  useEffect(() => {
    const params = route.params as any;
    if (params?.onComplete) {
      // @ts-ignore
      onComplete = params.onComplete;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [route.params]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [levelTestQuestions[currentIndex].id]: answerIndex,
    }));
  };

  const calculateLevel = (percentage: number): string => {
    if (percentage >= 90) return "TOPIK II - 5-6-р түвшин";
    if (percentage >= 75) return "TOPIK II - 3-4-р түвшин";
    if (percentage >= 60) return "TOPIK I - 2-р түвшин";
    if (percentage >= 40) return "TOPIK I - 1-р түвшин";
    return "Анхан шат";
  };

  const getLevelValue = (level: string): number => {
    if (level.includes('6-р')) return 6;
    if (level.includes('5-р')) return 5;
    if (level.includes('4-р')) return 4;
    if (level.includes('3-р')) return 3;
    if (level.includes('2-р')) return 2;
    if (level.includes('1-р')) return 1;
    return 0;
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    let correctCount = 0;
    levelTestQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });

    const percentage = (correctCount / levelTestQuestions.length) * 100;
    const level = calculateLevel(percentage);
    const levelValue = getLevelValue(level);

    const result = {
      level,
      levelValue,
      percentage: Math.round(percentage),
      correctCount,
      totalQuestions: levelTestQuestions.length,
      answers,
    };

    // Үр дүнг store-д хадгалах
    saveResult(result);

    Alert.alert(
      "Түвшин тогтооллоо",
      `Таны түвшин: ${level}\n${correctCount}/${levelTestQuestions.length} зөв хариулт (${Math.round(percentage)}%)`,
      [
        { 
          text: "OK", 
          onPress: async () => {
            await AsyncStorage.setItem('user_level', levelValue.toString());
            await AsyncStorage.setItem('user_level_name', level);
            
            const { user, updateUser } = useSharedStore.getState();
            if (user) {
              updateUser({ ...user, level: levelValue, levelName: level });
            }
            
            navigation.goBack();
          } 
        }
      ]
    );
  };

  const currentQuestion = levelTestQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / levelTestQuestions.length) * 100;

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Түвшин тогтоох шалгалт</Text>
            <Text style={styles.questionCount}>
              Асуулт {currentIndex + 1} / {levelTestQuestions.length}
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
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Card>

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

        <Card style={styles.questionStatusCard}>
          <Text style={styles.questionStatusTitle}>Асуултын төлөв:</Text>
          <View style={styles.questionGrid}>
            {levelTestQuestions.map((q, index) => {
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

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>Өмнөх</Text>
        </TouchableOpacity>
        
        {currentIndex === levelTestQuestions.length - 1 ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setShowSubmitModal(true)}
          >
            <Text style={styles.submitButtonText}>Дуусгах</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentIndex(prev => Math.min(levelTestQuestions.length - 1, prev + 1))}
          >
            <Text style={styles.navButtonText}>Дараах</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Шалгалт дуусгах уу?</Text>
            <Text style={styles.modalText}>
              Та {answeredCount}/{levelTestQuestions.length} асуултад хариулсан байна.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.modalCancelText}>Үргэлжлүүлэх</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleSubmit}>
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
  navButton: { flex: 1, backgroundColor: '#e5e7eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  navButtonText: { fontSize: 16, fontWeight: '500', color: '#374151' },
  disabledButton: { opacity: 0.5 },
  submitButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
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