import { useCallback, useState } from 'react';

import { useAppStore } from '../../../app/store';
import { getErrorMessage } from '../../../shared/lib/errors';
import { authApi } from '../../auth/api/authApi';
import { homeApi } from '../api/homeApi';
import { StartLevelTestResult } from '../types';

export const useHome = () => {
  const { user } = useAppStore();
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingLevelTest, setStartingLevelTest] = useState(false);

  const loadUserLevel = useCallback(async () => {
    if (!user?.id || user.status === 'guest') {
      setUserLevel(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.getProfile();

      if (response.success && response.user) {
        setUserLevel(response.user.current_level ?? 0);
        return;
      }

      setUserLevel(user.current_level ?? 0);
    } finally {
      setLoading(false);
    }
  }, [user?.current_level, user?.id, user?.status]);

  const startLevelTest = async (): Promise<StartLevelTestResult> => {
    setStartingLevelTest(true);

    try {
      const response = await homeApi.startLevelTest();

      if (response.success && response.session && response.test && response.questions) {
        return {
          success: true,
          data: {
            session: response.session,
            test: response.test,
            questions: response.questions,
          },
        };
      }

      return {
        success: false,
        error: getErrorMessage(response.error, 'Шалгалт эхлүүлэхэд алдаа гарлаа.'),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Серверт холбогдоход алдаа гарлаа.'),
      };
    } finally {
      setStartingLevelTest(false);
    }
  };

  return { userLevel, loading, startingLevelTest, loadUserLevel, startLevelTest };
};
