// src/controllers/levelTestController.ts
import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';

// ============================================
// 1. Түвшин тогтоох шалгалт эхлүүлэх
// ============================================
export const startLevelTest = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  console.log('🚀 Start level test - userId:', userId);
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    // 1. Хэрэглэгчийн premium эсэхийг шалгах
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, subscription_end_date')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ success: false, error: 'Хэрэглэгчийн мэдээлэл авахад алдаа' });
    }

    if (profile?.status !== 'premium') {
      console.log('User is not premium, status:', profile?.status);
      return res.status(403).json({ 
        success: false,
        error: 'Түвшин тогтоох шалгалт өгөхийн тулд premium байх шаардлагатай',
        requiresPremium: true
      });
    }

    // Subscription дууссан эсэхийг шалгах
    if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) {
      console.log('Subscription expired:', profile.subscription_end_date);
      return res.status(403).json({ 
        success: false,
        error: 'Таны premium хугацаа дууссан байна. Төлбөрөө шинэчилнэ үү.',
        expired: true
      });
    }

    // 2. Random шалгалт сонгох (TOPIK_I ба TOPIK_II-с random)
    const { data: mockTests, error: testError } = await supabase
      .from('mock_test_bank')
      .select('*')
      .eq('is_active', true);

    if (testError || !mockTests || mockTests.length === 0) {
      console.error('No active tests found:', testError);
      return res.status(404).json({ success: false, error: 'Шалгалт олдсонгүй' });
    }

    // Random шалгалт сонгох
    const randomTest = mockTests[Math.floor(Math.random() * mockTests.length)];
    console.log('Selected random test:', randomTest.id, randomTest.title);

    // 3. Session үүсгэх
    const { data: session, error: sessionError } = await supabase
      .from('level_test_sessions')
      .insert({
        user_id: userId,
        exam_id: randomTest.id,  // ✅ exam_id нэмсэн
        status: 'in_progress',
        exam_sequence: [{
          mock_test_id: randomTest.id,
          exam_type: randomTest.exam_type,
          status: 'pending'
        }],
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return res.status(500).json({ success: false, error: sessionError.message });
    }

    console.log('Session created:', session.id);

    // 4. Асуултуудыг авах
    const { data: questions, error: questionsError } = await supabase
      .from('mock_test_questions')
      .select('id, section, question_number, question_text, options, audio_url')
      .eq('mock_test_id', randomTest.id)
      .order('section', { ascending: true })
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('Questions fetch error:', questionsError);
      return res.status(500).json({ success: false, error: questionsError.message });
    }

    console.log('Questions loaded:', questions.length);

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
        id: randomTest.id,
        title: randomTest.title,
        exam_type: randomTest.exam_type,
        duration: randomTest.duration,
        total_questions: randomTest.total_questions,
        listening_questions: randomTest.listening_questions,
        reading_questions: randomTest.reading_questions
      },
      questions: shuffledQuestions
    });
  } catch (error) {
    console.error('Start level test error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

// ============================================
// 2. Түвшин тогтоох шалгалт дуусгах (current_level өөрчлөгдөнө)
// ============================================
export const submitLevelTest = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { sessionId, answers, timeSpent } = req.body;

  console.log('📤 Submit level test - userId:', userId);
  console.log('📤 Session ID:', sessionId);

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID олдсонгүй' });
  }

  try {
    // 1. Session-ийг шалгах
    const { data: session, error: sessionError } = await supabase
      .from('level_test_sessions')
      .select('*, mock_test_bank:exam_id(*)')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return res.status(404).json({ success: false, error: 'Session олдсонгүй' });
    }

    console.log('Session found, exam_id:', session.exam_id);

    // 2. Асуултуудыг авах
    const { data: questions, error: questionsError } = await supabase
      .from('mock_test_questions')
      .select('id, correct_answer_text, section')
      .eq('mock_test_id', session.exam_id);

    if (questionsError || !questions) {
      console.error('Questions fetch error:', questionsError);
      return res.status(500).json({ success: false, error: 'Асуултуудыг ачаалахад алдаа' });
    }

    // 3. Оноо тооцоолох
    let correctCount = 0;
    let listeningCorrect = 0;
    let readingCorrect = 0;
    let listeningTotal = 0;
    let readingTotal = 0;

    answers.forEach((answer: any) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        if (question.section === 'listening') {
          listeningTotal++;
          if (answer.selectedAnswer === question.correct_answer_text) {
            correctCount++;
            listeningCorrect++;
          }
        } else if (question.section === 'reading') {
          readingTotal++;
          if (answer.selectedAnswer === question.correct_answer_text) {
            correctCount++;
            readingCorrect++;
          }
        }
      }
    });

    const totalQuestions = questions.length;
    const percentage = (correctCount / totalQuestions) * 100;

    console.log(`Score: ${correctCount}/${totalQuestions} (${percentage}%)`);

    // 4. Түвшин тодорхойлох
    let newLevel = 0;
    let newLevelName = '';

    if (percentage >= 90) {
      newLevel = 6;
      newLevelName = 'TOPIK II - 6-р түвшин';
    } else if (percentage >= 75) {
      newLevel = 5;
      newLevelName = 'TOPIK II - 5-р түвшин';
    } else if (percentage >= 60) {
      newLevel = 4;
      newLevelName = 'TOPIK II - 4-р түвшин';
    } else if (percentage >= 45) {
      newLevel = 3;
      newLevelName = 'TOPIK II - 3-р түвшин';
    } else if (percentage >= 30) {
      newLevel = 2;
      newLevelName = 'TOPIK I - 2-р түвшин';
    } else {
      newLevel = 1;
      newLevelName = 'TOPIK I - 1-р түвшин';
    }

    console.log(`Determined level: ${newLevel} - ${newLevelName}`);

    // 5. Үр дүнг хадгалах
    const { data: result, error: resultError } = await supabase
      .from('level_test_results')
      .insert({
        session_id: sessionId,
        user_id: userId,
        mock_test_id: session.exam_id,
        exam_type: session.mock_test_bank?.exam_type,
        total_score: correctCount,
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
        time_spent_listening: timeSpent,
        time_spent_reading: timeSpent,
        started_at: session.started_at,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (resultError) {
      console.error('Result insert error:', resultError);
      return res.status(500).json({ success: false, error: resultError.message });
    }

    // 6. ✅ Profile-ийн current_level-г ШИНЭЧЛЭХ (ЗӨВХӨН ТҮВШИН ТОГТООХ ШАЛГАЛТАНД)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Үр дүнг хадгалсан, profile update алдаа гарсан ч үргэлжлүүлэх
    }

    console.log('Profile updated with new level:', newLevel);

    // 7. Session-ийг дуусгах
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
        id: result.id,
        score: correctCount,
        totalQuestions: totalQuestions,
        percentage: percentage,
        level: newLevel,
        levelName: newLevelName,
        listeningScore: listeningCorrect,
        readingScore: readingCorrect
      }
    });
  } catch (error) {
    console.error('Submit level test error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

// ============================================
// 3. Хэрэглэгчийн түвшин тогтоох түүх авах
// ============================================
export const getLevelTestHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const { data: results, error } = await supabase
      .from('level_test_results')
      .select('*, mock_test_bank:mock_test_id(title, exam_type)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      results: results,
      total: results?.length || 0
    });
  } catch (error) {
    console.error('Get level test history error:', error);
    res.status(500).json({ success: false, error: 'Серверийн алдаа' });
  }
};