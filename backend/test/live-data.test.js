const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');

const { createApp } = require('../dist/server.js');

describe('live read-only database smoke test', () => {
  let server;
  let origin;

  before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    origin = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const expectSuccessfulCollection = async (path, collection) => {
    const response = await fetch(`${origin}${path}`);
    const body = await response.json();

    assert.equal(response.status, 200, `${path}: ${body.error || 'unexpected status'}`);
    assert.equal(body.success, true, path);
    assert.ok(Array.isArray(body[collection]), `${path} did not return ${collection}`);

    return body[collection];
  };

  it('reads seeded mock tests from the configured database', async () => {
    const exams = await expectSuccessfulCollection('/api/exams', 'exams');

    assert.ok(exams.length > 0, 'No active mock tests were returned from the database');
    assert.ok(exams.some((exam) => exam.exam_type === 'TOPIK_I'), 'No active TOPIK I exam was returned');
    assert.ok(exams.some((exam) => exam.exam_type === 'TOPIK_II'), 'No active TOPIK II exam was returned');
  });

  it('reads public learning and dictionary endpoints without errors', async () => {
    await expectSuccessfulCollection('/api/lesson-categories', 'categories');
    await expectSuccessfulCollection('/api/lessons', 'lessons');
    await expectSuccessfulCollection('/api/korean-grammar-lessons', 'lessons');
    await expectSuccessfulCollection('/api/video-categories', 'categories');
    await expectSuccessfulCollection('/api/video-lessons', 'lessons');
    await expectSuccessfulCollection('/api/dictionary/search?limit=1', 'words');
  });
});
