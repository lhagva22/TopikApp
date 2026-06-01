import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { examApi } from '../src/features/exam/data/api/examApi';
import { useExamStore } from '../src/features/exam/presentation/store/examStore';

jest.mock('../src/features/exam/data/api/examApi', () => ({
  examApi: {
    getExams: jest.fn(),
    startExam: jest.fn(),
    submitExam: jest.fn(),
  },
}));

describe('exam store flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExamStore.getState().reset();
  });

  it('loads available exams into state', async () => {
    jest.mocked(examApi.getExams).mockResolvedValue({
      success: true,
      exams: [
        {
          id: 'exam-1',
          title: 'TOPIK I',
          exam_type: 'TOPIK_I',
          test_number: 35,
          total_questions: 70,
          duration: 100,
          listening_questions: 30,
          reading_questions: 40,
          is_active: true,
        },
      ],
      total: 1,
    });

    await useExamStore.getState().getExams();

    expect(useExamStore.getState().totalExams).toBe(1);
    expect(useExamStore.getState().exams[0].id).toBe('exam-1');
  });

  it('stores an active session and completes its submission', async () => {
    jest.mocked(examApi.startExam).mockResolvedValue({
      success: true,
      session: { id: 'session-1', started_at: '2026-05-25T00:00:00.000Z' },
      test: {
        id: 'exam-1',
        title: 'TOPIK I',
        exam_type: 'TOPIK_I',
        test_number: 35,
        total_questions: 70,
        duration: 100,
        listening_questions: 30,
        reading_questions: 40,
        is_active: true,
      },
      questions: [],
    });
    jest.mocked(examApi.submitExam).mockResolvedValue({
      success: true,
      result: {
        id: 'result-1',
        score: 140,
        maxScore: 200,
        totalQuestions: 70,
        percentage: 70,
        listeningScore: 70,
        readingScore: 70,
      },
    });

    await useExamStore.getState().startExam('exam-1');
    const response = await useExamStore.getState().submitExam('session-1', [], 100);

    expect(useExamStore.getState().currentSession?.id).toBe('session-1');
    expect(response?.success).toBe(true);
    expect(useExamStore.getState().isSubmitting).toBe(false);
  });
});
