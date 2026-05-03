import { Response } from 'express';

import { supabaseAdmin } from '../config/supabase';
import type { AuthRequest } from '../types';

const calculateDurationInSeconds = (
  startedAt?: string | null,
  completedAt?: string | null,
  listeningTime?: number | null,
  readingTime?: number | null,
) => {
  const storedDuration = (listeningTime || 0) + (readingTime || 0);
  if (storedDuration > 0) {
    return storedDuration;
  }

  if (!startedAt || !completedAt) {
    return 0;
  }

  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();

  if (Number.isNaN(started) || Number.isNaN(completed) || completed < started) {
    return 0;
  }

  return Math.round((completed - started) / 1000);
};

export const getProgress = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const { data: results, error } = await supabaseAdmin
      .from('level_test_results')
      .select(
        `
          id,
          exam_type,
          total_score,
          listening_score,
          reading_score,
          time_spent_listening,
          time_spent_reading,
          started_at,
          completed_at,
          created_at,
          mock_test_bank:mock_test_id (
            title,
            total_questions,
            listening_questions,
            reading_questions
          )
        `,
      )
      .eq('user_id', userId)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const examResults = (results || []).map((result: any) => {
      const exam = result.mock_test_bank;
      const listeningQuestions = exam?.listening_questions || 0;
      const readingQuestions = exam?.reading_questions || 0;
      const listeningScore = result.listening_score || 0;
      const readingScore = result.reading_score || 0;

      return {
        id: result.id,
        examTitle: exam?.title || 'TOPIK шалгалт',
        examType: result.exam_type === 'TOPIK_II' ? 'TOPIK II' : 'TOPIK I',
        date: result.completed_at || result.created_at,
        totalScore: result.total_score || 0,
        maxScore: exam?.total_questions || 0,
        duration: calculateDurationInSeconds(
          result.started_at,
          result.completed_at,
          result.time_spent_listening,
          result.time_spent_reading,
        ),
        sections: [
          {
            name: 'Сонсгол',
            score: listeningScore,
            maxScore: listeningQuestions,
            correctAnswers: listeningScore,
            totalQuestions: listeningQuestions,
          },
          {
            name: 'Уншлага',
            score: readingScore,
            maxScore: readingQuestions,
            correctAnswers: readingScore,
            totalQuestions: readingQuestions,
          },
        ].filter((section) => section.totalQuestions > 0),
      };
    });

    return res.json({
      success: true,
      examResults,
      lessonProgress: [],
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};
