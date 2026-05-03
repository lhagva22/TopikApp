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
  options: string[];
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

const shuffleOptions = (questions: QuestionRow[]) =>
  questions.map((question) => {
    const options = [...question.options];

    for (let i = options.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      id: question.id,
      section: question.section,
      question_number: question.question_number,
      question_text: question.question_text,
      options,
      audio_url: question.audio_url,
    };
  });

const scoreAnswers = (questions: QuestionRow[], answers: SubmittedAnswer[]) => {
  let totalCorrect = 0;
  let listeningCorrect = 0;
  let readingCorrect = 0;

  answers.forEach((answer) => {
    const question = questions.find((item) => item.id === answer.questionId);
    if (!question || answer.selectedAnswer !== question.correct_answer_text) {
      return;
    }

    totalCorrect += 1;

    if (question.section === 'listening') {
      listeningCorrect += 1;
      return;
    }

    readingCorrect += 1;
  });

  return {
    totalCorrect,
    listeningCorrect,
    readingCorrect,
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

export const getExams = async (_req: AuthRequest, res: Response) => {
  try {
    const { data: exams, error } = await supabase
      .from('mock_test_bank')
      .select('*')
      .eq('is_active', true)
      .order('exam_type', { ascending: true })
      .order('year', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const examsWithQuestions = [];

    for (const exam of exams || []) {
      const { count, error: countError } = await supabase
        .from('mock_test_questions')
        .select('*', { count: 'exact', head: true })
        .eq('mock_test_id', exam.id);

      if (!countError && count && count >= exam.total_questions) {
        examsWithQuestions.push(exam);
      }
    }

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
    const premiumCheck = await getPremiumProfile(userId);
    if ('error' in premiumCheck) {
      return res.status(premiumCheck.requiresPremium ? 403 : 500).json({
        success: false,
        error: premiumCheck.error,
        requiresPremium: premiumCheck.requiresPremium,
      });
    }

    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_test_bank')
      .select('*')
      .eq('id', examId)
      .eq('is_active', true)
      .single<MockTestRow>();

    if (examError || !exam) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, section, question_number, question_text, options, audio_url')
      .eq('mock_test_id', examId)
      .order('section', { ascending: true })
      .order('question_number', { ascending: true });

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

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const premiumCheck = await getPremiumProfile(userId);
    if ('error' in premiumCheck) {
      return res.status(premiumCheck.requiresPremium ? 403 : 500).json({
        success: false,
        error: premiumCheck.error,
        requiresPremium: premiumCheck.requiresPremium,
      });
    }

    const { data: mockTests, error: testError } = await supabaseAdmin
      .from('mock_test_bank')
      .select('*')
      .eq('is_active', true);

    if (testError || !mockTests || mockTests.length === 0) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    const randomTest = mockTests[Math.floor(Math.random() * mockTests.length)] as MockTestRow;

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
        exam_id: randomTest.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      return res.status(500).json({ success: false, error: 'Session үүсгэхэд алдаа гарлаа' });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, section, question_number, question_text, options, audio_url')
      .eq('mock_test_id', randomTest.id)
      .order('section', { ascending: true })
      .order('question_number', { ascending: true });

    if (questionsError || !questions || questions.length === 0) {
      return res.status(404).json({ success: false, error: 'Шалгалтын асуултууд олдсонгүй' });
    }

    return res.json({
      success: true,
      session: {
        id: session.id,
        started_at: session.started_at,
      },
      test: {
        id: randomTest.id,
        title: randomTest.title,
        exam_type: randomTest.exam_type,
        duration: randomTest.duration,
        total_questions: randomTest.total_questions,
        listening_questions: randomTest.listening_questions,
        reading_questions: randomTest.reading_questions,
      },
      questions: shuffleOptions(questions as QuestionRow[]),
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
      .select('id, section, correct_answer_text')
      .eq('mock_test_id', session.exam_id);

    if (questionsError || !questions || questions.length === 0) {
      return res.status(500).json({ success: false, error: 'Асуултуудыг ачаалахад алдаа гарлаа' });
    }

    const { totalCorrect, listeningCorrect, readingCorrect } = scoreAnswers(
      questions as QuestionRow[],
      answers || [],
    );

    const completedAt = new Date().toISOString();
    const listeningAnswers = (answers || []).filter((answer) =>
      questions.some((question) => question.id === answer.questionId && question.section === 'listening'),
    );
    const readingAnswers = (answers || []).filter((answer) =>
      questions.some((question) => question.id === answer.questionId && question.section === 'reading'),
    );

    const { error: insertError } = await supabaseAdmin.from('level_test_results').insert({
      session_id: sessionId,
      user_id: userId,
      mock_test_id: session.exam_id,
      exam_type: exam.exam_type,
      total_score: totalCorrect,
      listening_score: listeningCorrect,
      reading_score: readingCorrect,
      listening_answers: listeningAnswers,
      reading_answers: readingAnswers,
      time_spent_listening: exam.listening_questions > 0 ? timeSpent || 0 : 0,
      time_spent_reading: exam.reading_questions > 0 ? timeSpent || 0 : 0,
      started_at: session.started_at,
      completed_at: completedAt,
    });

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: `Үр дүнг хадгалахад алдаа гарлаа: ${insertError.message}`,
      });
    }

    await supabaseAdmin
      .from('level_test_sessions')
      .update({
        status: 'completed',
        completed_at: completedAt,
      })
      .eq('id', sessionId);

    const percentage = exam.total_questions > 0 ? (totalCorrect / exam.total_questions) * 100 : 0;

    return res.json({
      success: true,
      result: {
        score: totalCorrect,
        totalQuestions: exam.total_questions,
        percentage: Math.round(percentage),
        listeningScore: listeningCorrect,
        readingScore: readingCorrect,
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
      .select('id, section, correct_answer_text')
      .eq('mock_test_id', session.exam_id);

    if (questionsError || !questions || questions.length === 0) {
      return res.status(500).json({ success: false, error: 'Асуултуудыг ачаалахад алдаа гарлаа' });
    }

    const { totalCorrect, listeningCorrect, readingCorrect } = scoreAnswers(
      questions as QuestionRow[],
      answers || [],
    );

    const completedAt = new Date().toISOString();
    const levelRule = await determineLevelFromRules(exam.exam_type, totalCorrect);

    const { error: resultInsertError } = await supabaseAdmin.from('level_test_results').insert({
      session_id: sessionId,
      user_id: userId,
      mock_test_id: session.exam_id,
      exam_type: exam.exam_type,
      total_score: totalCorrect,
      adjusted_score: totalCorrect,
      listening_score: listeningCorrect,
      reading_score: readingCorrect,
      listening_answers: (answers || []).filter((answer) =>
        questions.some((question) => question.id === answer.questionId && question.section === 'listening'),
      ),
      reading_answers: (answers || []).filter((answer) =>
        questions.some((question) => question.id === answer.questionId && question.section === 'reading'),
      ),
      time_spent_listening: exam.listening_questions > 0 ? timeSpent || 0 : 0,
      time_spent_reading: exam.reading_questions > 0 ? timeSpent || 0 : 0,
      started_at: session.started_at,
      completed_at: completedAt,
    });

    if (resultInsertError) {
      return res.status(500).json({
        success: false,
        error: `Үр дүн хадгалахад алдаа гарлаа: ${resultInsertError.message}`,
      });
    }

    const finalLevel = levelRule?.determined_level ?? 0;
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

    const percentage = exam.total_questions > 0 ? (totalCorrect / exam.total_questions) * 100 : 0;

    return res.json({
      success: true,
      result: {
        score: totalCorrect,
        totalQuestions: exam.total_questions,
        percentage: Math.round(percentage),
        level: finalLevel,
        levelName: finalLevelName,
        listeningScore: listeningCorrect,
        readingScore: readingCorrect,
      },
    });
  } catch (error) {
    console.error('Submit level test error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};
