import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/convert_grammar_json_to_csv.mjs <input.json> <output.csv>');
  process.exit(1);
}

const document = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const items = document?.channel?.item;

if (!Array.isArray(items)) {
  throw new Error('Expected channel.item to be an array.');
}

const PLACEHOLDER_TRANSLATION = '(Тохирох үг хэллэг байхгүй байна)';
const SOURCE = '한국어기초사전 (국립국어원)';
const LICENSE = 'CC BY-SA 2.0 KR';

const csvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const headers = [
  'source_word_no',
  'sense_no',
  'grammar_pattern',
  'part_of_speech',
  'korean_definition',
  'mongolian_translation',
  'mongolian_definition',
  'form_rule',
  'examples',
  'related_words',
  'source',
  'license',
  'is_active',
];

const rows = [];
let exampleCount = 0;
let missingMongolianDefinitionCount = 0;

for (const item of items) {
  const word = item?.wordInfo || {};
  const senses = item?.senseInfo?.senseDataList || [];

  senses.forEach((sense, senseIndex) => {
    const mongolian = (sense.multilanList || []).find(
      (translation) => translation.nation_code_name === '몽골어',
    );
    const examples = [];

    for (const listName of ['examList1', 'examList2', 'examList3', 'examList4']) {
      for (const example of sense.examList?.[listName] || []) {
        if (!example?.example) {
          continue;
        }

        examples.push({
          type: example.exa_type || null,
          text: example.example,
        });
      }
    }

    exampleCount += examples.length;
    if (!mongolian?.multi_definition) {
      missingMongolianDefinitionCount += 1;
    }

    const translation = mongolian?.multi_translation === PLACEHOLDER_TRANSLATION
      ? null
      : mongolian?.multi_translation || null;

    rows.push([
      word.word_no,
      senseIndex + 1,
      word.org_word,
      word.sp_code_name,
      sense.definition,
      translation,
      mongolian?.multi_definition || null,
      sense.sense_ref || word.word_reference || null,
      JSON.stringify(examples),
      JSON.stringify(sense.relatedWordsList || []),
      SOURCE,
      LICENSE,
      'true',
    ]);
  });
}

const uniqueKeys = new Set(rows.map((row) => `${row[0]}:${row[1]}`));
if (uniqueKeys.size !== rows.length) {
  throw new Error(`Duplicate source_word_no/sense_no keys: ${rows.length - uniqueKeys.size}`);
}

const csv = [headers, ...rows]
  .map((row) => row.map(csvValue).join(','))
  .join('\r\n');

fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\r\n`, 'utf8');

console.log(JSON.stringify({
  input: path.resolve(inputPath),
  output: path.resolve(outputPath),
  grammarHeads: items.length,
  rows: rows.length,
  examples: exampleCount,
  missingMongolianDefinitions: missingMongolianDefinitionCount,
}, null, 2));
