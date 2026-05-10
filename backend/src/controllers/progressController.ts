import { Response } from 'express';

import { supabaseAdmin } from '../config/supabase';
import type { AuthRequest } from '../types';

type QuestionMeta = {
  section: 'listening' | 'reading';
  correctAnswerText: string;
  questionScore: number;
};

type TestMeta = {
  totalScore: number;
  listeningScore: number;
  readingScore: number;
  byId: Map<string, QuestionMeta>;
};

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
          mock_test_id,
          exam_type,
          total_score,
          listening_score,
          reading_score,
          listening_answers,
          reading_answers,
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

    const mockTestIds = [...new Set((results || []).map((result: any) => result.mock_test_id).filter(Boolean))];
    const questionMetaByTest = new Map<string, TestMeta>();

    if (mockTestIds.length > 0) {
      const { data: questionRows, error: questionError } = await supabaseAdmin
        .from('mock_test_questions')
        .select('id, mock_test_id, section, correct_answer_text, question_score')
        .in('mock_test_id', mockTestIds);

      if (questionError) {
        return res.status(400).json({ success: false, error: questionError.message });
      }

      (questionRows || []).forEach((question: any) => {
        const current = questionMetaByTest.get(question.mock_test_id) || {
          totalScore: 0,
          listeningScore: 0,
          readingScore: 0,
          byId: new Map<string, QuestionMeta>(),
        };

        const questionScore = question.question_score || 1;
        current.totalScore += questionScore;

        if (question.section === 'listening') {
          current.listeningScore += questionScore;
        } else {
          current.readingScore += questionScore;
        }

        current.byId.set(question.id, {
          section: question.section,
          correctAnswerText: question.correct_answer_text,
          questionScore,
        });

        questionMetaByTest.set(question.mock_test_id, current);
      });
    }

    const examResults = (results || []).map((result: any) => {
      const exam = result.mock_test_bank;
      const testMeta = questionMetaByTest.get(result.mock_test_id);
      const listeningQuestions = exam?.listening_questions || 0;
      const readingQuestions = exam?.reading_questions || 0;
      const listeningScore = result.listening_score || 0;
      const readingScore = result.reading_score || 0;
      let listeningCorrectAnswers = 0;
      let readingCorrectAnswers = 0;

      [...(result.listening_answers || []), ...(result.reading_answers || [])].forEach((answer: any) => {
        const question = testMeta?.byId.get(answer.questionId);
        if (!question || answer.selectedAnswer !== question.correctAnswerText) {
          return;
        }

        if (question.section === 'listening') {
          listeningCorrectAnswers += 1;
        } else {
          readingCorrectAnswers += 1;
        }
      });

      return {
        id: result.id,
        examTitle: exam?.title || 'TOPIK шалгалт',
        examType: result.exam_type === 'TOPIK_II' ? 'TOPIK II' : 'TOPIK I',
        date: result.completed_at || result.created_at,
        totalScore: result.total_score || 0,
        maxScore: testMeta?.totalScore || exam?.total_questions || 0,
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
            maxScore: testMeta?.listeningScore || listeningQuestions,
            correctAnswers: listeningCorrectAnswers,
            totalQuestions: listeningQuestions,
          },
          {
            name: 'Уншлага',
            score: readingScore,
            maxScore: testMeta?.readingScore || readingQuestions,
            correctAnswers: readingCorrectAnswers,
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
