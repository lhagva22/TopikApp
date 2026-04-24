// backend/src/controllers/examController.ts
import { Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

// ============================================
// 1. Бүх шалгалтын жагсаалт авах (Public)
// ============================================
export const getExams = async (req: AuthRequest, res: Response) => {
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

    res.json({
      success: true,
      exams: examsWithQuestions,
      total: examsWithQuestions.length
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа' });
  }
};

// ============================================
// 2. Тодорхой шалгалтын мэдээлэл авах (Public)
// ============================================
export const getExamById = async (req: AuthRequest, res: Response) => {
  const { examId } = req.params;

  try {
    const { data: exam, error } = await supabase
      .from('mock_test_bank')
      .select('*')
      .eq('id', examId)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    res.json({ success: true, exam });
  } catch (error) {
    console.error('Get exam by id error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа' });
  }
};

// ============================================
// 3. Шалгалт эхлүүлэх (Premium)
// ============================================
export const startExam = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { examId } = req.params;

  console.log('🚀 Start exam - userId:', userId);
  console.log('🚀 Start exam - examId:', examId);

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!examId) {
    return res.status(400).json({ success: false, error: 'Шалгалтын ID олдсонгүй' });
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('status, subscription_end_date')
      .eq('id', userId)
      .single();

    if (profileError) {
      return res.status(500).json({ success: false, error: 'Хэрэглэгчийн мэдээлэл авахад алдаа' });
    }

    if (profile?.status !== 'premium') {
      return res.status(403).json({
        success: false,
        error: 'Шалгалт өгөхийн тулд premium байх шаардлагатай',
        requiresPremium: true
      });
    }

    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_test_bank')
      .select('*')
      .eq('id', examId)
      .eq('is_active', true)
      .single();

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

    // ✅ Хуучин идэвхтэй session-ийг abandoned болгох
    await supabaseAdmin
      .from('level_test_sessions')
      .update({ 
        status: 'abandoned', 
        completed_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('status', 'in_progress');

    // ✅ Шинэ session үүсгэх
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('level_test_sessions')
      .insert({
        user_id: userId,
        exam_id: examId,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Session creation error:', sessionError);
      return res.status(500).json({ success: false, error: 'Session үүсгэхэд алдаа: ' + sessionError?.message });
    }

    console.log('✅ New session created:', session.id);

    const shuffledQuestions = questions.map(q => {
      const originalOptions = q.options;
      const indices = originalOptions.map((_: any, i: number) => i);
      
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      const shuffledOptions = indices.map((i: number) => originalOptions[i]);
      
      return {
        id: q.id,
        section: q.section,
        question_number: q.question_number,
        question_text: q.question_text,
        options: shuffledOptions,
        audio_url: q.audio_url
      };
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        started_at: session.started_at
      },
      test: {
        id: exam.id,
        title: exam.title,
        exam_type: exam.exam_type,
        duration: exam.duration,
        total_questions: exam.total_questions,
        listening_questions: exam.listening_questions,
        reading_questions: exam.reading_questions
      },
      questions: shuffledQuestions
    });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

// ============================================
// 4. Түвшин тогтоох шалгалт эхлүүлэх (Random exam - Premium)
// ============================================
export const startLevelTest = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  console.log("userid",userId)
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('status, subscription_end_date')
      .eq('id', userId)
      .single();
    console.log("examController", profile)
    if (profile?.status !== 'premium') {
      return res.status(403).json({
        success: false,
        error: 'Түвшин тогтоох шалгалт өгөхийн тулд premium байх шаардлагатай',
        requiresPremium: true
      });
    }

    const { data: mockTests } = await supabaseAdmin
      .from('mock_test_bank')
      .select('*')
      .eq('is_active', true);

    if (!mockTests || mockTests.length === 0) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    const randomTest = mockTests[Math.floor(Math.random() * mockTests.length)];

    const { data: session } = await supabaseAdmin
      .from('level_test_sessions')
      .insert({
        user_id: userId,
        exam_id: randomTest.id,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    const { data: questions } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, section, question_number, question_text, options, audio_url')
      .eq('mock_test_id', randomTest.id)
      .order('section', { ascending: true })
      .order('question_number', { ascending: true });

    res.json({
      success: true,
      session: { id: session.id, started_at: session.started_at },
      test: {
        id: randomTest.id,
        title: randomTest.title,
        exam_type: randomTest.exam_type,
        duration: randomTest.duration,
        total_questions: randomTest.total_questions,
        listening_questions: randomTest.listening_questions,
        reading_questions: randomTest.reading_questions
      },
      questions: questions || []
    });
  } catch (error) {
    console.error('Start level test error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

// backend/src/controllers/examController.ts - submitExam функц
// backend/src/controllers/examController.ts - бүрэн зассан submitExam
export const submitExam = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { sessionId, answers, timeSpent } = req.body;

  console.log('📤 Submit exam - userId:', userId);
  console.log('📤 Submit exam - sessionId:', sessionId);
  console.log('📤 Submit exam - answers count:', answers?.length);

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID олдсонгүй' });
  }

  try {
    // ✅ supabaseAdmin ашиглах (RLS-ийг тойрох)
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('level_test_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    console.log('🔍 Session query result (admin):', session ? 'FOUND' : 'NOT FOUND');

    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      return res.status(500).json({ success: false, error: 'Session шалгахад алдаа: ' + sessionError.message });
    }

    if (!session) {
      console.error('Session not found for id:', sessionId);
      
      // SQL-ээр шууд шалгах (debug)
      const { data: directCheck } = await supabaseAdmin
        .from('level_test_sessions')
        .select('*')
        .eq('id', sessionId);
      console.log('🔍 Direct check:', directCheck);
      
      return res.status(404).json({ success: false, error: 'Session олдсонгүй. Шалгалт дахин эхлүүлнэ үү.' });
    }

    console.log('✅ Session found:', session.id, 'exam_id:', session.exam_id, 'status:', session.status);

    if (session.status !== 'in_progress') {
      return res.status(400).json({ success: false, error: 'Энэ шалгалт аль хэдийн дууссан байна' });
    }

    // Асуултуудыг авах
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, correct_answer_text, section')
      .eq('mock_test_id', session.exam_id);

    if (questionsError || !questions || questions.length === 0) {
      console.error('Questions fetch error:', questionsError);
      return res.status(500).json({ success: false, error: 'Асуултуудыг ачаалахад алдаа' });
    }

    console.log('📚 Questions count:', questions.length);

    // Оноо тооцоолох
    let correctCount = 0;
    answers.forEach((answer: any) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && answer.selectedAnswer === question.correct_answer_text) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    console.log('📊 Score:', correctCount, '/', totalQuestions, '(', percentage, '%)');

    // Үр дүнг хадгалах
    const { error: insertError } = await supabaseAdmin
    .from('level_test_results')
      .insert({
        session_id: sessionId,
        user_id: userId,
        mock_test_id: session.exam_id,
        exam_type: 'TOPIK_I',  // эсвэл session-с авах
        total_score: correctCount,
        listening_score: 0,
        reading_score: 0,
        completed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ success: false, error: 'Үр дүнг хадгалахад алдаа: ' + insertError.message });
    }

    // Session-ийг дуусгах
    await supabaseAdmin
      .from('level_test_sessions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    console.log('✅ Exam submitted successfully');

    res.json({
      success: true,
      result: { 
        score: correctCount, 
        totalQuestions, 
        percentage: Math.round(percentage) 
      }
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};
// ============================================
// 6. Түвшин тогтоох шалгалт дуусгах (current_level өөрчлөгдөнө)
// ============================================
export const submitLevelTest = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { sessionId, answers, timeSpent } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({ success: false, error: 'Хүсэлт буруу байна' });
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('level_test_sessions')
      .select('*, mock_test_bank:exam_id(*)')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session олдсонгүй' });
    }

    const { data: questions } = await supabase
      .from('mock_test_questions')
      .select('id, correct_answer_text, section')
      .eq('mock_test_id', session.exam_id);

    let correctCount = 0;
    answers.forEach((answer: any) => {
      const question = questions?.find(q => q.id === answer.questionId);
      if (question && answer.selectedAnswer === question.correct_answer_text) {
        correctCount++;
      }
    });

    const totalQuestions = questions?.length || 0;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    let newLevel = 1;
    let newLevelName = 'TOPIK I - 1-р түвшин';
    if (percentage >= 90) { newLevel = 6; newLevelName = 'TOPIK II - 6-р түвшин'; }
    else if (percentage >= 75) { newLevel = 5; newLevelName = 'TOPIK II - 5-р түвшин'; }
    else if (percentage >= 60) { newLevel = 4; newLevelName = 'TOPIK II - 4-р түвшин'; }
    else if (percentage >= 45) { newLevel = 3; newLevelName = 'TOPIK II - 3-р түвшин'; }
    else if (percentage >= 30) { newLevel = 2; newLevelName = 'TOPIK I - 2-р түвшин'; }

    await supabase
      .from('level_test_results')
      .insert({
        session_id: sessionId,
        user_id: userId,
        mock_test_id: session.exam_id,
        exam_type: session.mock_test_bank?.exam_type,
        total_score: correctCount,
        percentage: percentage,
        completed_at: new Date().toISOString()
      });

    await supabase
      .from('profiles')
      .update({ current_level: newLevel, updated_at: new Date().toISOString() })
      .eq('id', userId);

    await supabase
      .from('level_test_sessions')
      .update({ 
        status: 'completed', 
        final_level: newLevel, 
        final_level_name: newLevelName, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    res.json({
      success: true,
      result: { 
        score: correctCount, 
        totalQuestions, 
        percentage: Math.round(percentage), 
        level: newLevel, 
        levelName: newLevelName 
      }
    });
  } catch (error) {
    console.error('Submit level test error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};