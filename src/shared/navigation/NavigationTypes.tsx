// src/shared/navigation/types.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Signin: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Video: undefined;
  Lesson: undefined;
  Exam: undefined;
  Dictionary: undefined;
  Payment: undefined;
  About: undefined;
  Contact: undefined;
    ExamInterface: {
    examId: string;
    examTitle: string;
    examType: 'TOPIK_I' | 'TOPIK_II';
    duration: number;
    totalQuestions: number;
    listeningQuestions: number;
    readingQuestions: number;
  };
};

export type NavigationProps = NativeStackScreenProps<RootStackParamList>;