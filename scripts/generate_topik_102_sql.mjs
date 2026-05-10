import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'backend', 'sql', 'mock_tests');

const STORAGE_BASE_URL =
  'https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files';

const CIRCLED_OPTIONS = ['①', '②', '③', '④'];

const EXAMS = [
  {
    examType: 'TOPIK_I',
    testNumber: 102,
    title: 'TOPIK I 102-р шалгалт',
    description: '102-р албан ёсны TOPIK I шалгалт',
    totalQuestions: 70,
    duration: 100,
    listeningQuestions: 30,
    readingQuestions: 40,
    folder: 'topik-i-102',
    audioFileName: '102-TOPIK-I-Listening-Audio-File.mp3',
    listeningPageUrl: 'https://www.topikguide.com/mock-tests/102-TOPIK-I-Listening-Mock-Test.html',
    readingPageUrl: 'https://www.topikguide.com/mock-tests/102-TOPIK-I-Reading-Mock-Test.html',
    outputSqlPath: path.join(OUTPUT_DIR, 'topik_i_102.sql'),
  },
  {
    examType: 'TOPIK_II',
    testNumber: 102,
    title: 'TOPIK II 102-р шалгалт',
    description: '102-р албан ёсны TOPIK II шалгалт',
    totalQuestions: 100,
    duration: 130,
    listeningQuestions: 50,
    readingQuestions: 50,
    folder: 'topik-ii-102',
    audioFileName: '102-TOPIK-II-Listening-Audio-File.mp3',
    listeningPageUrl: 'https://www.topikguide.com/mock-tests/102-TOPIK-II-Listening-Mock-Test.html',
    readingPageUrl: 'https://www.topikguide.com/mock-tests/102-TOPIK-II-Reading-Mock-Test.html',
    outputSqlPath: path.join(OUTPUT_DIR, 'topik_ii_102.sql'),
  },
];

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

function toSqlText(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  return `'${escapeSqlString(value)}'`;
}

function toSqlJson(value) {
  return `'${escapeSqlString(JSON.stringify(value))}'::jsonb`;
}

function decodeHtml(value) {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value) {
  return decodeHtml(String(value)).replace(/<[^>]+>/g, ' ');
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const source = Array.isArray(value) ? value.join('\n') : String(value);
  return decodeHtml(source)
    .replace(/\r/g, '\n')
    .replace(/\|/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanPrompt(value) {
  let text = normalizeText(value);
  text = text.replace(/\(\s*\d+\s*점\s*\)/g, '').trim();
  if (!text || /^[()\s\d점]+$/.test(text)) {
    return '';
  }
  return text;
}

function extractGroupPrompt(groupHeader) {
  if (!Object.prototype.hasOwnProperty.call(groupHeader ?? {}, 'length') && !groupHeader) {
    return '';
  }

  const safeHeader = String(groupHeader).replace(/&lt;/g, '〈').replace(/&gt;/g, '〉');
  const match = safeHeader.match(/<p[^>]*>(.*?)<\/p>/i);
  let text = stripHtml(match ? match[1] : safeHeader);
  text = text.replace(/^※\s*\[[^\]]+\]\s*/, '').trim();
  text = text.replace(/\(\s*각?\s*\d+\s*점\s*\)\s*$/u, '').trim();
  return cleanPrompt(text);
}

function joinParts(parts) {
  return parts.map(normalizeText).filter(Boolean).join('\n\n').trim();
}

function encodePath(relativePath) {
  return relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function buildStorageUrl(folder, relativePath) {
  return `${STORAGE_BASE_URL}/${folder}/${encodePath(relativePath)}`;
}

function getFileExtension(sourceUrl, fallback = '.png') {
  try {
    const pathname = new URL(sourceUrl).pathname;
    const ext = path.extname(pathname);
    return ext || fallback;
  } catch {
    return fallback;
  }
}

function extractAppObject(html) {
  const markerIndex = html.indexOf('const app = {');
  if (markerIndex === -1) {
    throw new Error('Could not find app object in page HTML.');
  }

  const braceStart = html.indexOf('{', markerIndex);
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let index = braceStart; index < html.length; index += 1) {
    const char = html[index];
    const next = html[index + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inSingle) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === "'") {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inTemplate) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '`') {
        inTemplate = false;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      continue;
    }

    if (char === '`') {
      inTemplate = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return html.slice(braceStart, index + 1);
      }
    }
  }

  throw new Error('Could not locate the end of the app object.');
}

async function loadPageData(pageUrl) {
  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${pageUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const objectText = extractAppObject(html);
  const app = Function('LOGO_URL', `return (${objectText});`)('');

  return {
    questions: app.questions,
    answers: app.answers,
  };
}

function addManifestAsset(collection, dedupe, asset) {
  if (dedupe.has(asset.target_path)) {
    return;
  }

  dedupe.add(asset.target_path);
  collection.push(asset);
}

function resolvePrompt(question, groupPrompt) {
  return cleanPrompt(question) || groupPrompt || '';
}

function buildListeningRows(exam, pageData, assetCollection, dedupe) {
  const audioUrl = buildStorageUrl(exam.folder, `audio/${exam.audioFileName}`);
  addManifestAsset(assetCollection, dedupe, {
    kind: 'audio',
    exam_type: exam.examType,
    target_path: `${exam.folder}/audio/${exam.audioFileName}`,
    source: 'local-audio-file',
  });

  const rows = [];
  let groupPrompt = '';
  let groupTranscript = '';

  for (const question of pageData.questions) {
    if (Object.prototype.hasOwnProperty.call(question, 'groupHeader')) {
      groupPrompt = extractGroupPrompt(question.groupHeader);
      groupTranscript = '';
    }

    const ownTranscript = normalizeText(question.transcript);
    if (ownTranscript) {
      groupTranscript = ownTranscript;
    }

    const effectiveTranscript = ownTranscript || groupTranscript;
    const prompt = resolvePrompt(question.question, groupPrompt);
    const questionText = joinParts([prompt, effectiveTranscript]);

    const sourceOptions = Array.isArray(question.sequences) ? question.sequences : question.options;
    const optionImages =
      Array.isArray(sourceOptions) &&
      sourceOptions.length === 4 &&
      sourceOptions.every((item) => typeof item === 'string' && /^https?:\/\//.test(item));

    let options = sourceOptions;
    let optionImageUrls = null;

    if (optionImages) {
      options = [...CIRCLED_OPTIONS];
      optionImageUrls = sourceOptions.map((sourceUrl, index) => {
        const ext = getFileExtension(sourceUrl);
        const relativePath = `listening/q${question.num}_option_${index + 1}${ext}`;
        const targetPath = `${exam.folder}/${relativePath}`;
        addManifestAsset(assetCollection, dedupe, {
          kind: 'option_image',
          exam_type: exam.examType,
          section: 'listening',
          question_number: question.num,
          option_number: index + 1,
          target_path: targetPath,
          source_url: sourceUrl,
        });
        return buildStorageUrl(exam.folder, relativePath);
      });
    }

    const answerIndex = Number(pageData.answers[String(question.num)]);
    const correctAnswerText = options[answerIndex - 1];

    rows.push({
      section: 'listening',
      questionNumber: question.num,
      questionText,
      questionImageUrl: null,
      audioUrl,
      optionImageUrls,
      options,
      questionScore: question.points,
      correctAnswerText,
      explanation: null,
    });
  }

  return rows;
}

function buildReadingRows(exam, pageData, assetCollection, dedupe) {
  const rows = [];
  let groupPrompt = '';
  let groupText = '';
  let groupImageUrl = null;

  for (const question of pageData.questions) {
    if (Object.prototype.hasOwnProperty.call(question, 'groupHeader')) {
      groupPrompt = extractGroupPrompt(question.groupHeader);
      groupText = '';
      groupImageUrl = null;
    }

    const prompt = resolvePrompt(question.question, groupPrompt);
    const ownText = normalizeText(question.context);
    if (ownText) {
      groupText = ownText;
    }

    let ownImageUrl = null;
    if (question.image) {
      const ext = getFileExtension(question.image);
      const relativePath = `reading/q${question.num}${ext}`;
      const targetPath = `${exam.folder}/${relativePath}`;
      addManifestAsset(assetCollection, dedupe, {
        kind: 'question_image',
        exam_type: exam.examType,
        section: 'reading',
        question_number: question.num,
        target_path: targetPath,
        source_url: question.image,
      });
      ownImageUrl = buildStorageUrl(exam.folder, relativePath);
      groupImageUrl = ownImageUrl;
    }

    const effectiveText = ownText || (!ownImageUrl ? groupText : '');
    const effectiveImageUrl = ownImageUrl || (!effectiveText ? groupImageUrl : null);

    const sourceOptions = Array.isArray(question.sequences) ? question.sequences : question.options;
    const pieces = [prompt];

    if (question.insert_sentence) {
      pieces.push(`주어진 문장: ${normalizeText(question.insert_sentence)}`);
    }

    if (effectiveText) {
      pieces.push(effectiveText);
    }

    const questionText = joinParts(pieces);
    const answerIndex = Number(pageData.answers[String(question.num)]);
    const correctAnswerText = sourceOptions[answerIndex - 1];

    rows.push({
      section: 'reading',
      questionNumber: question.num,
      questionText,
      questionImageUrl: effectiveImageUrl,
      audioUrl: null,
      optionImageUrls: null,
      options: sourceOptions,
      questionScore: question.points,
      correctAnswerText,
      explanation: null,
    });
  }

  return rows;
}

function buildSql(exam, rows) {
  const mockTestIdSql =
    `(SELECT id FROM mock_test_bank ` +
    `WHERE exam_type = '${exam.examType}' AND test_number = ${exam.testNumber} ` +
    `ORDER BY created_at DESC LIMIT 1)`;

  const values = rows
    .map((row) => {
      const optionImagesSql = row.optionImageUrls ? toSqlJson(row.optionImageUrls) : 'NULL';
      return `  (${mockTestIdSql}, ${toSqlText(row.section)}, ${row.questionNumber}, ${toSqlText(
        row.questionText,
      )}, ${toSqlText(row.questionImageUrl)}, ${toSqlText(row.audioUrl)}, ${optionImagesSql}, ${toSqlJson(
        row.options,
      )}, ${row.questionScore}, ${toSqlText(row.correctAnswerText)}, ${toSqlText(row.explanation)})`;
    })
    .join(',\n');

  return `-- Generated by scripts/generate_topik_102_sql.mjs
BEGIN;

INSERT INTO mock_test_bank (
  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions
)
SELECT
  ${toSqlText(exam.title)},
  ${toSqlText(exam.examType)},
  ${exam.testNumber},
  ${toSqlText(exam.description)},
  ${exam.totalQuestions},
  ${exam.duration},
  ${exam.listeningQuestions},
  ${exam.readingQuestions}
WHERE NOT EXISTS (
  SELECT 1 FROM mock_test_bank WHERE exam_type = ${toSqlText(exam.examType)} AND test_number = ${exam.testNumber}
);

UPDATE mock_test_bank
SET
  title = ${toSqlText(exam.title)},
  description = ${toSqlText(exam.description)},
  total_questions = ${exam.totalQuestions},
  duration = ${exam.duration},
  listening_questions = ${exam.listeningQuestions},
  reading_questions = ${exam.readingQuestions},
  updated_at = NOW()
WHERE id = ${mockTestIdSql};

DELETE FROM mock_test_questions WHERE mock_test_id = ${mockTestIdSql};

INSERT INTO mock_test_questions (
  mock_test_id,
  section,
  question_number,
  question_text,
  question_image_url,
  audio_url,
  option_image_urls,
  options,
  question_score,
  correct_answer_text,
  explanation
) VALUES
${values};

COMMIT;
`;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const assetManifest = {
    generated_at: new Date().toISOString(),
    exams: [],
  };

  for (const exam of EXAMS) {
    const [listeningData, readingData] = await Promise.all([
      loadPageData(exam.listeningPageUrl),
      loadPageData(exam.readingPageUrl),
    ]);

    const assetCollection = [];
    const dedupe = new Set();

    const listeningRows = buildListeningRows(exam, listeningData, assetCollection, dedupe);
    const readingRows = buildReadingRows(exam, readingData, assetCollection, dedupe);
    const rows = [...listeningRows, ...readingRows];

    if (listeningRows.length !== exam.listeningQuestions) {
      throw new Error(
        `${exam.examType} listening question count mismatch: expected ${exam.listeningQuestions}, got ${listeningRows.length}`,
      );
    }

    if (readingRows.length !== exam.readingQuestions) {
      throw new Error(
        `${exam.examType} reading question count mismatch: expected ${exam.readingQuestions}, got ${readingRows.length}`,
      );
    }

    const sql = buildSql(exam, rows);
    await fs.writeFile(exam.outputSqlPath, sql, 'utf8');

    assetManifest.exams.push({
      exam_type: exam.examType,
      test_number: exam.testNumber,
      folder: exam.folder,
      audio_file_name: exam.audioFileName,
      assets: assetCollection,
    });
  }

  const manifestPath = path.join(OUTPUT_DIR, 'topik_102_asset_manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(assetManifest, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
