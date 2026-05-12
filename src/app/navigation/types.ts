import type { NavigatorScreenParams } from '@react-navigation/native';
import type { DrawerScreenProps } from '@react-navigation/drawer';

import type { AuthStackParamList } from '../../features/auth/navigation/types';

type ExamQuestionParam = {
  id: string;
  section: string;
  question_number: number;
  question_text: string;
  question_image_url?: string;
  options: string[];
  option_image_urls?: Array<string | null> | null;
  audio_url?: string;
};

export type RootDrawerParamList = {
  Home: undefined;
  Dictionary: undefined;
  About: undefined;
  Contact: undefined;
  Video: undefined;
  Lesson: undefined;
  LessonAlphabetNumbers: undefined;
  LessonGrammar: undefined;
  LessonVocabulary: undefined;
  LessonBooks: undefined;
  Exam: undefined;
  Progress: undefined;
  ExamReview: {
    resultId: string;
  };
  Payment: undefined;
  PaymentCheckout: {
    planId: number;
    planTitle: string;
    planPrice: string;
    planMonths: number;
  };
  ExamInterface: {
    examId: string;
    examTitle: string;
    examType: 'TOPIK_I' | 'TOPIK_II';
    duration: number;
    totalQuestions: number;
    listeningQuestions: number;
    readingQuestions: number;
    sessionId?: string;
    questions?: ExamQuestionParam[];
    isLevelTest?: boolean;
  };
  ExamResultScreen: {
    score: number;
    maxScore: number;
    percentage: number;
    correctAnswers?: number;
    totalQuestions: number;
    listeningScore: number;
    listeningMaxScore?: number;
    readingScore: number;
    readingMaxScore?: number;
    examTitle: string;
  };
};

export type RootStackParamList = {
  App: NavigatorScreenParams<RootDrawerParamList> | undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
};

export type NavigationProps<T extends keyof RootDrawerParamList> = DrawerScreenProps<
  RootDrawerParamList,
  T
>;
