import { Response } from 'express';

import { supabaseAdmin } from '../config/supabase';
import type { AuthRequest } from '../types';

type StoredAnswer = {
  questionId: string;
  selectedAnswer: string;
};

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

type ResultRow = {
  id: string;
  mock_test_id: string;
  exam_type: 'TOPIK_I' | 'TOPIK_II';
  total_score: number | null;
  listening_score: number | null;
  reading_score: number | null;
  listening_answers: StoredAnswer[] | null;
  reading_answers: StoredAnswer[] | null;
  time_spent_listening: number | null;
  time_spent_reading: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  mock_test_bank:
    | {
        title: string;
        total_questions: number;
        listening_questions: number;
        reading_questions: number;
      }
    | {
        title: string;
        total_questions: number;
        listening_questions: number;
        reading_questions: number;
      }[]
    | null;
};

type RecommendationCategoryRow =
  | {
      id: string;
      slug: string | null;
      title: string | null;
    }
  | {
      id: string;
      slug: string | null;
      title: string | null;
    }[]
  | null;

type RecommendationContentRow =
  | {
      id: string;
      title: string | null;
      description: string | null;
      content_type: string | null;
      content_url: string | null;
      thumbnail_url: string | null;
      level: string | null;
      is_premium: boolean | null;
      lesson_categories: RecommendationCategoryRow;
    }
  | {
      id: string;
      title: string | null;
      description: string | null;
      content_type: string | null;
      content_url: string | null;
      thumbnail_url: string | null;
      level: string | null;
      is_premium: boolean | null;
      lesson_categories: RecommendationCategoryRow;
    }[]
  | null;

type RecommendationRow = {
  id: string;
  result_id: string | null;
  reason: string | null;
  created_at: string | null;
  learning_contents: RecommendationContentRow;
};

type QuestionRow = {
  id: string;
  mock_test_id: string;
  section: 'listening' | 'reading';
  question_number: number;
  question_text: string;
  question_image_url?: string | null;
  audio_url?: string | null;
  options: string[];
  option_image_urls?: (string | null)[] | null;
  option_explanations?: (string | null)[] | null;
  question_score?: number | null;
  correct_answer_text: string;
  explanation?: string | null;
};

const REVIEW_QUESTION_SELECT =
  'id, mock_test_id, section, question_number, question_text, question_image_url, audio_url, options, option_image_urls, question_score, correct_answer_text, explanation';

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

const getAnswerList = (result: Pick<ResultRow, 'listening_answers' | 'reading_answers'>) =>
  ([...(result.listening_answers || []), ...(result.reading_answers || [])] as StoredAnswer[]);

const getExamMeta = (mockTestBank: ResultRow['mock_test_bank']) =>
  Array.isArray(mockTestBank) ? mockTestBank[0] || null : mockTestBank;

const getSingleRelation = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] || null : value || null;

const getLatestResultsByMockTest = (results: ResultRow[]) => {
  const seenMockTestIds = new Set<string>();

  return results.filter((result) => {
    if (!result.mock_test_id) {
      return true;
    }

    if (seenMockTestIds.has(result.mock_test_id)) {
      return false;
    }

    seenMockTestIds.add(result.mock_test_id);
    return true;
  });
};

const buildQuestionMetaByTest = async (mockTestIds: string[]) => {
  const questionMetaByTest = new Map<string, TestMeta>();

  if (mockTestIds.length === 0) {
    return questionMetaByTest;
  }

  const { data: questionRows, error } = await supabaseAdmin
    .from('mock_test_questions')
    .select('id, mock_test_id, section, correct_answer_text, question_score')
    .in('mock_test_id', mockTestIds);

  if (error) {
    throw new Error(error.message);
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

  return questionMetaByTest;
};

const buildSectionSummaries = (
  result: ResultRow,
  testMeta?: TestMeta,
) => {
  const exam = getExamMeta(result.mock_test_bank);
  const answerList = getAnswerList(result);
  let listeningCorrectAnswers = 0;
  let readingCorrectAnswers = 0;

  answerList.forEach((answer) => {
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

  return [
    {
      name: 'Сонсгол',
      score: result.listening_score || 0,
      maxScore: testMeta?.listeningScore || exam?.listening_questions || 0,
      correctAnswers: listeningCorrectAnswers,
      totalQuestions: exam?.listening_questions || 0,
    },
    {
      name: 'Уншлага',
      score: result.reading_score || 0,
      maxScore: testMeta?.readingScore || exam?.reading_questions || 0,
      correctAnswers: readingCorrectAnswers,
      totalQuestions: exam?.reading_questions || 0,
    },
  ].filter((section) => section.totalQuestions > 0);
};

const mapResultSummary = (result: ResultRow, testMeta?: TestMeta) => ({
  id: result.id,
  examTitle: getExamMeta(result.mock_test_bank)?.title || 'TOPIK шалгалт',
  examType: result.exam_type === 'TOPIK_II' ? 'TOPIK II' : 'TOPIK I',
  date: result.completed_at || result.created_at,
  totalScore: result.total_score || 0,
  maxScore: testMeta?.totalScore || getExamMeta(result.mock_test_bank)?.total_questions || 0,
  duration: calculateDurationInSeconds(
    result.started_at,
    result.completed_at,
    result.time_spent_listening,
    result.time_spent_reading,
  ),
  sections: buildSectionSummaries(result, testMeta),
});

const joinExplanationParts = (...parts: Array<string | null | undefined>) => {
  const seen = new Set<string>();

  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => {
      if (!part || seen.has(part)) {
        return false;
      }

      seen.add(part);
      return true;
    })
    .join(' ');
};

const getOptionExplanation = (
  _question?: Pick<QuestionRow, 'options'>,
  _answerText?: string | null,
) => null;

const loadReviewQuestions = async (mockTestId: string) => {
  const { data, error } = await supabaseAdmin
    .from('mock_test_questions')
    .select(REVIEW_QUESTION_SELECT)
    .eq('mock_test_id', mockTestId)
    .order('section', { ascending: true })
    .order('question_number', { ascending: true });

  return { data, error };
};

const loadRecommendations = async (userId: string, resultIds: string[]) => {
  const { data, error } = await supabaseAdmin
    .from('recommendations')
    .select(
      `
        id,
        result_id,
        reason,
        created_at,
        learning_contents:recommended_content_id (
          id,
          title,
          description,
          content_type,
          content_url,
          thumbnail_url,
          level,
          is_premium,
          lesson_categories:category_id (
            id,
            slug,
            title
          )
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const visibleResultIds = new Set(resultIds);
  const seenContentIds = new Set<string>();

  return ((data || []) as RecommendationRow[])
    .filter((recommendation) =>
      recommendation.result_id ? visibleResultIds.has(recommendation.result_id) : true,
    )
    .map((recommendation) => {
      const content = getSingleRelation(recommendation.learning_contents);
      const category = getSingleRelation(content?.lesson_categories);

      return {
        id: recommendation.id,
        resultId: recommendation.result_id,
        reason: recommendation.reason?.trim() || null,
        createdAt: recommendation.created_at,
        content: content
          ? {
              id: content.id,
              title: content.title || 'Санал болгож буй материал',
              description: content.description || '',
              contentType: content.content_type || 'article',
              contentUrl: content.content_url || null,
              thumbnailUrl: content.thumbnail_url || null,
              level: content.level || null,
              isPremium: Boolean(content.is_premium),
              category: category
                ? {
                    id: category.id,
                    slug: category.slug || '',
                    title: category.title || '',
                  }
                : null,
            }
          : null,
      };
    })
    .filter((recommendation) => {
      const contentId = recommendation.content?.id;

      if (!contentId) {
        return false;
      }

      if (seenContentIds.has(contentId)) {
        return false;
      }

      seenContentIds.add(contentId);
      return true;
    });
};

const getExplanationText = (
  question: QuestionRow,
  selectedAnswer: string | null,
  isCorrect: boolean,
) => {
  return question.explanation?.trim() || null;

  const baseExplanation = question.explanation?.trim() || null;
  const selectedOptionExplanation = null;
  const correctOptionExplanation = null;
  const correctAnswerSummary = `Зөв хариулт нь "${question.correct_answer_text}".`;

  if (isCorrect) {
    return joinExplanationParts(
      'Таны сонгосон хариулт зөв байна.',
      baseExplanation || correctAnswerSummary,
    );
  }

  if (!selectedAnswer) {
    return joinExplanationParts(
      'Та энэ асуултад хариулаагүй.',
      correctAnswerSummary,
      baseExplanation,
    );
  }

  return joinExplanationParts(
    `Та "${selectedAnswer}" гэж хариулсан боловч зөв хариулт нь "${question.correct_answer_text}" байсан.`,
    selectedOptionExplanation ? `Таны сонголт яагаад буруу вэ: ${selectedOptionExplanation}` : null,
    correctOptionExplanation ? `Зөв хариулт яагаад зөв вэ: ${correctOptionExplanation}` : null,
    baseExplanation,
  );
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

    const typedResults = (results || []) as ResultRow[];
    const latestResults = getLatestResultsByMockTest(typedResults);
    const mockTestIds = [...new Set(latestResults.map((result) => result.mock_test_id).filter(Boolean))];
    const questionMetaByTest = await buildQuestionMetaByTest(mockTestIds);
    const recommendations = await loadRecommendations(
      userId,
      latestResults.map((result) => result.id),
    );

    const examResults = latestResults.map((result) =>
      mapResultSummary(result, questionMetaByTest.get(result.mock_test_id)),
    );

    return res.json({
      success: true,
      examResults,
      lessonProgress: [],
      recommendations,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getProgressResultDetail = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { resultId } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!resultId) {
    return res.status(400).json({ success: false, error: 'Үр дүнгийн ID олдсонгүй' });
  }

  try {
    const { data: result, error } = await supabaseAdmin
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
      .eq('id', resultId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!result) {
      return res.status(404).json({ success: false, error: 'Үр дүн олдсонгүй' });
    }

    const typedResult = result as ResultRow;
    const testMetaByTest = await buildQuestionMetaByTest([typedResult.mock_test_id]);
    const testMeta = testMetaByTest.get(typedResult.mock_test_id);

    const { data: questions, error: questionError } = await loadReviewQuestions(
      typedResult.mock_test_id,
    );

    if (questionError) {
      return res.status(400).json({ success: false, error: questionError.message });
    }

    const typedQuestions = ((questions || []) as QuestionRow[]).map((question) => ({
      ...question,
      options: Array.isArray(question.options) ? question.options : [],
      option_image_urls: Array.isArray(question.option_image_urls) ? question.option_image_urls : null,
      option_explanations: Array.isArray(question.option_explanations)
        ? question.option_explanations.map((item) =>
            typeof item === 'string' && item.trim().length > 0 ? item.trim() : null,
          )
        : null,
    }));

    const answerList = getAnswerList(typedResult);
    const answerMap = new Map(answerList.map((answer) => [answer.questionId, answer.selectedAnswer]));
    const sectionSummaries = buildSectionSummaries(typedResult, testMeta);

    const reviewQuestions = typedQuestions.map((question) => {
      const selectedAnswer = answerMap.get(question.id) ?? null;
      const isCorrect = selectedAnswer === question.correct_answer_text;
      const selectedOptionExplanation = getOptionExplanation(question, selectedAnswer);
      const correctOptionExplanation = getOptionExplanation(question, question.correct_answer_text);

      return {
        id: question.id,
        section: question.section,
        sectionLabel: question.section === 'listening' ? 'Сонсгол' : 'Уншлага',
        questionNumber: question.question_number,
        questionText: question.question_text,
        questionImageUrl: question.question_image_url || null,
        audioUrl: question.audio_url || null,
        score: question.question_score || 1,
        selectedAnswer,
        correctAnswer: question.correct_answer_text,
        isCorrect,
        explanation: getExplanationText(question, selectedAnswer, isCorrect),
        options: question.options.map((option, index) => ({
          text: option,
          imageUrl: question.option_image_urls?.[index] || null,
          explanation: question.option_explanations?.[index] || null,
          isCorrect: option === question.correct_answer_text,
          isSelected: option === selectedAnswer,
        })),
      };
    });

    const weakSections = sectionSummaries
      .map((section) => ({
        ...section,
        incorrectAnswers: section.totalQuestions - section.correctAnswers,
        accuracy:
          section.totalQuestions > 0
            ? Math.round((section.correctAnswers / section.totalQuestions) * 100)
            : 0,
      }))
      .sort((left, right) => left.accuracy - right.accuracy);

    const incorrectQuestions = reviewQuestions.filter((question) => !question.isCorrect).length;
    const answeredQuestions = answerList.length;
    const unansweredQuestions = Math.max(reviewQuestions.length - answeredQuestions, 0);

    return res.json({
      success: true,
      detail: {
        result: mapResultSummary(typedResult, testMeta),
        weakSections,
        reviewQuestions,
        incorrectQuestions,
        answeredQuestions,
        unansweredQuestions,
      },
    });
  } catch (error) {
    console.error('Get progress result detail error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};
