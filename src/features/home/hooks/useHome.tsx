import { useCallback, useState } from 'react';

import { useAppStore } from '../../../app/store';
import { getErrorMessage } from '../../../shared/lib/errors';
import { homeApi } from '../api/homeApi';
import { StartLevelTestResult } from '../types';

export const useHome = () => {
  const { user } = useAppStore();
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUserLevel = useCallback(async () => {
    if (!user?.id || user.status === 'guest') {
      setUserLevel(null);
      return;
    }

    setLoading(true);

    try {
      const response = await homeApi.getUserLevel(user.id);
      if (response.success) {
        setUserLevel(response.level);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.status]);

  const startLevelTest = async (): Promise<StartLevelTestResult> => {
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
    }
  };

  return { userLevel, loading, loadUserLevel, startLevelTest };
};
