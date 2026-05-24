import { Response } from 'express';

import { supabase, supabaseAdmin } from '../config/supabase';
import type { AuthRequest } from '../types';

type SubmittedAnswer = {
  questionId: string;
  selectedAnswer: string;
};

type QuestionRow = {
  id: string;
  section: 'listening' | 'reading';
  question_number: number;
  question_text: string;
  question_image_url?: string | null;
  question_score?: number | null;
  options: string[];
  option_image_urls?: string[] | null;
  audio_url?: string | null;
  correct_answer_text?: string;
};

type MockTestRow = {
  id: string;
  title: string;
  exam_type: 'TOPIK_I' | 'TOPIK_II';
  total_questions: number;
  duration: number;
  listening_questions: number;
  reading_questions: number;
};

type LevelTestExamType = 'TOPIK_I' | 'TOPIK_II';

type LevelTestStartBody = {
  examType?: LevelTestExamType;
};

type ProfileStatus = 'registered' | 'premium' | string;

type LevelTestHistoryResult = {
  id: string;
  exam_type: LevelTestExamType;
  total_score: number | null;
  completed_at: string | null;
  level_test_sessions?:
    | {
        final_level: number | null;
        status: string | null;
        completed_at: string | null;
      }
    | {
        final_level: number | null;
        status: string | null;
        completed_at: string | null;
      }[]
    | null;
};

type ExamResultListRow = {
  id: string;
  mock_test_id: string;
  exam_type: 'TOPIK_I' | 'TOPIK_II';
  total_score: number | null;
  listening_score: number | null;
  reading_score: number | null;
  completed_at: string | null;
  mock_test_bank:
    | { title: string | null }
    | { title: string | null }[]
    | null;
};

const LEVEL_TEST_UNLOCK_SCORE = 140;
const LEVEL_TEST_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const getExamMaxScore = (examType: 'TOPIK_I' | 'TOPIK_II') => (examType === 'TOPIK_I' ? 200 : 300);

const getPremiumProfile = async (userId: string) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('status, subscription_end_date')
    .eq('id', userId)
    .single();

  if (error) {
    return { error: 'Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа' };
  }

  if (profile?.status !== 'premium') {
    return {
      error: 'Premium багц шаардлагатай',
      requiresPremium: true,
    };
  }

  return { profile };
};

const getAccessProfile = async (userId: string) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('status, subscription_end_date')
    .eq('id', userId)
    .single<{ status: ProfileStatus; subscription_end_date: string | null }>();

  if (error || !profile) {
    return { error: 'Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа' as const };
  }

  return { profile };
};

const getResultSession = (result: LevelTestHistoryResult) =>
  Array.isArray(result.level_test_sessions)
    ? result.level_test_sessions[0] || null
    : result.level_test_sessions || null;

const isCompletedLevelTestResult = (result: LevelTestHistoryResult) => {
  const session = getResultSession(result);

  return (
    session?.status === 'completed' &&
    session.final_level !== null &&
    session.final_level !== undefined
  );
};

const getLevelTestHistory = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('level_test_results')
    .select(
      `
        id,
        exam_type,
        total_score,
        completed_at,
        level_test_sessions:session_id (
          final_level,
          status,
          completed_at
        )
      `,
    )
    .eq('user_id', userId)
    .order('completed_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as LevelTestHistoryResult[]).filter(isCompletedLevelTestResult);
};

const isAfter = (left?: string | null, right?: string | null) => {
  if (!left || !right) {
    return false;
  }

  return new Date(left).getTime() > new Date(right).getTime();
};

const getLevelTestAccess = async (userId: string, examType: LevelTestExamType) => {
  const profileResult = await getAccessProfile(userId);
  if ('error' in profileResult) {
    return { allowed: false as const, status: 500, error: profileResult.error };
  }

  const { profile } = profileResult;
  const isPremium = profile.status === 'premium';
  const history = await getLevelTestHistory(userId);
  const topikIResults = history.filter((result) => result.exam_type === 'TOPIK_I');
  const topikIIResults = history.filter((result) => result.exam_type === 'TOPIK_II');
  const latestTopikI = topikIResults[0] || null;
  const latestTopikII = topikIIResults[0] || null;

  if (examType === 'TOPIK_II') {
    if (!latestTopikI || (latestTopikI.total_score || 0) < LEVEL_TEST_UNLOCK_SCORE) {
      return {
        allowed: false as const,
        status: 403,
        error: 'TOPIK II түвшин тогтоох шалгалт TOPIK I дээр 140+ оноо авсны дараа нээгдэнэ.',
      };
    }

    if (isAfter(latestTopikII?.completed_at, latestTopikI.completed_at)) {
      return {
        allowed: false as const,
        status: 403,
        error: isPremium
          ? 'Энэ TOPIK I үр дүнгээр TOPIK II түвшин тогтоох шалгалтаа аль хэдийн өгсөн байна.'
          : 'TOPIK II түвшин тогтоох шалгалтыг үнэгүй нэг удаа өгөх эрх аль хэдийн ашиглагдсан байна.',
      };
    }

    return { allowed: true as const, profile };
  }

  if (!isPremium) {
    if (topikIResults.length > 0) {
      return {
        allowed: false as const,
        status: 403,
        error: 'Үнэгүй түвшин тогтоох шалгалтыг нэг удаа өгөх боломжтой.',
      };
    }

    return { allowed: true as const, profile };
  }

  const latestTopikICompletedAt = latestTopikI?.completed_at;
  if (latestTopikICompletedAt) {
    const elapsedMs = Date.now() - new Date(latestTopikICompletedAt).getTime();

    if (elapsedMs < LEVEL_TEST_COOLDOWN_MS) {
      const remainingDays = Math.ceil((LEVEL_TEST_COOLDOWN_MS - elapsedMs) / (24 * 60 * 60 * 1000));
      return {
        allowed: false as const,
        status: 429,
        error: `Төлбөртэй хэрэглэгч түвшин тогтоох шалгалтыг 7 хоногт нэг удаа өгнө. ${remainingDays} хоногийн дараа дахин оролдоно уу.`,
      };
    }
  }

  return { allowed: true as const, profile };
};

const shuffleOptions = (questions: QuestionRow[]) =>
  questions.map((question) => {
    const optionPairs = question.options.map((option, index) => ({
      option,
      imageUrl: question.option_image_urls?.[index] ?? null,
    }));

    for (let i = optionPairs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionPairs[i], optionPairs[j]] = [optionPairs[j], optionPairs[i]];
    }

    return {
      id: question.id,
      section: question.section,
      question_number: question.question_number,
      question_text: question.question_text,
      question_image_url: question.question_image_url,
      options: optionPairs.map((item) => item.option),
      option_image_urls: optionPairs.some((item) => item.imageUrl)
        ? optionPairs.map((item) => item.imageUrl)
        : null,
      audio_url: question.audio_url,
    };
  });

const normalizeSubmittedAnswers = (answers: SubmittedAnswer[]) =>
  Array.from(
    answers.reduce((uniqueAnswers, answer) => {
      uniqueAnswers.set(answer.questionId, answer);
      return uniqueAnswers;
    }, new Map<string, SubmittedAnswer>()).values(),
  );

const isSubmittedAnswerArray = (answers: unknown): answers is SubmittedAnswer[] =>
  Array.isArray(answers) &&
  answers.every(
    (answer) =>
      typeof answer === 'object' &&
      answer !== null &&
      typeof (answer as SubmittedAnswer).questionId === 'string' &&
      typeof (answer as SubmittedAnswer).selectedAnswer === 'string',
  );

const scoreAnswers = (questions: QuestionRow[], answers: SubmittedAnswer[]) => {
  let totalScore = 0;
  let listeningScore = 0;
  let readingScore = 0;
  let totalCorrect = 0;
  let listeningCorrect = 0;
  let readingCorrect = 0;
  let maxScore = 0;
  let listeningMaxScore = 0;
  let readingMaxScore = 0;

  const questionMap = new Map(questions.map((question) => [question.id, question]));

  questions.forEach((question) => {
    const questionScore = question.question_score ?? 1;
    maxScore += questionScore;

    if (question.section === 'listening') {
      listeningMaxScore += questionScore;
      return;
    }

    readingMaxScore += questionScore;
  });

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question || answer.selectedAnswer !== question.correct_answer_text) {
      return;
    }

    const questionScore = question.question_score ?? 1;

    totalScore += questionScore;
    totalCorrect += 1;

    if (question.section === 'listening') {
      listeningScore += questionScore;
      listeningCorrect += 1;
      return;
    }

    readingScore += questionScore;
    readingCorrect += 1;
  });

  return {
    totalScore,
    listeningScore,
    readingScore,
    totalCorrect,
    listeningCorrect,
    readingCorrect,
    maxScore,
    listeningMaxScore,
    readingMaxScore,
  };
};

const determineLevelFromRules = async (examType: 'TOPIK_I' | 'TOPIK_II', totalScore: number) => {
  const { data: rule, error } = await supabaseAdmin
    .from('level_test_rules')
    .select('determined_level, determined_level_name, next_exam_type')
    .eq('exam_type', examType)
    .lte('min_score', totalScore)
    .gte('max_score', totalScore)
    .limit(1)
    .maybeSingle();

  if (error || !rule) {
    return null;
  }

  return rule;
};

const getRandomLevelTestExam = async (examType: LevelTestExamType) => {
  const { data: mockTests, error: testError } = await supabaseAdmin
    .from('mock_test_bank')
    .select('*, mock_test_questions(count)')
    .eq('is_active', true)
    .eq('exam_type', examType)
    .order('test_number', { ascending: false });

  if (testError || !mockTests || mockTests.length === 0) {
    return { error: 'Шалгалт олдсонгүй' as const };
  }

  const availableTests = (mockTests as any[]).filter(test => {
    const count = test.mock_test_questions[0]?.count ?? 0;
    return count >= test.total_questions;
  });

  if (availableTests.length === 0) {
    return { error: 'Шалгалтын асуултууд олдсонгүй' as const };
  }

  const exam = { ...availableTests[Math.floor(Math.random() * availableTests.length)] };
  delete exam.mock_test_questions;

  return { exam: exam as MockTestRow };
};

const createLevelTestSessionPayload = async (
  userId: string,
  exam: MockTestRow,
  abandonExisting = false,
) => {
  if (abandonExisting) {
    await supabaseAdmin
      .from('level_test_sessions')
      .update({
        status: 'abandoned',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'in_progress');
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('level_test_sessions')
    .insert({
      user_id: userId,
      exam_id: exam.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (sessionError || !session) {
    throw new Error('Session үүсгэхэд алдаа гарлаа');
  }

  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('mock_test_questions')
    .select('id, section, question_number, question_text, question_image_url, options, option_image_urls, audio_url')
    .eq('mock_test_id', exam.id)
    .order('section', { ascending: true })
    .order('question_number', { ascending: true });

  if (questionsError || !questions || questions.length === 0) {
    throw new Error('Шалгалтын асуултууд олдсонгүй');
  }

  return {
    session: {
      id: session.id,
      started_at: session.started_at,
    },
    test: {
      id: exam.id,
      title: exam.title,
      exam_type: exam.exam_type,
      duration: exam.duration,
      total_questions: exam.total_questions,
      listening_questions: exam.listening_questions,
      reading_questions: exam.reading_questions,
    },
    questions: shuffleOptions(questions as QuestionRow[]),
  };
};

export const getExams = async (_req: AuthRequest, res: Response) => {
  try {
    const { data: exams, error } = await supabase
      .from('mock_test_bank')
      .select('*, mock_test_questions(count)')
      .eq('is_active', true)
      .order('exam_type', { ascending: true })
      .order('test_number', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const examsWithQuestions = (exams || [])
      .filter(exam => {
        const count = (exam.mock_test_questions as any)[0]?.count ?? 0;
        return count >= exam.total_questions;
      })
      .map(({ mock_test_questions: _mqc, ...exam }) => exam);

    return res.json({
      success: true,
      exams: examsWithQuestions,
      total: examsWithQuestions.length,
    });
  } catch (error) {
    console.error('Get exams error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getExamResults = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('level_test_results')
      .select(
        `
          id,
          mock_test_id,
          exam_type,
          total_score,
          listening_score,
          reading_score,
          completed_at,
          mock_test_bank:mock_test_id (
            title
          )
        `,
      )
      .eq('user_id', userId)
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const results = ((data || []) as ExamResultListRow[]).map((result) => {
      const test = Array.isArray(result.mock_test_bank)
        ? result.mock_test_bank[0] || null
        : result.mock_test_bank;
      const maxScore = getExamMaxScore(result.exam_type);
      const totalScore = result.total_score || 0;

      return {
        id: result.id,
        exam_id: result.mock_test_id,
        exam_title: test?.title || 'TOPIK шалгалт',
        exam_type: result.exam_type,
        total_score: totalScore,
        max_score: maxScore,
        listening_score: result.listening_score || 0,
        reading_score: result.reading_score || 0,
        percentage: Math.round((totalScore / maxScore) * 100),
        completed_at: result.completed_at,
      };
    });

    return res.json({ success: true, results, total: results.length });
  } catch (error) {
    console.error('Get exam results error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getExamById = async (req: AuthRequest, res: Response) => {
  const { examId } = req.params;

  try {
    const { data: exam, error } = await supabase
      .from('mock_test_bank')
      .select('*')
      .eq('id', examId)
      .single();

    if (error || !exam) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    return res.json({ success: true, exam });
  } catch (error) {
    console.error('Get exam by id error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const startExam = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { examId } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!examId) {
    return res.status(400).json({ success: false, error: 'Шалгалтын ID олдсонгүй' });
  }

  try {
    const [premiumCheck, examResult, questionsResult] = await Promise.all([
      getPremiumProfile(userId),
      supabaseAdmin.from('mock_test_bank').select('*').eq('id', examId).eq('is_active', true).single<MockTestRow>(),
      supabaseAdmin
        .from('mock_test_questions')
        .select('id, section, question_number, question_text, question_image_url, options, option_image_urls, audio_url')
        .eq('mock_test_id', examId)
        .order('section', { ascending: true })
        .order('question_number', { ascending: true }),
    ]);

    if ('error' in premiumCheck) {
      return res.status(premiumCheck.requiresPremium ? 403 : 500).json({
        success: false,
        error: premiumCheck.error,
        requiresPremium: premiumCheck.requiresPremium,
      });
    }

    const { data: exam, error: examError } = examResult;
    if (examError || !exam) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    const { data: questions, error: questionsError } = questionsResult;
    if (questionsError || !questions || questions.length === 0) {
      return res.status(404).json({ success: false, error: 'Шалгалтын асуултууд олдсонгүй' });
    }

    await supabaseAdmin
      .from('level_test_sessions')
      .update({
        status: 'abandoned',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'in_progress');

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('level_test_sessions')
      .insert({
        user_id: userId,
        exam_id: examId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      return res.status(500).json({
        success: false,
        error: `Session үүсгэхэд алдаа гарлаа: ${sessionError?.message || 'unknown error'}`,
      });
    }

    return res.json({
      success: true,
      session: {
        id: session.id,
        started_at: session.started_at,
      },
      test: {
        id: exam.id,
        title: exam.title,
        exam_type: exam.exam_type,
        duration: exam.duration,
        total_questions: exam.total_questions,
        listening_questions: exam.listening_questions,
        reading_questions: exam.reading_questions,
      },
      questions: shuffleOptions(questions as QuestionRow[]),
    });
  } catch (error) {
    console.error('Start exam error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const startLevelTest = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { examType } = (req.body || {}) as LevelTestStartBody;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const targetExamType = examType === 'TOPIK_II' ? 'TOPIK_II' : 'TOPIK_I';
    const access = await getLevelTestAccess(userId, targetExamType);
    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        error: access.error,
      });
    }

    const { data: mockTests, error: testError } = await supabaseAdmin
      .from('mock_test_bank')
      .select('*')
      .eq('is_active', true)
      .eq('exam_type', targetExamType);

    if (testError || !mockTests || mockTests.length === 0) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    const randomTest = mockTests[Math.floor(Math.random() * mockTests.length)] as MockTestRow;
    const payload = await createLevelTestSessionPayload(userId, randomTest, true);

    return res.json({
      success: true,
      ...payload,
    });
  } catch (error) {
    console.error('Start level test error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const startLevelTestMockTest = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { examType } = (req.body || {}) as LevelTestStartBody;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const targetExamType = examType === 'TOPIK_II' ? 'TOPIK_II' : 'TOPIK_I';
    const access = await getLevelTestAccess(userId, targetExamType);
    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        error: access.error,
      });
    }

    const nextExamResult = await getRandomLevelTestExam(
      targetExamType,
    );

    if ('error' in nextExamResult) {
      return res.status(404).json({ success: false, error: nextExamResult.error });
    }

    const payload = await createLevelTestSessionPayload(userId, nextExamResult.exam, true);

    return res.json({
      success: true,
      ...payload,
    });
  } catch (error) {
    console.error('Start level test error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const submitExam = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { sessionId, answers, timeSpent } = req.body as {
    sessionId?: string;
    answers?: SubmittedAnswer[];
    timeSpent?: number;
  };

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID олдсонгүй' });
  }

  if (!isSubmittedAnswerArray(answers)) {
    return res.status(400).json({ success: false, error: 'answers must be an array of submitted answers' });
  }

  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('level_test_sessions')
      .select('id, user_id, exam_id, status, started_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sessionError) {
      return res.status(500).json({ success: false, error: sessionError.message });
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session олдсонгүй' });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({ success: false, error: 'Энэ шалгалт аль хэдийн дууссан байна' });
    }

    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_test_bank')
      .select('id, exam_type, total_questions, listening_questions, reading_questions')
      .eq('id', session.exam_id)
      .single<MockTestRow>();

    if (examError || !exam) {
      return res.status(404).json({ success: false, error: 'Шалгалтын мэдээлэл олдсонгүй' });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, section, correct_answer_text, question_score')
      .eq('mock_test_id', session.exam_id);

    if (questionsError || !questions || questions.length === 0) {
      return res.status(500).json({ success: false, error: 'Асуултуудыг ачаалахад алдаа гарлаа' });
    }

    const submittedAnswers = normalizeSubmittedAnswers(answers || []);
    const {
      totalScore,
      listeningScore,
      readingScore,
      totalCorrect,
      listeningCorrect,
      readingCorrect,
      maxScore,
      listeningMaxScore,
      readingMaxScore,
    } = scoreAnswers(
      questions as QuestionRow[],
      submittedAnswers,
    );

    const completedAt = new Date().toISOString();
    const listeningAnswers = submittedAnswers.filter((answer) =>
      questions.some((question) => question.id === answer.questionId && question.section === 'listening'),
    );
    const readingAnswers = submittedAnswers.filter((answer) =>
      questions.some((question) => question.id === answer.questionId && question.section === 'reading'),
    );

    const { data: insertedResult, error: insertError } = await supabaseAdmin
      .from('level_test_results')
      .insert({
        session_id: sessionId,
        user_id: userId,
        mock_test_id: session.exam_id,
        exam_type: exam.exam_type,
        total_score: totalScore,
        listening_score: listeningScore,
        reading_score: readingScore,
        listening_answers: listeningAnswers,
        reading_answers: readingAnswers,
        time_spent_listening: exam.listening_questions > 0 ? timeSpent || 0 : 0,
        time_spent_reading: exam.reading_questions > 0 ? timeSpent || 0 : 0,
        started_at: session.started_at,
        completed_at: completedAt,
      })
      .select('id')
      .single();

    if (insertError || !insertedResult) {
      return res.status(500).json({
        success: false,
        error: `Үр дүнг хадгалахад алдаа гарлаа: ${insertError?.message || 'result id missing'}`,
      });
    }

    await supabaseAdmin
      .from('level_test_sessions')
      .update({
        status: 'completed',
        completed_at: completedAt,
      })
      .eq('id', sessionId);

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return res.json({
      success: true,
      result: {
        id: insertedResult.id,
        score: totalScore,
        maxScore,
        totalQuestions: exam.total_questions,
        correctAnswers: totalCorrect,
        percentage: Math.round(percentage),
        listeningScore,
        listeningMaxScore,
        listeningCorrectAnswers: listeningCorrect,
        readingScore,
        readingMaxScore,
        readingCorrectAnswers: readingCorrect,
      },
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const submitLevelTest = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { sessionId, answers, timeSpent } = req.body as {
    sessionId?: string;
    answers?: SubmittedAnswer[];
    timeSpent?: number;
  };

  if (!userId || !sessionId) {
    return res.status(400).json({ success: false, error: 'Хүсэлт буруу байна' });
  }

  if (!isSubmittedAnswerArray(answers)) {
    return res.status(400).json({ success: false, error: 'answers must be an array of submitted answers' });
  }

  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('level_test_sessions')
      .select('id, user_id, exam_id, status, started_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session олдсонгүй' });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({ success: false, error: 'Энэ шалгалт аль хэдийн дууссан байна' });
    }

    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_test_bank')
      .select('id, exam_type, title, total_questions, listening_questions, reading_questions')
      .eq('id', session.exam_id)
      .single<MockTestRow>();

    if (examError || !exam) {
      return res.status(404).json({ success: false, error: 'Шалгалтын мэдээлэл олдсонгүй' });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, section, correct_answer_text, question_score')
      .eq('mock_test_id', session.exam_id);

    if (questionsError || !questions || questions.length === 0) {
      return res.status(500).json({ success: false, error: 'Асуултуудыг ачаалахад алдаа гарлаа' });
    }

    const submittedAnswers = normalizeSubmittedAnswers(answers || []);
    const {
      totalScore,
      listeningScore,
      readingScore,
      totalCorrect,
      listeningCorrect,
      readingCorrect,
      maxScore,
      listeningMaxScore,
      readingMaxScore,
    } = scoreAnswers(
      questions as QuestionRow[],
      submittedAnswers,
    );

    const completedAt = new Date().toISOString();
    const levelRule = await determineLevelFromRules(exam.exam_type, totalScore);

    const { data: insertedLevelResult, error: resultInsertError } = await supabaseAdmin
      .from('level_test_results')
      .insert({
        session_id: sessionId,
        user_id: userId,
        mock_test_id: session.exam_id,
        exam_type: exam.exam_type,
        total_score: totalScore,
        adjusted_score: totalScore,
        listening_score: listeningScore,
        reading_score: readingScore,
        listening_answers: submittedAnswers.filter((answer) =>
          questions.some((question) => question.id === answer.questionId && question.section === 'listening'),
        ),
        reading_answers: submittedAnswers.filter((answer) =>
          questions.some((question) => question.id === answer.questionId && question.section === 'reading'),
        ),
        time_spent_listening: exam.listening_questions > 0 ? timeSpent || 0 : 0,
        time_spent_reading: exam.reading_questions > 0 ? timeSpent || 0 : 0,
        started_at: session.started_at,
        completed_at: completedAt,
      })
      .select('id')
      .single();

    if (resultInsertError || !insertedLevelResult) {
      return res.status(500).json({
        success: false,
        error: `Үр дүн хадгалахад алдаа гарлаа: ${resultInsertError?.message || 'result id missing'}`,
      });
    }

    const finalLevel = levelRule?.determined_level ?? 0;
    const shouldUnlockTopikII =
      exam.exam_type === 'TOPIK_I' && levelRule?.next_exam_type === 'TOPIK_II';

    let nextLevelTest: Awaited<ReturnType<typeof createLevelTestSessionPayload>> | null = null;
    const finalLevelName = levelRule?.determined_level_name ?? 'Түвшин тодорхойгүй';

    await supabaseAdmin
      .from('profiles')
      .update({
        current_level: finalLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    await supabaseAdmin
      .from('level_test_sessions')
      .update({
        status: 'completed',
        final_level: finalLevel,
        final_level_name: finalLevelName,
        completed_at: completedAt,
      })
      .eq('id', sessionId);

    if (shouldUnlockTopikII) {
      const topikIIAccess = await getLevelTestAccess(userId, 'TOPIK_II');

      const nextExamResult = await getRandomLevelTestExam('TOPIK_II');

      if (topikIIAccess.allowed && !('error' in nextExamResult)) {
        nextLevelTest = await createLevelTestSessionPayload(userId, nextExamResult.exam);
      }
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return res.json({
      success: true,
      result: {
        id: insertedLevelResult.id,
        score: totalScore,
        maxScore,
        totalQuestions: exam.total_questions,
        correctAnswers: totalCorrect,
        percentage: Math.round(percentage),
        level: finalLevel,
        levelName: finalLevelName,
        nextExamType: nextLevelTest ? 'TOPIK_II' : 'none',
        listeningScore,
        listeningMaxScore,
        listeningCorrectAnswers: listeningCorrect,
        readingScore,
        readingMaxScore,
        readingCorrectAnswers: readingCorrect,
      },
      nextLevelTest,
    });
  } catch (error) {
    console.error('Submit level test error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};
