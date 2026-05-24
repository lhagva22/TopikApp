import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { apiRequest, get, post } from '../src/core/api/apiClient';
import { authApi } from '../src/features/auth/api/authApi';
import { dictionaryApi } from '../src/features/dictionary/api/dictionaryApi';
import { examApi } from '../src/features/exam/api/examApi';
import { lessonApi } from '../src/features/lessons/api/lessonApi';
import { paymentApi } from '../src/features/payment/api/paymentApi';
import { progressApi } from '../src/features/progress/api/progressApi';

jest.mock('../src/core/api/apiClient', () => ({
  apiRequest: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      PROFILE: '/auth/profile',
      LOGOUT: '/auth/logout',
    },
    EXAMS: {
      LIST: '/exams',
      START: (id: string) => `/exam/${id}/start`,
      SUBMIT: '/exam/submit',
      RESULTS: '/exam-results',
    },
    LEVEL_TEST: {
      START: '/level-test/start',
      SUBMIT: '/level-test/submit',
    },
    PAYMENT: {
      QPAY_CREATE: '/payments/qpay/create',
      CHECK: (id: string) => `/payments/${id}/check`,
      DETAIL: (id: string) => `/payments/${id}`,
      HISTORY: '/payments',
      DEV_COMPLETE: (id: string) => `/payments/${id}/dev-complete`,
    },
    PROGRESS: {
      SUMMARY: '/progress',
      DETAIL: (id: string) => `/progress/results/${id}`,
    },
    LESSONS: {
      CATEGORIES: '/lesson-categories',
      LIST: '/lessons',
      BY_CATEGORY: (slug: string) => `/lessons/category/${slug}`,
      GRAMMAR: '/korean-grammar-lessons',
    },
    VIDEO_LESSONS: {
      CATEGORIES: '/video-categories',
      LIST: '/video-lessons',
    },
    DICTIONARY: {
      SEARCH: '/dictionary/search',
    },
  },
}));

describe('feature API contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the auth endpoints expected by the backend', async () => {
    await authApi.login({ email: 'student@example.com', password: 'pass' });
    await authApi.getProfile();
    await authApi.logout();

    expect(post).toHaveBeenNthCalledWith(1, '/auth/login', {
      email: 'student@example.com',
      password: 'pass',
    });
    expect(get).toHaveBeenCalledWith('/auth/profile');
    expect(post).toHaveBeenNthCalledWith(2, '/auth/logout');
  });

  it('sends mock and level-test exam operations to the correct endpoints', async () => {
    await examApi.getExams();
    await examApi.getResults();
    await examApi.startExam('exam-1');
    await examApi.submitExam('session-1', [{ questionId: 'q1', selectedAnswer: 'A' }], 90);
    await examApi.submitLevelTest('level-session', [], 120);

    expect(apiRequest).toHaveBeenCalledWith('/exams');
    expect(apiRequest).toHaveBeenCalledWith('/exam-results');
    expect(apiRequest).toHaveBeenCalledWith('/exam/exam-1/start', { method: 'POST' });
    expect(apiRequest).toHaveBeenCalledWith('/exam/submit', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        answers: [{ questionId: 'q1', selectedAnswer: 'A' }],
        timeSpent: 90,
      }),
    });
    expect(apiRequest).toHaveBeenCalledWith('/level-test/submit', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'level-session', answers: [], timeSpent: 120 }),
    });
  });

  it('uses progress, lesson, dictionary, and payment endpoints', async () => {
    await progressApi.getProgress();
    await progressApi.getResultDetail('result-1');
    await lessonApi.getLessonsByCategory('grammar');
    await lessonApi.getKoreanGrammarLessons({ level: 'Beginner', topikLevel: 'TOPIK 1' });
    await dictionaryApi.searchWords('학교', { limit: 20, offset: 5 });
    await paymentApi.createQPayPayment(3);
    await paymentApi.checkQPayPayment('payment-1');

    expect(apiRequest).toHaveBeenCalledWith('/progress');
    expect(apiRequest).toHaveBeenCalledWith('/progress/results/result-1');
    expect(get).toHaveBeenCalledWith('/lessons/category/grammar');
    expect(get).toHaveBeenCalledWith('/korean-grammar-lessons?level=Beginner&topikLevel=TOPIK+1');
    expect(apiRequest).toHaveBeenCalledWith(
      '/dictionary/search?q=%ED%95%99%EA%B5%90&limit=20&offset=5',
      { method: 'GET' },
    );
    expect(post).toHaveBeenCalledWith('/payments/qpay/create', { months: 3 });
    expect(post).toHaveBeenCalledWith('/payments/payment-1/check');
  });
});
