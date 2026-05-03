import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAppStore } from '../../../app/store';
import { getErrorMessage, logError } from '../../../shared/lib/errors';
import { progressApi } from '../api/progressApi';
import type { ExamResult, LessonProgress, ProgressContextType } from './types';

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAppStore();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      setExamResults([]);
      setLessonProgress([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await progressApi.getProgress();

      if (response.success) {
        setExamResults(
          response.examResults.map((result) => ({
            ...result,
            date: new Date(result.date),
          })),
        );
        setLessonProgress(
          response.lessonProgress.map((progress) => ({
            ...progress,
            completedDate: progress.completedDate ? new Date(progress.completedDate) : undefined,
          })),
        );
      } else {
        setExamResults([]);
        setLessonProgress([]);
        setError(getErrorMessage(response.error, 'Ахиц дэвшлийн мэдээлэл ачаалагдсангүй.'));
      }
    } catch (error) {
      logError('Error loading progress data', error);
      setExamResults([]);
      setLessonProgress([]);
      setError(getErrorMessage(error, 'Ахиц дэвшлийн мэдээлэл ачаалагдсангүй.'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isInitialized]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const addExamResult = (result: ExamResult) => {
    setExamResults((prev) => [result, ...prev]);
  };

  const updateLessonProgress = (progress: LessonProgress) => {
    setLessonProgress((prev) => {
      const existing = prev.find(
        (item) => item.categoryId === progress.categoryId && item.lessonId === progress.lessonId,
      );

      return existing
        ? prev.map((item) =>
            item.categoryId === progress.categoryId && item.lessonId === progress.lessonId
              ? {
                  ...progress,
                  completedDate: progress.completed ? new Date() : item.completedDate,
                }
              : item,
          )
        : [
            ...prev,
            {
              ...progress,
              completedDate: progress.completed ? new Date() : undefined,
            },
          ];
    });
  };

  const getAverageScore = () => {
    if (examResults.length === 0) return 0;
    const total = examResults.reduce(
      (sum, result) => sum + (result.totalScore / Math.max(result.maxScore, 1)) * 100,
      0,
    );
    return Math.round(total / examResults.length);
  };

  const getTotalExamsTaken = () => examResults.length;

  const getRecentResults = (limit = 5) => examResults.slice(0, limit);

  const getWeakAreas = () => {
    const sectionStats: Record<string, { correct: number; total: number }> = {};

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
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((left, right) => left.accuracy - right.accuracy);
  };

  const clearAllData = async () => {
    setExamResults([]);
    setLessonProgress([]);
  };

  return (
    <ProgressContext.Provider
      value={{
        examResults,
        lessonProgress,
        isLoading,
        error,
        addExamResult,
        updateLessonProgress,
        getAverageScore,
        getTotalExamsTaken,
        getRecentResults,
        getWeakAreas,
        reloadData: loadData,
        clearAllData,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
