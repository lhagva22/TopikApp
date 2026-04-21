// backend/src/controllers/examController.ts
import { Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

// ============================================
// 1. Бүх шалгалтын жагсаалт авах
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

    res.json({
      success: true,
      exams: exams,
      total: exams?.length || 0
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа' });
  }
};

// ============================================
// 2. Тодорхой шалгалтын мэдээлэл авах
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
// 3. Шалгалт эхлүүлэх (Premium шаардлагатай)
// ============================================
export const startExam = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { examId } = req.params;

  console.log('🚀 Start exam - userId:', userId);
  console.log('🚀 Start exam - examId:', examId);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    // 1. Хэрэглэгчийн premium эсэхийг шалгах
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

    // Subscription дууссан эсэхийг шалгах
    if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Таны premium хугацаа дууссан байна',
        expired: true
      });
    }

    // 2. Шалгалтын мэдээлэл авах
    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_test_bank')
      .select('*')
      .eq('id', examId)
      .eq('is_active', true)
      .single();

    if (examError || !exam) {
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    // 3. Session үүсгэх
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

    if (sessionError) {
      return res.status(500).json({ success: false, error: sessionError.message });
    }

    // 4. Асуултуудыг авах
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, section, question_number, question_text, options, audio_url')
      .eq('mock_test_id', examId)
      .order('section', { ascending: true })
      .order('question_number', { ascending: true });

    if (questionsError) {
      return res.status(500).json({ success: false, error: questionsError.message });
    }

    // 5. Options-ыг random холих
    const shuffledQuestions = questions.map(q => {
      const originalOptions = q.options;
      const indices = originalOptions.map((_: any, i: number) => i);
      
      // Fisher-Yates shuffle
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
// 4. Шалгалт дуусгах
// ============================================
export const submitExam = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { sessionId, answers, timeSpent } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID олдсонгүй' });
  }

  try {
    // 1. Session-ийг шалгах
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('level_test_sessions')
      .select('*, mock_test_bank(*)')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session олдсонгүй' });
    }

    // 2. Асуултуудыг авах
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('mock_test_questions')
      .select('id, correct_answer_text, section')
      .eq('mock_test_id', session.exam_id);

    if (questionsError) {
      return res.status(500).json({ success: false, error: questionsError.message });
    }

    // 3. Оноо тооцоолох
    let correctCount = 0;
    let listeningCorrect = 0;
    let readingCorrect = 0;

    answers.forEach((answer: any) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        if (answer.selectedAnswer === question.correct_answer_text) {
          correctCount++;
          if (question.section === 'listening') {
            listeningCorrect++;
          } else if (question.section === 'reading') {
            readingCorrect++;
          }
        }
      }
    });

    const totalQuestions = questions.length;
    const percentage = (correctCount / totalQuestions) * 100;

    // 4. Үр дүнг хадгалах (level_test_results хүснэгтэд тохируулах)
    const { data: result, error: resultError } = await supabaseAdmin
      .from('level_test_results')
      .insert({
        session_id: sessionId,
        user_id: userId,
        mock_test_id: session.exam_id,
        exam_type: session.mock_test_bank?.exam_type || 'TOPIK_I',
        total_score: correctCount,  // ✅ total_score ашиглах
        listening_score: listeningCorrect,
        reading_score: readingCorrect,
        listening_answers: answers.filter((a: any) => {
          const q = questions.find(q => q.id === a.questionId);
          return q?.section === 'listening';
        }),
        reading_answers: answers.filter((a: any) => {
          const q = questions.find(q => q.id === a.questionId);
          return q?.section === 'reading';
        }),
        time_spent_listening: timeSpent, // Эсвэл тусад нь тооцоолох
        time_spent_reading: timeSpent,
        completed_at: new Date().toISOString(),
        started_at: session.started_at
      })
      .select()
      .single();

    if (resultError) {
      console.error('Result insert error:', resultError);
      return res.status(500).json({ success: false, error: resultError.message });
    }

    // 5. Session-ийг дуусгах
    await supabaseAdmin
      .from('level_test_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    res.json({
      success: true,
      result: {
        id: result.id,
        score: correctCount,
        totalQuestions: totalQuestions,
        percentage: percentage,
        listeningScore: listeningCorrect,
        readingScore: readingCorrect
      }
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getUserExamResults = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  try {
    const { data: results, error } = await supabaseAdmin
      .from('level_test_results')
      .select('*, mock_test_bank:mock_test_id(title, exam_type)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // results-д total_score байгаа тул percentage тооцоолох
    const totalExams = results?.length || 0;
    const averageScore = totalExams > 0 
      ? results.reduce((acc, r) => acc + (r.total_score || 0), 0) / totalExams 
      : 0;

    // Хамгийн их оноо (200 онооны дээр)
    const maxPossibleScore = 200; // TOPIK I: 200, TOPIK II: 200 (бичихгүй)
    
    res.json({
      success: true,
      results: results.map(r => ({
        ...r,
        percentage: (r.total_score / 70) * 100 // 70 асуулттай гэж үзвэл
      })),
      stats: {
        totalExams: totalExams,
        averageScore: Math.round(averageScore),
        bestScore: Math.max(...(results?.map(r => r.total_score || 0) || [0]))
      }
    });
  } catch (error) {
    console.error('Get user exam results error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа' });
  }
};
export const getExamResultById = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { resultId } = req.params;

  try {
    const { data: result, error } = await supabaseAdmin
      .from('level_test_results')
      .select('*, mock_test_bank:mock_test_id(*)')
      .eq('id', resultId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: 'Үр дүн олдсонгүй' });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Get exam result by id error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа' });
  }
};