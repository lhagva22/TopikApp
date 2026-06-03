const assert = require('node:assert/strict');
const { after, afterEach, before, describe, it } = require('node:test');

const { createApp } = require('../dist/server.js');
const { clearActiveExamCache } = require('../dist/controllers/examController.js');
const database = require('../dist/config/supabase.js');

const originalSupabaseFrom = database.supabase.from.bind(database.supabase);
const originalAdminFrom = database.supabaseAdmin.from.bind(database.supabaseAdmin);
const originalGetUser = database.supabase.auth.getUser.bind(database.supabase.auth);
const originalSignInWithPassword = database.supabase.auth.signInWithPassword.bind(database.supabase.auth);

const makeQuery = (result) => {
  const query = {
    select: () => query,
    eq: () => query,
    lte: () => query,
    gte: () => query,
    order: () => query,
    range: () => query,
    or: () => query,
    limit: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    single: async () => result,
    maybeSingle: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };

  return query;
};

const mockAuth = () => {
  database.supabase.auth.getUser = async () => ({
    data: { user: { id: 'user-1', email: 'student@example.com' } },
    error: null,
  });
};

const mockTables = (tables, client = database.supabaseAdmin) => {
  client.from = (table) => makeQuery({
    data: tables[table] ?? [],
    error: null,
    count: (tables[table] ?? []).length,
  });
};

describe('backend API', () => {
  let server;
  let origin;

  before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address();
    origin = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  afterEach(() => {
    clearActiveExamCache();
    database.supabase.from = originalSupabaseFrom;
    database.supabaseAdmin.from = originalAdminFrom;
    database.supabase.auth.getUser = originalGetUser;
    database.supabase.auth.signInWithPassword = originalSignInWithPassword;
  });

  it('responds from the health endpoint', async () => {
    const response = await fetch(`${origin}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: 'OK',
      message: 'Server is running',
    });
  });

  it('protects progress requests without a token', async () => {
    const response = await fetch(`${origin}/api/progress`);

    assert.equal(response.status, 401);
    assert.match((await response.json()).error, /Token/);
  });

  it('protects level-test start requests without a token', async () => {
    const response = await fetch(`${origin}/api/level-test/start`, { method: 'POST' });

    assert.equal(response.status, 401);
    assert.match((await response.json()).error, /Token/);
  });

  it('protects payment and dictionary bookmark data without a token', async () => {
    const requests = [
      ['/api/payments', 'GET'],
      ['/api/payments/qpay/create', 'POST'],
      ['/api/dictionary/bookmarks', 'GET'],
      ['/api/dictionary/bookmarks', 'POST'],
    ];

    for (const [path, method] of requests) {
      const response = await fetch(`${origin}${path}`, { method });
      assert.equal(response.status, 401, path);
    }
  });

  it('provides a working logout endpoint for the frontend auth flow', async () => {
    const response = await fetch(`${origin}/api/auth/logout`, { method: 'POST' });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
  });

  it('returns JSON when the login provider fails unexpectedly', async () => {
    database.supabase.auth.signInWithPassword = async () => {
      throw new Error('provider offline');
    };

    const response = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'password' }),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Server error while signing in.' });
  });

  it('returns an email-specific login error when the email is not registered', async () => {
    database.supabase.auth.signInWithPassword = async () => ({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });
    database.supabaseAdmin.from = () => makeQuery({ data: null, error: null });

    const response = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', password: 'password' }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Имэйл буруу байна.' });
  });

  it('returns a password-specific login error when the email exists', async () => {
    database.supabase.auth.signInWithPassword = async () => ({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });
    database.supabaseAdmin.from = () => makeQuery({ data: { id: 'user-1' }, error: null });

    const response = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'wrong-password' }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Нууц үг буруу байна.' });
  });

  it('serves public exam, learning, video, and dictionary content', async () => {
    mockTables({
      mock_test_bank: [
        {
          id: 'exam-1',
          title: 'TOPIK I',
          exam_type: 'TOPIK_I',
          total_questions: 1,
          duration: 100,
          listening_questions: 1,
          reading_questions: 0,
          is_active: true,
          updated_at: '2026-05-25T00:00:00.000Z',
        },
      ],
      mock_test_questions: [
        {
          id: 'question-1',
          mock_test_id: 'exam-1',
          section: 'listening',
          question_number: 1,
          question_text: 'Question',
          options: ['A', 'B'],
        },
      ],
      lesson_categories: [{ id: 'cat-1', slug: 'grammar', title: 'Grammar', is_active: true }],
      learning_contents: [{ id: 'content-1', title: 'Lesson', is_active: true }],
      korean_grammar_lessons: [{ id: 'grammar-1', grammar_pattern: '-아요', is_active: true }],
      video_categories: [{ id: 'video-cat-1', slug: 'start', title: 'Start', is_active: true }],
      video_lessons: [{ id: 'video-1', title: 'Video', video_url: '/media/video.mp4', is_active: true }],
      dictionary_words: [{ id: 'word-1', korean_word: '학교', mongolian_meaning: 'сургууль' }],
    });

    const requests = [
      ['/api/exams', 'exams'],
      ['/api/lesson-categories', 'categories'],
      ['/api/lessons', 'lessons'],
      ['/api/korean-grammar-lessons', 'lessons'],
      ['/api/video-categories', 'categories'],
      ['/api/video-lessons', 'lessons'],
      ['/api/dictionary/search?q=school', 'words'],
    ];

    for (const [path, collection] of requests) {
      const response = await fetch(`${origin}${path}`);
      const body = await response.json();

      assert.equal(response.status, 200, path);
      assert.equal(body.success, true, path);
      assert.equal(body[collection].length, 1, path);
    }
  });

  it('returns authenticated exam history used by the exam summary UI', async () => {
    mockAuth();
    mockTables({
      level_test_results: [
        {
          id: 'result-1',
          mock_test_id: 'exam-1',
          exam_type: 'TOPIK_I',
          total_score: 140,
          listening_score: 70,
          reading_score: 70,
          completed_at: '2026-05-25T00:00:00.000Z',
          mock_test_bank: { title: 'TOPIK I 35' },
        },
      ],
    });

    const response = await fetch(`${origin}/api/exam-results`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.results[0].percentage, 70);
    assert.equal(body.results[0].exam_title, 'TOPIK I 35');
  });

  it('allows TOPIK II start after a qualifying TOPIK I level-test result', async () => {
    mockAuth();
    let sessionRequestCount = 0;
    database.supabaseAdmin.from = (table) => {
      if (table === 'profiles') {
        return makeQuery({ data: { status: 'registered', subscription_end_date: null }, error: null });
      }
      if (table === 'level_test_results') {
        return makeQuery({
          data: [
            {
              id: 'topik-i-result',
              exam_type: 'TOPIK_I',
              total_score: 140,
              completed_at: '2026-05-24T00:00:00.000Z',
              level_test_sessions: {
                final_level: 2,
                status: 'completed',
                completed_at: '2026-05-24T00:00:00.000Z',
              },
            },
          ],
          error: null,
        });
      }
      if (table === 'mock_test_bank') {
        return makeQuery({
          data: [
            {
              id: 'topik-ii-exam',
              title: 'TOPIK II',
              exam_type: 'TOPIK_II',
              total_questions: 1,
              duration: 130,
              listening_questions: 1,
              reading_questions: 0,
              mock_test_questions: [{ count: 1 }],
            },
          ],
          error: null,
        });
      }
      if (table === 'level_test_sessions') {
        sessionRequestCount += 1;
        return makeQuery({
          data: sessionRequestCount > 1
            ? { id: 'topik-ii-session', started_at: '2026-05-25T00:00:00.000Z' }
            : null,
          error: null,
        });
      }
      if (table === 'mock_test_questions') {
        return makeQuery({
          data: [
            {
              id: 'question-1',
              section: 'listening',
              question_number: 1,
              question_text: 'Question',
              options: ['A', 'B'],
            },
          ],
          error: null,
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    };

    const response = await fetch(`${origin}/api/level-test/start`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ examType: 'TOPIK_II' }),
    });
    const body = await response.json();

    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.test.exam_type, 'TOPIK_II');
    assert.equal(body.session.id, 'topik-ii-session');
  });

  it('keeps TOPIK II locked before a qualifying TOPIK I level-test result', async () => {
    mockAuth();
    database.supabaseAdmin.from = (table) => {
      if (table === 'profiles') {
        return makeQuery({ data: { status: 'registered', subscription_end_date: null }, error: null });
      }
      if (table === 'level_test_results') {
        return makeQuery({ data: [], error: null });
      }

      throw new Error(`Unexpected table: ${table}`);
    };

    const response = await fetch(`${origin}/api/level-test/start`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ examType: 'TOPIK_II' }),
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.success, false);
  });

  it('calculates each question only once while submitting a level test', async () => {
    mockAuth();
    database.supabaseAdmin.from = (table) => {
      if (table === 'level_test_sessions') {
        return makeQuery({
          data: {
            id: 'session-1',
            user_id: 'user-1',
            exam_id: 'exam-1',
            status: 'in_progress',
            started_at: '2026-05-25T00:00:00.000Z',
          },
          error: null,
        });
      }
      if (table === 'mock_test_bank') {
        return makeQuery({
          data: {
            id: 'exam-1',
            title: 'TOPIK I',
            exam_type: 'TOPIK_I',
            total_questions: 2,
            listening_questions: 1,
            reading_questions: 1,
          },
          error: null,
        });
      }
      if (table === 'mock_test_questions') {
        return makeQuery({
          data: [
            { id: 'q1', section: 'listening', correct_answer_text: 'A', question_score: 70 },
            { id: 'q2', section: 'reading', correct_answer_text: 'B', question_score: 70 },
          ],
          error: null,
        });
      }
      if (table === 'level_test_rules') {
        return makeQuery({
          data: {
            determined_level: 2,
            determined_level_name: 'TOPIK I - 2',
            next_exam_type: 'none',
          },
          error: null,
        });
      }
      if (table === 'level_test_results') {
        return makeQuery({ data: { id: 'result-1' }, error: null });
      }
      if (table === 'profiles') {
        return makeQuery({ data: null, error: null });
      }

      throw new Error(`Unexpected table: ${table}`);
    };

    const response = await fetch(`${origin}/api/level-test/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: 'session-1',
        answers: [
          { questionId: 'q1', selectedAnswer: 'A' },
          { questionId: 'q1', selectedAnswer: 'A' },
          { questionId: 'q2', selectedAnswer: 'B' },
        ],
        timeSpent: 120,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.result.score, 140);
    assert.equal(body.result.maxScore, 140);
    assert.equal(body.result.level, 2);
    assert.equal(body.result.percentage, 100);
  });

  it('rejects malformed answer payloads before processing exam submissions', async () => {
    mockAuth();
    database.supabaseAdmin.from = () => {
      throw new Error('Database access must not occur for an invalid answer payload');
    };

    for (const path of ['/api/exam/submit', '/api/level-test/submit']) {
      const response = await fetch(`${origin}${path}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: 'session-1', answers: { q1: 'A' }, timeSpent: 120 }),
      });

      assert.equal(response.status, 400, path);
    }
  });

  it('includes stored lesson progress in the progress summary', async () => {
    mockAuth();
    mockTables({
      level_test_results: [],
      recommendations: [],
      lesson_progress: [
        {
          content_id: 'lesson-1',
          completed: true,
          progress_percent: 100,
          completed_at: '2026-05-25T00:00:00.000Z',
          learning_contents: { category_id: 'category-1' },
        },
      ],
    });

    const response = await fetch(`${origin}/api/progress`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.lessonProgress, [
      {
        categoryId: 'category-1',
        lessonId: 'lesson-1',
        completed: true,
        score: 100,
        completedDate: '2026-05-25T00:00:00.000Z',
      },
    ]);
  });

  it('returns authenticated payment history and dictionary bookmarks', async () => {
    mockAuth();
    mockTables({
      payments: [
        {
          id: 'payment-1',
          amount: 29900,
          months: 1,
          status: 'completed',
          transaction_id: 'txn-1',
          paid_at: '2026-05-25T00:00:00.000Z',
          created_at: '2026-05-25T00:00:00.000Z',
        },
      ],
      dictionary_bookmarks: [
        {
          id: 'bookmark-1',
          dictionary_words: { id: 'word-1', korean_word: '학교', mongolian_meaning: 'school' },
        },
      ],
    });

    const headers = { Authorization: 'Bearer test-token' };
    const paymentResponse = await fetch(`${origin}/api/payments`, { headers });
    const bookmarksResponse = await fetch(`${origin}/api/dictionary/bookmarks`, { headers });
    const paymentBody = await paymentResponse.json();
    const bookmarksBody = await bookmarksResponse.json();

    assert.equal(paymentResponse.status, 200);
    assert.equal(paymentBody.payments[0].status, 'completed');
    assert.equal(bookmarksResponse.status, 200);
    assert.equal(bookmarksBody.bookmarks[0].word.id, 'word-1');
  });

  it('returns a not-found response for unknown API paths', async () => {
    const response = await fetch(`${origin}/api/not-a-route`);

    assert.equal(response.status, 404);
  });
});
