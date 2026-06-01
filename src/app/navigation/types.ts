import type { NavigatorScreenParams } from '@react-navigation/native';
import type { DrawerScreenProps } from '@react-navigation/drawer';

import type { AuthStackParamList } from '../../features/auth/presentation/navigation/types';
import type { TopikExamType, TopikQuestion } from '../../shared/types/topik';

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
  BookReader: {
    title: string;
    url: string;
  };
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
    examType: TopikExamType;
    duration: number;
    totalQuestions: number;
    listeningQuestions: number;
    readingQuestions: number;
    sessionId?: string;
    questions?: TopikQuestion[];
    isLevelTest?: boolean;
  };
  ExamResultScreen: {
    id?: string;
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
    isLevelTest?: boolean;
    level?: number;
    levelName?: string;
    currentExamType?: TopikExamType;
    nextLevelTest?: {
      session: { id: string; started_at: string };
      test: {
        id: string;
        title: string;
        exam_type: TopikExamType;
        duration: number;
        total_questions: number;
        listening_questions: number;
        reading_questions: number;
      };
      questions: TopikQuestion[];
    } | null;
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
