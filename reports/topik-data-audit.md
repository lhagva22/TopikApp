# TOPIK content audit — 2026-09-21

Read-only live audit of the configured Supabase project. Only `mock_test_bank`, `mock_test_questions`, and `level_test_rules` were selected. No users, profiles, sessions, results, or credentials were exported; no database rows were changed.

## Result

- 22 active exams: TOPIK I and II for editions 35, 36, 37, 41, 52, 60, 64, 83, 91, 96, 102.
- 1,870 questions: 880 listening + 990 reading. Every exam has the declared section/question counts.
- All sections have consecutive numbering without duplicates. The older imports use exam-global reading numbers (31–70 / 51–100); newer editions 64/83/91/96/102 use section-local numbers (1–40 / 1–50). This is a presentation inconsistency, not a missing-question error. Identify questions by UUID and section, never number alone.
- 352 unique public media URLs checked: 330 images + 22 audio files; all returned a successful HEAD response and the expected media type. There were no missing listening audio URLs or unresolved URL placeholders. This does not verify audio decoding, image correctness, or question timing.
- 1,869 questions have four nonempty distinct option values and a correct answer matching an option. One question is structurally unanswerable.
- 42 of 44 sections total 100 points; two reading sections total 101.

## Content needing correction

### TOPIK II 37, listening question 1

Exam UUID: `18f08fb2-cba5-40f1-bb18-5eb8b9a165b8`.
Question UUID: `85a4272a-3d40-457d-8f85-d71ac3e1e7a4`.

```json
{
  "options": ["", "", "", "듣기통합(1번～50번)"],
  "correct_answer_text": "①",
  "question_score": 2
}
```

Four option images exist and are reachable (`topik-ii-37/listening/q1_option_1.png` through `q1_option_4.png`). The current backend shuffles option/image pairs and grades by the option **text**. Selecting any image therefore cannot submit `①`; the three empty values also collide. Confirm the original answer sheet and restore four distinct labels aligned with the images. Do not change the correct answer merely to match an arbitrary existing value.

The local code now refuses to create this malformed exam session with HTTP 422 and a message identifying the question, before abandoning or creating a session. This protects new attempts; it does not repair the remote question or retroactively regrade prior attempts.

### TOPIK I 83 and 91: 201-point totals

| Exam | Live reading question | Live score | Local Python generator equivalent | Generator score |
|---|---:|---:|---|---:|
| TOPIK I 83 | 32 | 3 | `generate_topik_i_83_sql.py`, `READING_ANSWERS[62]` | 2 |
| TOPIK I 91 | 20 | 3 | `generate_topik_i_91_sql.py`, `READING_ANSWERS[50]` | 2 |

Both local Python reading answer maps sum to 100. The live reading maps each sum to 101, and these rows are candidate import errors. The repository also contains separate JavaScript importers for the same editions. The source PDFs/official keys have not been verified, so no score was changed automatically.

Impact: a perfect result can be 201, but TOPIK I level rules only cover 0–200. `determineLevelFromRules` then finds no matching rule, which can label a perfect result as undetermined. Until the original question scores are confirmed and corrected, these two exams are not ready for dependable placement classification.

### TOPIK II placement rules include an absent writing section

All eleven TOPIK II exams contain listening (100 points) and reading (100 points), with no writing questions. The stored rules require 230–300 for level 6. That level is unreachable with a maximum of 200. Applying the existing 300-point rules directly to a two-section test also makes lower classifications misleading.

Do not invent writing points or silently multiply results. Decide whether to add writing assessment or explicitly offer a separate, validated two-section estimate. The current audit flags the mismatch; rules and past results are unchanged.

The local exam-history code now derives the maximum from the imported question scores, matching submission scoring. A TOPIK II score of 160/200 consequently displays 80%, rather than the previous 160/300 = 53%. Historical interpretation still depends on the current question bank because attempts do not persist a point-total snapshot.

## Listening content limitations

All 880 listening prompts contain speaker markers/dialogue (`남자:`, `여자:`, etc.). The exam screen renders `question_text` directly, so the listening transcript is visible during the attempt. Separating the task prompt from a post-answer transcript is needed for a listening-only assessment. Automatically deleting dialogue is unsafe because several imported rows lack a separate task prompt.

Each exam reuses one full audio file for all its listening questions (22 distinct audio URLs total). The app question contract has no clip start/end metadata; users must seek within the full recording. The current data cannot directly provide short per-question listening practice without verified timestamps or new clips.

## Re-running

From the repository root:

```powershell
node backend/scripts/audit-topik-data.cjs
node backend/scripts/audit-topik-data.cjs --media
node --test backend/test/topik-audit.test.js
```

The script reads `backend/.env` privately. It prints JSON containing counts, per-exam summaries and errors. `--verbose` additionally lists every repeated warning. Media checks contact only the configured Supabase public storage origin; `--backend-url=http://127.0.0.1:5000` can explicitly allow local backend assets. Requests use six workers and 15-second timeouts; HEAD is used with a one-byte range GET fallback only for 405 responses.

Exit codes: 0 = no structural errors; 1 = content/media errors found (expected for the current database); 2 = audit could not run. A successful process is not equivalent to semantic answer-key approval.

## Validation and limits

- Backend compilation and 19 API regression tests passed, including correct history denominators and rejecting malformed choices before session writes.
- Audit regression tests cover malformed image choices, duplicated numbering, both valid numbering conventions, score/rule mismatches, and paginated reads.
- This audit checks structure, internal consistency, and public asset reachability. It does not certify all 1,870 answers against original official answer keys, verify OCR text/meaning, assess audio playback quality, or modify remote data.
