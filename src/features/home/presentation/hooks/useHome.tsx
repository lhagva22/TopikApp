import { useCallback, useState } from 'react';

import { useAppStore } from '../../../../app/store';
import { getErrorMessage } from '../../../../shared/lib/errors';
import { homeUseCases } from '../dependencies';
import type { LevelTestExamType, StartLevelTestResult } from '../../domain/types';

export const useHome = () => {
  const { user, hasAccess } = useAppStore();
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingLevelTest, setStartingLevelTest] = useState(false);

  const loadUserLevel = useCallback(async () => {
    if (!user?.id || !hasAccess('registered')) {
      setUserLevel(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await homeUseCases.getProfile();

      if (response.success && response.user) {
        setUserLevel(response.user.current_level ?? 0);
        return;
      }

      setUserLevel(user.current_level ?? 0);
    } finally {
      setLoading(false);
    }
  }, [hasAccess, user?.current_level, user?.id]);

  const startLevelTest = async (examType: LevelTestExamType = 'TOPIK_I'): Promise<StartLevelTestResult> => {
    setStartingLevelTest(true);

    try {
      const response = await homeUseCases.startLevelTest(examType);

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
