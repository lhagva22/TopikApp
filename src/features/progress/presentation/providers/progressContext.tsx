import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useAppStore } from '../../../../app/store';
import { getErrorMessage, logError } from '../../../../shared/lib/errors';
import { progressUseCases } from '../dependencies';
import type { ExamResult, LessonProgress, ProgressContextType, ProgressRecommendation } from '../../domain/types';
import { buildWeakAreas, getScorePercentage, sortResultsByDate } from '../../domain/progressMetrics';

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);
const PROGRESS_CACHE_MAX_AGE_MS = 60 * 1000;

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user } = useAppStore();
  const userId = isAuthenticated ? user?.id : undefined;
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [levelTestResults, setLevelTestResults] = useState<ExamResult[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [recommendations, setRecommendations] = useState<ProgressRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAt = useRef<number | null>(null);
  const hasLoadedProgress = useRef(false);
  const loadedUser = useRef<string | undefined>(undefined);
  const activeUser = useRef(userId);
  activeUser.current = userId;
  const inFlight = useRef<{ userId: string | undefined; promise: Promise<void> } | null>(null);

  const loadData = useCallback(async (force = false) => {
    if (!isInitialized) {
      return;
    }

    if (loadedUser.current !== userId) {
      loadedUser.current = userId;
      lastLoadedAt.current = null;
      hasLoadedProgress.current = false;
      setExamResults([]);
      setLevelTestResults([]);
      setLessonProgress([]);
      setRecommendations([]);
    }

    if (!isAuthenticated) {
      setExamResults([]);
      setLevelTestResults([]);
      setLessonProgress([]);
      setRecommendations([]);
      setError(null);
      lastLoadedAt.current = null;
      hasLoadedProgress.current = false;
      setIsLoading(false);
      return;
    }

    if (
      !force &&
      lastLoadedAt.current &&
      Date.now() - lastLoadedAt.current < PROGRESS_CACHE_MAX_AGE_MS
    ) {
      return;
    }

    if (inFlight.current?.userId === userId && inFlight.current) {
      await inFlight.current.promise;
      if (!force || activeUser.current !== userId) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    const request = (async () => {
    try {
      const response = await progressUseCases.getProgress();
      if (activeUser.current !== userId) {
        return;
      }

      if (response.success) {
        setExamResults(
          response.examResults.map((result) => ({
            ...result,
            date: new Date(result.date),
          })),
        );
        setLevelTestResults(
          (response.levelTestResults || []).map((result) => ({
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
        setRecommendations(
          (response.recommendations || []).map((recommendation) => ({
            ...recommendation,
            createdAt: recommendation.createdAt ? new Date(recommendation.createdAt) : undefined,
          })),
        );
        lastLoadedAt.current = Date.now();
        hasLoadedProgress.current = true;
      } else {
        if (!hasLoadedProgress.current) {
          setExamResults([]);
          setLevelTestResults([]);
          setLessonProgress([]);
          setRecommendations([]);
        }
        setError(getErrorMessage(response.error, 'Ахицын мэдээлэл ачаалж чадсангүй.'));
      }
    } catch (caughtError) {
      logError('Error loading progress data', caughtError);
      if (activeUser.current !== userId) {
        return;
      }
      if (!hasLoadedProgress.current) {
        setExamResults([]);
        setLevelTestResults([]);
        setLessonProgress([]);
        setRecommendations([]);
      }
      setError(getErrorMessage(caughtError, 'Ахицын мэдээлэл ачаалж чадсангүй.'));
    } finally {
      if (activeUser.current === userId) {
        setIsLoading(false);
      }
    }
    })();
    inFlight.current = { userId, promise: request };
    await request;
    if (inFlight.current?.promise === request) {
      inFlight.current = null;
    }
  }, [isAuthenticated, isInitialized, userId]);

  useEffect(() => {
    loadData().catch(() => undefined);
  }, [loadData]);

  const addExamResult = (result: ExamResult) => {
    const setResults = result.resultType === 'level_test' ? setLevelTestResults : setExamResults;
    setResults((prev) => sortResultsByDate([result, ...prev.filter((item) => item.id !== result.id)]));
    lastLoadedAt.current = Date.now();
    hasLoadedProgress.current = true;
  };

  const updateLessonProgress = (progress: LessonProgress) => {
    lastLoadedAt.current = Date.now();
    hasLoadedProgress.current = true;
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
    if (examResults.length === 0) {
      return 0;
    }

    const scoredResults = examResults.filter((result) => result.maxScore > 0);
    return getScorePercentage(
      scoredResults.reduce((sum, result) => sum + result.totalScore, 0),
      scoredResults.reduce((sum, result) => sum + result.maxScore, 0),
    );
  };

  const getTotalExamsTaken = () => examResults.length;

  const getRecentResults = (limit = 5) => sortResultsByDate(examResults).slice(0, limit);

  const getWeakAreas = () => buildWeakAreas(examResults);

  const clearAllData = async () => {
    setExamResults([]);
    setLevelTestResults([]);
    setLessonProgress([]);
    setRecommendations([]);
    lastLoadedAt.current = null;
    hasLoadedProgress.current = false;
  };

  return (
    <ProgressContext.Provider
      value={{
        examResults,
        levelTestResults,
        lessonProgress,
        recommendations,
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
