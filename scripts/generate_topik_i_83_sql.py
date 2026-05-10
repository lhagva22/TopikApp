from __future__ import annotations

import json
import re
from pathlib import Path

from topik_scanned_ocr_utils import (
    get_page_texts,
    normalize_text,
    split_block,
    sql_json_array,
    sql_string,
)


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"

LISTENING_PDF = DOWNLOADS / "83rd-TOPIK-I-Listening-Transcript.pdf"
READING_PDF = DOWNLOADS / "83rd-TOPIK-I-Reading-Test-Paper.pdf"
LISTENING_AUDIO = DOWNLOADS / "83-TOPIK-I-Listening-Audio-File.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_i_83.sql"
OCR_CACHE_ROOT = ROOT / "topik_i_83_assets" / "ocr_cache"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = LISTENING_AUDIO.name
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-i-83/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_I' AND test_number = 83 "
    "ORDER BY created_at DESC LIMIT 1)"
)

LISTENING_PATTERN = re.compile(r"(?<!\d)([1-2]?\d|30)[\.\|]+")
READING_PATTERN = re.compile(r"(?<!\d)(3[1-9]|[4-6]\d|70)[\.\|]+")

LISTENING_PAGE_MAP = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9, 10],
    4: [11, 12, 13, 14],
    6: [17, 18],
    7: [19, 20],
    8: [21, 22],
    9: [23, 24],
    10: [25, 26],
    11: [27, 28],
    12: [29, 30],
}

READING_PAGE_MAP = {
    1: [31, 32, 33],
    2: [34, 35, 36, 37],
    3: [38, 39, 40],
    4: [41, 42],
    5: [43, 44, 45],
    6: [46, 47, 48],
    7: [49, 50],
    8: [51, 52],
    9: [53, 54],
    10: [55, 56],
    11: [57, 58],
    12: [59, 60],
    13: [61, 62],
    14: [63, 64],
    15: [65, 66],
    16: [67, 68],
    17: [69, 70],
}

LISTENING_ANSWERS = {
    1: (1, 4), 2: (4, 4), 3: (3, 3), 4: (4, 3), 5: (2, 4), 6: (3, 3), 7: (4, 3), 8: (2, 3), 9: (1, 3), 10: (2, 4),
    11: (2, 3), 12: (3, 3), 13: (2, 4), 14: (1, 3), 15: (1, 4), 16: (4, 4), 17: (1, 3), 18: (3, 3), 19: (2, 3), 20: (3, 3),
    21: (4, 3), 22: (4, 3), 23: (3, 3), 24: (4, 3), 25: (3, 3), 26: (1, 4), 27: (2, 3), 28: (1, 4), 29: (4, 3), 30: (3, 4),
}

READING_ANSWERS = {
    31: (2, 2), 32: (1, 2), 33: (2, 2), 34: (1, 2), 35: (2, 2), 36: (3, 2), 37: (2, 3), 38: (1, 3), 39: (2, 2), 40: (4, 3),
    41: (1, 3), 42: (4, 3), 43: (3, 3), 44: (2, 2), 45: (3, 3), 46: (4, 3), 47: (4, 3), 48: (3, 2), 49: (2, 2), 50: (1, 2),
    51: (3, 3), 52: (4, 2), 53: (4, 2), 54: (2, 3), 55: (2, 2), 56: (1, 3), 57: (3, 3), 58: (1, 2), 59: (3, 2), 60: (3, 3),
    61: (4, 2), 62: (4, 2), 63: (2, 2), 64: (3, 3), 65: (4, 2), 66: (1, 3), 67: (3, 3), 68: (1, 3), 69: (1, 3), 70: (4, 3),
}

LISTENING_OPTION_IMAGE_URLS = {
    15: [f"{STORAGE_BASE_URL}/topik-i-83/listening/q15_option_{index}.png" for index in range(1, 5)],
    16: [f"{STORAGE_BASE_URL}/topik-i-83/listening/q16_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    40: f"{STORAGE_BASE_URL}/topik-i-83/reading/q40.png",
    41: f"{STORAGE_BASE_URL}/topik-i-83/reading/q41.png",
    42: f"{STORAGE_BASE_URL}/topik-i-83/reading/q42.png",
    63: f"{STORAGE_BASE_URL}/topik-i-83/reading/q63.png",
    64: f"{STORAGE_BASE_URL}/topik-i-83/reading/q64.png",
}

LISTENING_FULL_OVERRIDES = {
    11: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["나라", "가족", "이름", "주말"],
    },
    12: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["취미", "날씨", "시간", "음식"],
    },
    13: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["직업", "운동", "날짜", "고향"],
    },
    14: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["가격", "날씨", "위치", "계절"],
    },
    15: {
        "stem": "다음을 듣고 가장 알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
    16: {
        "stem": "다음을 듣고 가장 알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
}

READING_TEXT_OVERRIDES = {
    40: "다음을 읽고 맞지 않는 것을 고르십시오.",
    41: "다음을 읽고 맞지 않는 것을 고르십시오.",
    42: "다음을 읽고 맞지 않는 것을 고르십시오.",
}

READING_FULL_OVERRIDES = {
    40: {"stem": "다음을 읽고 맞지 않는 것을 고르십시오.", "options": ["①", "②", "③", "④"]},
    41: {"stem": "다음을 읽고 맞지 않는 것을 고르십시오.", "options": ["①", "②", "③", "④"]},
    42: {"stem": "다음을 읽고 맞지 않는 것을 고르십시오.", "options": ["①", "②", "③", "④"]},
}


FALLBACK_OPTION_MARKERS = [
    "①", "②", "③", "④",
    "01)", "1)", "0)", "0 ", "3)", "8)", "9)",
    "(3)", "(8)", "(9)", "08", "09",
    "<)", "<", "@D", "QD", "@)", "@", "©", "®", "ª",
    "\u00a9", "\u00ae", "BA)",
]
DEFAULT_OPTIONS = ["①", "②", "③", "④"]


def clean_lines(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if "한국어능력시험" in line or "TOPIK" in line:
            continue
        if line.isdigit():
            continue
        lines.append(line)
    return normalize_text("\n".join(lines))


def build_blocks_no_prefix(page_texts: dict[int, str], expected_by_page: dict[int, list[int]], pattern: re.Pattern[str]) -> dict[int, str]:
    blocks: dict[int, str] = {}
    for page_number, expected_numbers in expected_by_page.items():
        text = page_texts[page_number]
        matches = list(pattern.finditer(text))
        if not matches:
            raise ValueError(f"Missing OCR matches on page {page_number} for questions {expected_numbers}")
        if len(matches) != len(expected_numbers):
            if len(matches) > len(expected_numbers):
                matches = matches[: len(expected_numbers)]
            elif len(matches) + 1 == len(expected_numbers):
                starts = [match.start() for match in matches]
                generic_blocks = [text[: starts[0]]]
                generic_blocks.extend(
                    text[starts[index] : starts[index + 1]] if index + 1 < len(starts) else text[starts[index] :]
                    for index in range(len(starts))
                )
                if len(generic_blocks) != len(expected_numbers):
                    raise ValueError(
                        f"Could not recover page {page_number}: expected {expected_numbers}, produced {len(generic_blocks)} blocks"
                    )
                for expected_number, block_text in zip(expected_numbers, generic_blocks, strict=False):
                    blocks[expected_number] = normalize_text(block_text)
                continue
            else:
                raise ValueError(
                    f"Question count mismatch on page {page_number}: expected {expected_numbers}, found {len(matches)} matches"
                )
        for index, expected_number in enumerate(expected_numbers):
            start = matches[index].start()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            blocks[expected_number] = normalize_text(text[start:end])
    return blocks


def to_answer_text(options: list[str], answer_index: int) -> str:
    if 1 <= answer_index <= len(options):
        return options[answer_index - 1]
    return str(answer_index)


def recover_options_from_ocr(body: str) -> tuple[str, list[str]]:
    pattern = re.compile("|".join(re.escape(marker) for marker in FALLBACK_OPTION_MARKERS))
    matches = list(pattern.finditer(body))
    if len(matches) < 4:
        return body, []

    matches = matches[:4]
    stem = normalize_text(body[: matches[0].start()])
    options: list[str] = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        option = normalize_text(body[start:end])
        if option:
            options.append(option)

    return stem or normalize_text(body), options


def finalize_question(block_text: str, stem: str, options: list[str]) -> dict[str, object]:
    if len(options) == 4:
        return {"stem": stem, "options": options}

    recovered_stem, recovered_options = recover_options_from_ocr(block_text)
    if len(recovered_options) == 4:
        return {"stem": recovered_stem, "options": recovered_options}

    return {"stem": normalize_text(block_text), "options": DEFAULT_OPTIONS.copy()}


def load_blocks() -> tuple[dict[int, dict[str, object]], dict[int, dict[str, object]]]:
    listening_pages = get_page_texts(
        LISTENING_PDF,
        range(1, 13),
        OCR_CACHE_ROOT / "listening",
        clean_lines,
        scale=2.0,
        psm=6,
    )
    reading_pages = get_page_texts(
        READING_PDF,
        range(1, 18),
        OCR_CACHE_ROOT / "reading",
        clean_lines,
        scale=2.0,
        psm=6,
    )

    listening_blocks = build_blocks_no_prefix(listening_pages, LISTENING_PAGE_MAP, LISTENING_PATTERN)
    reading_blocks = build_blocks_no_prefix(reading_pages, READING_PAGE_MAP, READING_PATTERN)

    listening_questions: dict[int, dict[str, object]] = {}
    for question_number in range(1, 31):
        if question_number in LISTENING_FULL_OVERRIDES and "options" in LISTENING_FULL_OVERRIDES[question_number]:
            override = LISTENING_FULL_OVERRIDES[question_number]
            listening_questions[question_number] = {
                "stem": override["stem"],
                "options": override["options"],
            }
            continue
        stem, options = split_block(listening_blocks[question_number])
        if question_number in LISTENING_FULL_OVERRIDES:
            stem = str(LISTENING_FULL_OVERRIDES[question_number]["stem"])
        listening_questions[question_number] = finalize_question(listening_blocks[question_number], stem, options)

    reading_questions: dict[int, dict[str, object]] = {}
    for question_number in range(31, 71):
        if question_number in READING_FULL_OVERRIDES:
            override = READING_FULL_OVERRIDES[question_number]
            reading_questions[question_number] = {"stem": override["stem"], "options": override["options"]}
            continue
        stem, options = split_block(reading_blocks[question_number])
        if question_number in READING_TEXT_OVERRIDES:
            stem = READING_TEXT_OVERRIDES[question_number]
        reading_questions[question_number] = finalize_question(reading_blocks[question_number], stem, options)

    return listening_questions, reading_questions


def question_row(
    section: str,
    question_number: int,
    question_text: str,
    options: list[str],
    score: int,
    answer_index: int,
    question_image_url: str | None = None,
    option_image_urls: list[str] | None = None,
    audio_url: str | None = None,
) -> str:
    return (
        f"  ({MOCK_TEST_ID_SQL}, {sql_string(section)}, {question_number}, "
        f"{sql_string(question_text)}, {sql_string(question_image_url)}, {sql_string(audio_url)}, "
        f"{sql_json_array(option_image_urls) if option_image_urls is not None else 'NULL'}, "
        f"{sql_json_array(options)}, {score}, {sql_string(to_answer_text(options, answer_index))}, NULL)"
    )


def build_sql() -> str:
    listening_questions, reading_questions = load_blocks()
    rows: list[str] = []

    for question_number in range(1, 31):
        answer_index, score = LISTENING_ANSWERS[question_number]
        row = question_row(
            "listening",
            question_number,
            str(listening_questions[question_number]["stem"]),
            list(listening_questions[question_number]["options"]),
            score,
            answer_index,
            option_image_urls=LISTENING_OPTION_IMAGE_URLS.get(question_number),
            audio_url=AUDIO_URL,
        )
        rows.append(row)

    for question_number in range(31, 71):
        answer_index, score = READING_ANSWERS[question_number]
        row = question_row(
            "reading",
            question_number,
            str(reading_questions[question_number]["stem"]),
            list(reading_questions[question_number]["options"]),
            score,
            answer_index,
            question_image_url=READING_IMAGE_URLS.get(question_number),
        )
        rows.append(row)

    values_sql = ",\n".join(rows)
    return "\n".join(
        [
            "-- Generated by scripts/generate_topik_i_83_sql.py",
            "BEGIN;",
            "",
            "INSERT INTO mock_test_bank (",
            "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
            ")",
            "SELECT",
            "  'TOPIK I 83-р шалгалт',",
            "  'TOPIK_I',",
            "  83,",
            "  '83-р албан ёсны TOPIK I шалгалт',",
            "  70,",
            "  100,",
            "  30,",
            "  40",
            "WHERE NOT EXISTS (",
            "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 83",
            ");",
            "",
            "UPDATE mock_test_bank SET title = 'TOPIK I 83-р шалгалт', description = '83-р албан ёсны TOPIK I шалгалт', total_questions = 70, duration = 100, listening_questions = 30, reading_questions = 40, updated_at = NOW() WHERE id = (SELECT id FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 83 ORDER BY created_at DESC LIMIT 1);",
            "",
            "DELETE FROM mock_test_questions WHERE mock_test_id = (SELECT id FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 83 ORDER BY created_at DESC LIMIT 1);",
            "",
            "INSERT INTO mock_test_questions (",
            "  mock_test_id,",
            "  section,",
            "  question_number,",
            "  question_text,",
            "  question_image_url,",
            "  audio_url,",
            "  option_image_urls,",
            "  options,",
            "  question_score,",
            "  correct_answer_text,",
            "  explanation",
            ") VALUES",
            f"{values_sql};",
            "",
            "COMMIT;",
            "",
        ]
    )


def main() -> None:
    OUTPUT_SQL.write_text(build_sql(), encoding="utf-8")


if __name__ == "__main__":
    main()
