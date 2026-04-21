// src/features/home/hooks/useHome.ts
import { useState } from 'react';
import { useSharedStore } from '../../../store/sharedStore';
import { homeApi } from '../api/homeApi';
import { StartLevelTestResult } from '../types';

export const useHome = () => {
  const { user, isAuthenticated } = useSharedStore();
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUserLevel = async () => {
    if (!isAuthenticated || !user?.id) return;
    setLoading(true);
    const response = await homeApi.getUserLevel(user.id);
    if (response.success) setUserLevel(response.level);
    setLoading(false);
  };

  const startLevelTest = async (): Promise<StartLevelTestResult> => {
    try {
      const response = await homeApi.startLevelTest();
      
      if (response.success && response.session && response.test && response.questions) {
        return {
          success: true,
          data: {
            session: response.session,
            test: response.test,
            questions: response.questions
          }
        };
      }
      return { success: false, error: response.error || 'Шалгалт эхлүүлэхэд алдаа гарлаа' };
    } catch (error) {
      return { success: false, error: 'Серверт холбогдоход алдаа гарлаа' };
    }
  };

  return { userLevel, loading, loadUserLevel, startLevelTest };
};