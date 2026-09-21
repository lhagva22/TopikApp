#!/usr/bin/env node
// Read-only content audit. Never selects user/profile/session/result data.
const path = require('node:path');

const PAGE_SIZE = 500;
const EXAM_COLUMNS = 'id,title,exam_type,test_number,total_questions,duration,listening_questions,reading_questions,is_active';
const QUESTION_COLUMNS = 'id,mock_test_id,section,question_number,question_text,question_image_url,options,option_image_urls,audio_url,correct_answer_text,question_score';
const RULE_COLUMNS = 'exam_type,min_score,max_score,determined_level';
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

async function readAll(client, table, columns) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(columns).order('id').range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.code || 'database read failed'}`);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

function auditSnapshot(exams, questions, rules) {
  const issues = [];
  const media = new Map();
  const add = (severity, code, exam, question, detail) => issues.push({
    severity, code, exam: exam ? `${exam.exam_type} #${exam.test_number}` : null,
    question: question ? `${question.section} #${question.question_number}` : null, detail,
  });
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const collectMedia = (url, type, exam, question) => {
    if (!hasText(url)) return;
    if (/__\w+__|example\.com|localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(url)) {
      add('error', 'placeholder_media_url', exam, question, url);
    }
    const item = media.get(url) || { url, type, references: [] };
    item.references.push(`${exam?.exam_type} #${exam?.test_number} ${question.section} #${question.question_number}`);
    media.set(url, item);
  };
  for (const question of questions) {
    const exam = examById.get(question.mock_test_id);
    if (!exam) add('error', 'orphan_question', null, question, 'Question references an absent exam');
    if (!['listening', 'reading'].includes(question.section)) add('error', 'invalid_section', exam, question, question.section);
    if (!hasText(question.question_text) && !hasText(question.question_image_url)) add('error', 'missing_prompt', exam, question, 'No text or image');
    if (!Number.isInteger(question.question_score) || question.question_score <= 0) add('error', 'invalid_score', exam, question, question.question_score);
    const options = Array.isArray(question.options) ? question.options : [];
    if (options.length !== 4 || options.some((option) => !hasText(option))) add('error', 'invalid_options', exam, question, 'Expected four nonempty option labels');
    if (new Set(options).size !== options.length) add('error', 'duplicate_options', exam, question, 'Text-based answer matching cannot distinguish identical options');
    if (!hasText(question.correct_answer_text) || !options.includes(question.correct_answer_text)) add('error', 'answer_not_in_options', exam, question, 'Correct answer must exactly match one option');
    if (question.option_image_urls != null && (!Array.isArray(question.option_image_urls) || question.option_image_urls.length !== options.length)) add('error', 'option_image_alignment', exam, question, 'Image slots must align with options');
    const text = [question.question_text, ...options].join(' ');
    if (/\bTODO\b|\bPLACEHOLDER\b|\bLorem ipsum\b|\bQuestion \d+\b|\uFFFD/i.test(text)) add('warning', 'possible_placeholder_text', exam, question, 'Manual text review required');
    if (question.section === 'listening' && !hasText(question.audio_url)) add('error', 'missing_audio', exam, question, 'Listening question has no audio');
    if (question.section === 'listening' && /(?:남자|여자|남|여)\s*[:：]/u.test(question.question_text || '')) add('warning', 'listening_transcript_visible', exam, question, 'Speaker dialogue occurs in the question prompt; may reveal listening content');
    collectMedia(question.question_image_url, 'image', exam, question);
    for (const url of Array.isArray(question.option_image_urls) ? question.option_image_urls : []) collectMedia(url, 'image', exam, question);
    collectMedia(question.audio_url, 'audio', exam, question);
  }
  const examSummaries = exams.map((exam) => {
    const rows = questions.filter((question) => question.mock_test_id === exam.id);
    const sections = {};
    if (rows.length !== exam.total_questions) add('error', 'question_count', exam, null, `Expected ${exam.total_questions}; found ${rows.length}`);
    if (exam.total_questions !== exam.listening_questions + exam.reading_questions) add('error', 'section_metadata', exam, null, 'Section counts do not add up');
    for (const section of ['listening', 'reading']) {
      const sectionRows = rows.filter((question) => question.section === section);
      const count = exam[`${section}_questions`];
      const continuedStart = section === 'reading' ? exam.listening_questions + 1 : 1;
      const numbers = sectionRows.map((question) => question.question_number).sort((a, b) => a - b);
      // Imports use both original section-local and exam-global numbering.
      const start = section === 'reading' && numbers[0] === 1 ? 1 : continuedStart;
      const expected = Array.from({ length: count }, (_, index) => start + index);
      if (JSON.stringify(numbers) !== JSON.stringify(expected)) add('error', 'question_numbering', exam, null, `${section}: expected consecutive ${start}–${start + count - 1}; found ${numbers.join(',')}`);
      const score = sectionRows.reduce((sum, question) => sum + (question.question_score || 0), 0);
      if (score !== 100) add('error', 'section_score_total', exam, null, `${section}: expected 100 points; found ${score}`);
      sections[section] = { questions: sectionRows.length, maxScore: score, firstQuestion: numbers[0], lastQuestion: numbers.at(-1) };
    }
    const audioUrls = new Set(rows.filter((question) => question.section === 'listening').map((question) => question.audio_url).filter(Boolean));
    if (audioUrls.size === 1 && exam.listening_questions > 1) add('warning', 'shared_full_exam_audio', exam, null, 'All listening questions share one audio URL; no per-question clip/timing fields in the app question schema');
    return { exam: `${exam.exam_type} #${exam.test_number}`, active: exam.is_active, questions: rows.length, ...sections, distinctAudioFiles: audioUrls.size };
  });
  for (const examType of ['TOPIK_I', 'TOPIK_II']) {
    const typeRules = rules.filter((rule) => rule.exam_type === examType).sort((a, b) => a.min_score - b.min_score);
    const typeSummaries = examSummaries.filter((exam) => exam.exam.startsWith(`${examType} #`));
    const maxScore = Math.max(0, ...typeSummaries.map((exam) => exam.listening.maxScore + exam.reading.maxScore));
    if (!typeRules.length) add('error', 'missing_level_rules', null, null, `${examType}: no classification rules`);
    let nextScore = 0;
    for (const rule of typeRules) {
      if (rule.min_score !== nextScore || rule.max_score < rule.min_score) add('error', 'level_rule_gap_or_overlap', null, null, `${examType}: ${rule.min_score}–${rule.max_score}`);
      if (rule.min_score > maxScore) add('error', 'unreachable_level', null, null, `${examType} level ${rule.determined_level} needs ${rule.min_score}, but available questions total ${maxScore}`);
      nextScore = rule.max_score + 1;
    }
    if (maxScore && nextScore <= maxScore) add('error', 'uncovered_level_score', null, null, `${examType}: rules stop before ${maxScore}`);
  }
  return { examSummaries, issues, media: Array.from(media.values()) };
}

async function checkMedia(media, storageOrigin, backendOrigin) {
  // Only contact configured project storage or an explicitly supplied backend.
  const results = new Array(media.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (nextIndex < media.length) {
      const index = nextIndex++;
      const item = media[index];
      let url;
      try { url = new URL(item.url, backendOrigin || undefined); } catch {
        results[index] = { ...item, status: 'not_checked', reason: 'Relative/invalid URL; use --backend-url for local assets' };
        continue;
      }
      const allowed = (url.origin === storageOrigin && url.pathname.startsWith('/storage/v1/object/public/')) || (backendOrigin && url.origin === backendOrigin);
      if (!allowed) {
        results[index] = { ...item, status: 'not_checked', reason: 'URL is outside configured public storage/backend' };
        continue;
      }
      try {
        let response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
        if (response.status === 405) response = await fetch(url, { headers: { Range: 'bytes=0-0' }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
        const contentType = response.headers.get('content-type') || '';
        const validType = item.type === 'image' ? contentType.startsWith('image/') : contentType.startsWith('audio/') || contentType === 'application/octet-stream';
        results[index] = { ...item, status: response.ok && validType ? 'ok' : 'failed', httpStatus: response.status, contentType, bytes: response.headers.get('content-length') };
        await response.body?.cancel();
      } catch (error) {
        results[index] = { ...item, status: 'failed', reason: error.name || 'request_failed' };
      }
    }
  }));
  return results;
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
  const { createClient } = require('@supabase/supabase-js');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env');
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const [exams, questions, rules] = await Promise.all([
    readAll(client, 'mock_test_bank', EXAM_COLUMNS), readAll(client, 'mock_test_questions', QUESTION_COLUMNS), readAll(client, 'level_test_rules', RULE_COLUMNS),
  ]);
  const audit = auditSnapshot(exams, questions, rules);
  const backendOption = process.argv.find((arg) => arg.startsWith('--backend-url='));
  const backendOrigin = backendOption ? new URL(backendOption.slice('--backend-url='.length)).origin : undefined;
  const mediaChecks = process.argv.includes('--media') ? await checkMedia(audit.media, new URL(process.env.SUPABASE_URL).origin, backendOrigin) : [];
  const issueCounts = audit.issues.reduce((counts, issue) => { counts[issue.code] = (counts[issue.code] || 0) + 1; return counts; }, {});
  const report = {
    checkedAt: new Date().toISOString(), readOnly: true, tables: ['mock_test_bank', 'mock_test_questions', 'level_test_rules'],
    counts: { exams: exams.length, activeExams: exams.filter((exam) => exam.is_active).length, questions: questions.length, uniqueMedia: audit.media.length },
    issueCounts, exams: audit.examSummaries,
    // Repeated warnings are counted above; include every row only on request.
    issues: process.argv.includes('--verbose') ? audit.issues : audit.issues.filter((issue) => issue.severity === 'error'),
    mediaSummary: { checked: mediaChecks.length, ok: mediaChecks.filter((item) => item.status === 'ok').length, failed: mediaChecks.filter((item) => item.status === 'failed').length, notChecked: mediaChecks.filter((item) => item.status === 'not_checked').length },
    mediaProblems: mediaChecks.filter((item) => item.status !== 'ok'),
    limitations: ['No original PDF/answer-key semantic comparison.', 'HEAD/content-type checks do not prove playback or visual correctness.', 'No learner data was selected or changed.'],
  };
  console.log(JSON.stringify(report, null, 2));
  if (audit.issues.some((issue) => issue.severity === 'error') || mediaChecks.some((item) => item.status === 'failed')) process.exitCode = 1;
}

module.exports = { auditSnapshot, checkMedia, readAll };
if (require.main === module) main().catch((error) => { console.error(`Audit failed: ${error.message}`); process.exitCode = 2; });
