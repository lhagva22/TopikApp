const assert = require('node:assert/strict');
const { test } = require('node:test');
const { auditSnapshot, readAll } = require('../scripts/audit-topik-data.cjs');

const exam = { id: 'e1', exam_type: 'TOPIK_II', test_number: 37, total_questions: 2, listening_questions: 1, reading_questions: 1, is_active: true };
const question = (section, number) => ({
  id: `${section}-${number}`, mock_test_id: exam.id, section, question_number: number,
  question_text: 'Question', question_score: 100, options: ['A', 'B', 'C', 'D'], correct_answer_text: 'A',
  audio_url: section === 'listening' ? 'https://example.invalid/audio.mp3' : null,
});
const rules = [{ exam_type: 'TOPIK_II', min_score: 0, max_score: 200, determined_level: 2 }, { exam_type: 'TOPIK_I', min_score: 0, max_score: 200, determined_level: 1 }];

test('accepts both section-local and exam-global contiguous numbering', () => {
  for (const readingNumber of [1, 2]) {
    const result = auditSnapshot([exam], [question('listening', 1), question('reading', readingNumber)], rules);
    assert.equal(result.issues.filter((issue) => issue.severity === 'error').length, 0);
  }
  const duplicate = auditSnapshot([{ ...exam, total_questions: 3, reading_questions: 2 }], [question('listening', 1), question('reading', 1), question('reading', 1)], rules);
  assert.ok(duplicate.issues.some((issue) => issue.code === 'question_numbering'));
});

test('image choices still require distinct selectable values matching the answer', () => {
  const broken = { ...question('listening', 1), options: ['', '', '', 'header'], correct_answer_text: '①', option_image_urls: ['one.png', 'two.png', 'three.png', 'four.png'] };
  const result = auditSnapshot([exam], [broken, question('reading', 1)], rules);
  for (const code of ['invalid_options', 'duplicate_options', 'answer_not_in_options']) {
    assert.ok(result.issues.some((issue) => issue.code === code), code);
  }
});

test('detects point totals that disagree with the format and unreachable classification rules', () => {
  const result = auditSnapshot([exam], [question('listening', 1), { ...question('reading', 1), question_score: 101 }], [...rules, { exam_type: 'TOPIK_II', min_score: 230, max_score: 300, determined_level: 6 }]);
  assert.ok(result.issues.some((issue) => issue.code === 'section_score_total'));
  assert.ok(result.issues.some((issue) => issue.code === 'unreachable_level'));
  assert.ok(result.issues.some((issue) => issue.code === 'level_rule_gap_or_overlap'));
});

test('reads every page without assuming the first response contains the whole bank', async () => {
  const rows = Array.from({ length: 1001 }, (_, id) => ({ id }));
  const calls = [];
  const client = { from: (table) => {
    assert.equal(table, 'mock_test_questions');
    return { select: () => ({ order: () => ({ range: async (start, end) => {
      calls.push([start, end]);
      return { data: rows.slice(start, end + 1), error: null };
    } }) }) };
  } };
  assert.deepEqual(await readAll(client, 'mock_test_questions', 'id'), rows);
  assert.deepEqual(calls, [[0, 499], [500, 999], [1000, 1499]]);
});
