import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text } from "react-native";

export interface ExamResult {
  id: string;
  examTitle: string;
  examType: "TOPIK I" | "TOPIK II";
  date: Date;
  totalScore: number;
  maxScore: number;
  sections: {
    name: string;
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
  }[];
  duration: number; // seconds
  level?: string;
}

export interface LessonProgress {
  categoryId: string;
  lessonId: string;
  completed: boolean;
  score?: number;
  completedDate?: Date;
}

interface ProgressContextType {
  examResults: ExamResult[];
  lessonProgress: LessonProgress[];
  addExamResult: (result: ExamResult) => void;
  updateLessonProgress: (progress: LessonProgress) => void;
  getAverageScore: () => number;
  getTotalExamsTaken: () => number;
  getRecentResults: (limit?: number) => ExamResult[];
  getWeakAreas: () => { category: string; accuracy: number }[];
  clearAllData: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EXAM_RESULTS: "topik_exam_results",
  LESSON_PROGRESS: "topik_lesson_progress",
} as const;

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedResults, savedProgress] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EXAM_RESULTS),
        AsyncStorage.getItem(STORAGE_KEYS.LESSON_PROGRESS),
      ]);

      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setExamResults(
          parsedResults.map((r: any) => ({
            ...r,
            date: new Date(r.date),
          }))
        );
      }

      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        setLessonProgress(
          parsedProgress.map((p: any) => ({
            ...p,
            completedDate: p.completedDate ? new Date(p.completedDate) : undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading data from AsyncStorage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save to AsyncStorage
  const saveExamResults = async (results: ExamResult[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EXAM_RESULTS, JSON.stringify(results));
    } catch (error) {
      console.error("Error saving exam results:", error);
    }
  };

  const saveLessonProgress = async (progress: LessonProgress[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving lesson progress:", error);
    }
  };

  const addExamResult = (result: ExamResult) => {
    setExamResults((prev) => {
      const newResults = [result, ...prev];
      saveExamResults(newResults);
      return newResults;
    });
  };

  const updateLessonProgress = (progress: LessonProgress) => {
    setLessonProgress((prev) => {
      const existing = prev.find(
        (p) => p.categoryId === progress.categoryId && p.lessonId === progress.lessonId
      );

      let newProgress: LessonProgress[];
      if (existing) {
        newProgress = prev.map((p) =>
          p.categoryId === progress.categoryId && p.lessonId === progress.lessonId
            ? { ...progress, completedDate: progress.completed ? new Date() : p.completedDate }
            : p
        );
      } else {
        newProgress = [
          ...prev,
          {
            ...progress,
            completedDate: progress.completed ? new Date() : undefined,
          },
        ];
      }
      
      saveLessonProgress(newProgress);
      return newProgress;
    });
  };

  const getAverageScore = () => {
    if (examResults.length === 0) return 0;
    const total = examResults.reduce((sum, result) => {
      const percentage = (result.totalScore / result.maxScore) * 100;
      return sum + percentage;
    }, 0);
    return Math.round(total / examResults.length);
  };

  const getTotalExamsTaken = () => examResults.length;

  const getRecentResults = (limit = 5) => {
    return examResults.slice(0, limit);
  };

  const getWeakAreas = () => {
    const sectionStats: { [key: string]: { correct: number; total: number } } = {};

    examResults.forEach((result) => {
      result.sections.forEach((section) => {
        if (!sectionStats[section.name]) {
          sectionStats[section.name] = { correct: 0, total: 0 };
        }
        sectionStats[section.name].correct += section.correctAnswers;
        sectionStats[section.name].total += section.totalQuestions;
      });
    });

    return Object.entries(sectionStats)
      .map(([category, stats]) => ({
        category,
        accuracy: Math.round((stats.correct / stats.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  };

  const clearAllData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.EXAM_RESULTS),
        AsyncStorage.removeItem(STORAGE_KEYS.LESSON_PROGRESS),
      ]);
      setExamResults([]);
      setLessonProgress([]);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

// ProgressContext.tsx - isLoading хэсэг
if (isLoading) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text >Loading...</Text>
    </  View>
  );
}
  return (
    <ProgressContext.Provider
      value={{
        examResults,
        lessonProgress,
        addExamResult,
        updateLessonProgress,
        getAverageScore,
        getTotalExamsTaken,
        getRecentResults,
        getWeakAreas,
        clearAllData,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}