from __future__ import annotations

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

LISTENING_PDF = DOWNLOADS / "83rd-TOPIK-II-Listening-Transcript.pdf"
READING_PDF = DOWNLOADS / "83rd-TOPIK-II-Reading-Test-Paper.pdf"
LISTENING_AUDIO = DOWNLOADS / "83-TOPIK-II-Listening-Audio-File.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_ii_83.sql"
OCR_CACHE_ROOT = ROOT / "topik_ii_83_assets" / "ocr_cache"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = LISTENING_AUDIO.name
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-ii-83/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_II' AND test_number = 83 "
    "ORDER BY created_at DESC LIMIT 1)"
)

LISTENING_PATTERN = re.compile(r"(?<!\d)([1-4]?\d|50)[\.\|]+")
READING_PATTERN = re.compile(r"(?<!\d)([1-4]?\d|50)[\.\|]+")

LISTENING_PAGE_MAP = {
    1: [1],
    2: [2],
    3: [3],
    4: [4, 5, 6],
    5: [7, 8],
    6: [9, 10],
    7: [11, 12],
    8: [13, 14],
    9: [15, 16],
    10: [17, 18],
    11: [19, 20],
    12: [21, 22],
    13: [23, 24],
    14: [25, 26],
    15: [27, 28],
    16: [29, 30],
    17: [31, 32],
    18: [33, 34],
    19: [35, 36],
    20: [37, 38],
    21: [39, 40],
    22: [41, 42],
    23: [43, 44],
    24: [45, 46],
    25: [47, 48],
    26: [49, 50],
}

READING_PAGE_MAP = {
    5: [51, 52, 53, 54],
    6: [55, 56, 57, 58],
    7: [59, 60],
    8: [61, 62],
    9: [63, 64, 65],
    10: [66, 67, 68],
    11: [69, 70],
    12: [71, 72],
    13: [73, 74],
    14: [75, 76, 77],
    15: [78, 79],
    16: [80, 81],
    17: [82, 83],
    18: [84, 85],
    19: [86, 87],
    20: [88, 89],
    21: [90, 91],
    22: [92, 93],
    23: [94, 95],
    24: [96, 97],
    25: [98, 99, 100],
}

LISTENING_ANSWER_INDEXES = {
    1: 1, 2: 1, 3: 3, 4: 2, 5: 1, 6: 4, 7: 4, 8: 3, 9: 3, 10: 1,
    11: 3, 12: 1, 13: 2, 14: 1, 15: 2, 16: 4, 17: 3, 18: 3, 19: 1, 20: 3,
    21: 3, 22: 4, 23: 4, 24: 2, 25: 1, 26: 2, 27: 4, 28: 2, 29: 1, 30: 2,
    31: 1, 32: 3, 33: 4, 34: 2, 35: 4, 36: 2, 37: 4, 38: 3, 39: 2, 40: 4,
    41: 2, 42: 2, 43: 3, 44: 3, 45: 1, 46: 4, 47: 3, 48: 1, 49: 4, 50: 2,
}

READING_ANSWER_INDEXES = {
    51: 1, 52: 2, 53: 3, 54: 4, 55: 3, 56: 2, 57: 2, 58: 1, 59: 1, 60: 3,
    61: 2, 62: 2, 63: 1, 64: 4, 65: 2, 66: 3, 67: 2, 68: 3, 69: 4, 70: 1,
    71: 3, 72: 3, 73: 1, 74: 4, 75: 1, 76: 3, 77: 1, 78: 4, 79: 1, 80: 2,
    81: 4, 82: 4, 83: 1, 84: 4, 85: 2, 86: 4, 87: 4, 88: 2, 89: 1, 90: 2,
    91: 3, 92: 2, 93: 1, 94: 3, 95: 4, 96: 1, 97: 3, 98: 3, 99: 2, 100: 4,
}

LISTENING_OPTION_IMAGE_URLS = {
    1: [f"{STORAGE_BASE_URL}/topik-ii-83/listening/q1_option_{index}.png" for index in range(1, 5)],
    2: [f"{STORAGE_BASE_URL}/topik-ii-83/listening/q2_option_{index}.png" for index in range(1, 5)],
    3: [f"{STORAGE_BASE_URL}/topik-ii-83/listening/q3_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    55: f"{STORAGE_BASE_URL}/topik-ii-83/reading/q55.png",
    56: f"{STORAGE_BASE_URL}/topik-ii-83/reading/q56.png",
    57: f"{STORAGE_BASE_URL}/topik-ii-83/reading/q57.png",
    58: f"{STORAGE_BASE_URL}/topik-ii-83/reading/q58.png",
    59: f"{STORAGE_BASE_URL}/topik-ii-83/reading/q59.png",
    60: f"{STORAGE_BASE_URL}/topik-ii-83/reading/q60.png",
}

LISTENING_FULL_OVERRIDES = {
    1: {"stem": "다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.", "options": ["①", "②", "③", "④"]},
    2: {"stem": "다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.", "options": ["①", "②", "③", "④"]},
    3: {"stem": "다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.", "options": ["①", "②", "③", "④"]},
}

READING_TEXT_OVERRIDES = {
    55: "다음은 무엇에 대한 글인지 고르십시오.",
    56: "다음은 무엇에 대한 글인지 고르십시오.",
    57: "다음은 무엇에 대한 글인지 고르십시오.",
    58: "다음은 무엇에 대한 글인지 고르십시오.",
    59: "다음 글 또는 도표의 내용과 같은 것을 고르십시오.",
    60: "다음 글 또는 도표의 내용과 같은 것을 고르십시오.",
}

READING_FULL_OVERRIDES = {
    55: {"stem": "다음은 무엇에 대한 글인지 고르십시오.", "options": ["①", "②", "③", "④"]},
    56: {"stem": "다음은 무엇에 대한 글인지 고르십시오.", "options": ["①", "②", "③", "④"]},
    57: {"stem": "다음은 무엇에 대한 글인지 고르십시오.", "options": ["①", "②", "③", "④"]},
    58: {"stem": "다음은 무엇에 대한 글인지 고르십시오.", "options": ["①", "②", "③", "④"]},
    59: {"stem": "다음 글 또는 도표의 내용과 같은 것을 고르십시오.", "options": ["①", "②", "③", "④"]},
    60: {"stem": "다음 글 또는 도표의 내용과 같은 것을 고르십시오.", "options": ["①", "②", "③", "④"]},
    94: {
        "stem": "( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
        "options": [
            "값비싼 상품을 매매했기",
            "다양한 자원을 수집했기",
            "미지의 땅을 찾아 떠났기",
            "탐험에 대한 기록을 남겼기",
        ],
    },
    95: {
        "stem": "윗글의 주제로 가장 알맞은 것을 고르십시오.",
        "options": [
            "콜럼버스는 새로운 대륙을 개척하는 데 기여한 바가 크다.",
            "신대륙 발견은 세계사의 새로운 국면을 시작하는 계기가 되었다.",
            "신대륙 발견으로 대륙 간에 문물과 생물의 이동이 증가할 수 있었다.",
            "유럽인들의 탐험은 항로를 만들어 세계를 연결시켰다는 데 의의가 있다.",
        ],
    },
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
        range(1, 27),
        OCR_CACHE_ROOT / "listening",
        clean_lines,
        scale=2.0,
        psm=6,
    )
    reading_pages = get_page_texts(
        READING_PDF,
        range(1, 26),
        OCR_CACHE_ROOT / "reading",
        clean_lines,
        scale=2.0,
        psm=6,
    )

    listening_blocks = build_blocks_no_prefix(listening_pages, LISTENING_PAGE_MAP, LISTENING_PATTERN)
    reading_blocks = build_blocks_no_prefix(reading_pages, READING_PAGE_MAP, READING_PATTERN)

    listening_questions: dict[int, dict[str, object]] = {}
    for question_number in range(1, 51):
        if question_number in LISTENING_FULL_OVERRIDES:
            override = LISTENING_FULL_OVERRIDES[question_number]
            listening_questions[question_number] = {
                "stem": override["stem"],
                "options": override["options"],
            }
            continue
        stem, options = split_block(listening_blocks[question_number])
        listening_questions[question_number] = finalize_question(listening_blocks[question_number], stem, options)

    reading_questions: dict[int, dict[str, object]] = {}
    for question_number in range(51, 101):
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
    answer_index: int,
    question_image_url: str | None = None,
    option_image_urls: list[str] | None = None,
    audio_url: str | None = None,
) -> str:
    return (
        f"  ({MOCK_TEST_ID_SQL}, {sql_string(section)}, {question_number}, "
        f"{sql_string(question_text)}, {sql_string(question_image_url)}, {sql_string(audio_url)}, "
        f"{sql_json_array(option_image_urls) if option_image_urls is not None else 'NULL'}, "
        f"{sql_json_array(options)}, 2, {sql_string(to_answer_text(options, answer_index))}, NULL)"
    )


def build_sql() -> str:
    listening_questions, reading_questions = load_blocks()
    rows: list[str] = []

    for question_number in range(1, 51):
        rows.append(
            question_row(
                "listening",
                question_number,
                str(listening_questions[question_number]["stem"]),
                list(listening_questions[question_number]["options"]),
                LISTENING_ANSWER_INDEXES[question_number],
                option_image_urls=LISTENING_OPTION_IMAGE_URLS.get(question_number),
                audio_url=AUDIO_URL,
            )
        )

    for question_number in range(51, 101):
        rows.append(
            question_row(
                "reading",
                question_number,
                str(reading_questions[question_number]["stem"]),
                list(reading_questions[question_number]["options"]),
                READING_ANSWER_INDEXES[question_number],
                question_image_url=READING_IMAGE_URLS.get(question_number),
            )
        )

    values_sql = ",\n".join(rows)
    return "\n".join(
        [
            "-- Generated by scripts/generate_topik_ii_83_sql.py",
            "BEGIN;",
            "",
            "INSERT INTO mock_test_bank (",
            "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
            ")",
            "SELECT",
            "  'TOPIK II 83-р шалгалт',",
            "  'TOPIK_II',",
            "  83,",
            "  '83-р албан ёсны TOPIK II шалгалт',",
            "  100,",
            "  130,",
            "  50,",
            "  50",
            "WHERE NOT EXISTS (",
            "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_II' AND test_number = 83",
            ");",
            "",
            "UPDATE mock_test_bank SET title = 'TOPIK II 83-р шалгалт', description = '83-р албан ёсны TOPIK II шалгалт', total_questions = 100, duration = 130, listening_questions = 50, reading_questions = 50, updated_at = NOW() WHERE id = (SELECT id FROM mock_test_bank WHERE exam_type = 'TOPIK_II' AND test_number = 83 ORDER BY created_at DESC LIMIT 1);",
            "",
            "DELETE FROM mock_test_questions WHERE mock_test_id = (SELECT id FROM mock_test_bank WHERE exam_type = 'TOPIK_II' AND test_number = 83 ORDER BY created_at DESC LIMIT 1);",
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
