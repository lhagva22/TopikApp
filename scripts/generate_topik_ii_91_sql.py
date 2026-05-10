from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from topik_scanned_ocr_utils import (
    build_page_mapped_blocks,
    crop_rendered_region,
    get_page_texts,
    normalize_text,
    split_block,
)


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"

LISTENING_PAPER = DOWNLOADS / "91st-TOPIK-II-Listening-Test-Paper.pdf"
READING_PAPER = DOWNLOADS / "91st-TOPIK-II-Reading-Test-Paper.pdf"
LISTENING_AUDIO = DOWNLOADS / "91-TOPIK-II-Listening-Audio-File.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_ii_91.sql"
ASSETS_ROOT = ROOT / "topik_ii_91_assets"
UPLOAD_ROOT = ASSETS_ROOT / "upload" / "topik-ii-91"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = "91-TOPIK-II-Listening-Audio-File.mp3"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-ii-91/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_II' AND test_number = 91 "
    "ORDER BY created_at DESC LIMIT 1)"
)

LISTENING_PATTERN = re.compile(r"(?<!\d)(\d{1,2})(?:\.\||\.|\|)(?=(?:\s|\(|[가-힣A-Z]))")
READING_PATTERN = re.compile(r"(?<!\d)(\d{1,2})(?:\.\||\.|\|)(?=(?:\s|\(|[가-힣A-Z]))")

LISTENING_PAGE_MAP = {
    3: [3, 4, 5],
    4: [6, 7, 8, 9, 10, 11],
    5: [12, 13, 14, 15, 16],
    6: [17, 18, 19, 20],
    7: [21, 22, 23, 24],
    8: [25, 26, 27, 28],
    9: [29, 30, 31, 32],
    10: [33, 34, 35, 36],
    11: [37, 38, 39, 40],
    12: [41, 42, 43, 44],
    13: [45, 46, 47, 48],
    14: [49, 50],
}

READING_PAGE_MAP = {
    5: [1, 2, 3, 4],
    6: [5, 6, 7, 8],
    7: [9, 10],
    8: [11, 12],
    9: [13, 14, 15],
    10: [16, 17, 18],
    11: [19, 20],
    12: [21, 22],
    13: [23, 24],
    14: [25, 26, 27],
    15: [28, 29],
    16: [30, 31],
    17: [32, 33],
    18: [34, 35],
    19: [36, 37],
    20: [38, 39],
    21: [40, 41],
    22: [42, 43],
    23: [44, 45],
    24: [46, 47],
    25: [48, 49, 50],
}

LISTENING_OPTION_IMAGE_URLS = {
    1: [f"{STORAGE_BASE_URL}/topik-ii-91/listening/q1_option_{index}.png" for index in range(1, 5)],
    2: [f"{STORAGE_BASE_URL}/topik-ii-91/listening/q2_option_{index}.png" for index in range(1, 5)],
    3: [f"{STORAGE_BASE_URL}/topik-ii-91/listening/q3_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    55: f"{STORAGE_BASE_URL}/topik-ii-91/reading/q55.png",
    56: f"{STORAGE_BASE_URL}/topik-ii-91/reading/q56.png",
    57: f"{STORAGE_BASE_URL}/topik-ii-91/reading/q57.png",
    58: f"{STORAGE_BASE_URL}/topik-ii-91/reading/q58.png",
    59: f"{STORAGE_BASE_URL}/topik-ii-91/reading/q59.png",
    60: f"{STORAGE_BASE_URL}/topik-ii-91/reading/q60.png",
}

LISTENING_TEXT_OVERRIDES = {
    1: "다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.",
    2: "다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.",
    3: "다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.",
    4: "다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.",
    5: "다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.",
    6: "다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.",
    7: "다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.",
    8: "다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.",
    9: "다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.",
    10: "다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.",
    11: "다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.",
    12: "다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.",
    13: "다음을 듣고 들은 내용과 같은 것을 고르십시오.",
    14: "다음을 듣고 들은 내용과 같은 것을 고르십시오.",
    15: "다음을 듣고 들은 내용과 같은 것을 고르십시오.",
    16: "다음을 듣고 들은 내용과 같은 것을 고르십시오.",
}

READING_TEXT_OVERRIDES = {
    55: "다음은 무엇에 대한 글인지 고르십시오.",
    56: "다음은 무엇에 대한 글인지 고르십시오.",
    57: "다음은 무엇에 대한 글인지 고르십시오.",
    58: "다음은 무엇에 대한 글인지 고르십시오.",
    59: "다음 글 또는 도표의 내용과 같은 것을 고르십시오.",
    60: "다음 글 또는 도표의 내용과 같은 것을 고르십시오.",
}

LISTENING_CROP_BOXES = {
    (1, 1): (315, 420, 747, 737),
    (1, 2): (849, 420, 1277, 737),
    (1, 3): (315, 731, 747, 1051),
    (1, 4): (849, 731, 1277, 1051),
    (2, 1): (315, 1087, 747, 1416),
    (2, 2): (849, 1087, 1277, 1416),
    (2, 3): (315, 1412, 747, 1745),
    (2, 4): (849, 1412, 1277, 1745),
    (3, 1): (315, 299, 747, 669),
    (3, 2): (849, 299, 1277, 669),
    (3, 3): (315, 696, 747, 1064),
    (3, 4): (849, 696, 1277, 1064),
}

READING_CROP_BOXES = {
    "q55.png": (274, 306, 1268, 492),
    "q56.png": (274, 716, 1268, 944),
    "q57.png": (274, 1115, 1268, 1360),
    "q58.png": (274, 1538, 1268, 1826),
    "q59.png": (272, 299, 1267, 760),
    "q60.png": (272, 1048, 1267, 1710),
}

LISTENING_ANSWERS = {
    1: ("②", 2), 2: ("①", 2), 3: ("③", 2), 4: ("①", 2), 5: ("①", 2),
    6: ("②", 2), 7: ("②", 2), 8: ("③", 2), 9: ("①", 2), 10: ("①", 2),
    11: ("③", 2), 12: ("④", 2), 13: ("④", 2), 14: ("①", 2), 15: ("③", 2),
    16: ("①", 2), 17: ("④", 2), 18: ("①", 2), 19: ("①", 2), 20: ("②", 2),
    21: ("②", 2), 22: ("③", 2), 23: ("④", 2), 24: ("③", 2), 25: ("②", 2),
    26: ("④", 2), 27: ("④", 2), 28: ("①", 2), 29: ("④", 2), 30: ("④", 2),
    31: ("③", 2), 32: ("②", 2), 33: ("④", 2), 34: ("②", 2), 35: ("①", 2),
    36: ("②", 2), 37: ("②", 2), 38: ("③", 2), 39: ("②", 2), 40: ("③", 2),
    41: ("④", 2), 42: ("④", 2), 43: ("①", 2), 44: ("④", 2), 45: ("③", 2),
    46: ("③", 2), 47: ("④", 2), 48: ("③", 2), 49: ("②", 2), 50: ("③", 2),
}

READING_ANSWERS = {
    51: ("④", 2), 52: ("④", 2), 53: ("①", 2), 54: ("④", 2), 55: ("②", 2),
    56: ("③", 2), 57: ("①", 2), 58: ("①", 2), 59: ("④", 2), 60: ("②", 2),
    61: ("③", 2), 62: ("②", 2), 63: ("②", 2), 64: ("③", 2), 65: ("②", 2),
    66: ("①", 2), 67: ("③", 2), 68: ("①", 2), 69: ("③", 2), 70: ("①", 2),
    71: ("③", 2), 72: ("④", 2), 73: ("①", 2), 74: ("④", 2), 75: ("①", 2),
    76: ("③", 2), 77: ("①", 2), 78: ("①", 2), 79: ("②", 2), 80: ("③", 2),
    81: ("③", 2), 82: ("④", 2), 83: ("②", 2), 84: ("②", 2), 85: ("④", 2),
    86: ("④", 2), 87: ("①", 2), 88: ("④", 2), 89: ("①", 2), 90: ("③", 2),
    91: ("③", 2), 92: ("②", 2), 93: ("①", 2), 94: ("③", 2), 95: ("④", 2),
    96: ("②", 2), 97: ("②", 2), 98: ("④", 2), 99: ("②", 2), 100: ("④", 2),
}


def clean_page(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if "TOPIK" in line or "한국어능력시험" in line or "제91회" in line:
            continue
        if line.startswith("Information") or line.startswith("Do not "):
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    return normalize_text("\n".join(lines))


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_json_array(values: list[str]) -> str:
    return sql_string(json.dumps(values, ensure_ascii=False)) + "::jsonb"


def normalize_question_text(text: str) -> str:
    text = re.sub(r"^\[.*?\]\s*", "", text)
    text = re.sub(r"^(?:\d+|[가-힣A-Z])[\)\].|]\s*", "", text)
    text = re.sub(r"^\(\d+점\)\s*", "", text)
    text = re.sub(r"^\d+\s*", "", text)
    return normalize_text(text)


def fallback_options(options: list[str]) -> list[str]:
    return options if len(options) == 4 else ["①", "②", "③", "④"]


def copy_asset(source: Path, relative_target: Path) -> None:
    target = UPLOAD_ROOT / relative_target
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def build_assets() -> None:
    if not LISTENING_AUDIO.exists():
        raise FileNotFoundError(f"Missing audio file: {LISTENING_AUDIO}")

    copy_asset(LISTENING_AUDIO, Path("audio") / AUDIO_FILENAME)

    for (question_number, option_index), box in LISTENING_CROP_BOXES.items():
        page_number = 2 if question_number in {1, 2} else 3
        target = ASSETS_ROOT / "debug" / f"q{question_number}_option_{option_index}.png"
        crop_rendered_region(LISTENING_PAPER, page_number, box, target, scale=2.0)
        copy_asset(target, Path("listening") / f"q{question_number}_option_{option_index}.png")

    for name, box in READING_CROP_BOXES.items():
        page_number = 6 if name in {"q55.png", "q56.png", "q57.png", "q58.png"} else 7
        target = ASSETS_ROOT / "debug" / name
        crop_rendered_region(READING_PAPER, page_number, box, target, scale=2.0)
        copy_asset(target, Path("reading") / name)


def build_questions() -> list[dict[str, object]]:
    listening_pages = get_page_texts(
        LISTENING_PAPER,
        range(3, 15),
        ROOT / "tmp91_gen" / "ii_listen",
        clean_page,
        scale=2.0,
        psm=6,
    )
    reading_pages = get_page_texts(
        READING_PAPER,
        range(5, 26),
        ROOT / "tmp91_gen" / "ii_read",
        clean_page,
        scale=2.0,
        psm=6,
    )

    listening_blocks = build_page_mapped_blocks(listening_pages, LISTENING_PAGE_MAP, LISTENING_PATTERN)
    reading_blocks = build_page_mapped_blocks(reading_pages, READING_PAGE_MAP, READING_PATTERN)

    questions: list[dict[str, object]] = []

    for question_number in (1, 2):
        correct_answer_text, score = LISTENING_ANSWERS[question_number]
        questions.append(
            {
                "section": "listening",
                "question_number": question_number,
                "question_text": LISTENING_TEXT_OVERRIDES[question_number],
                "question_image_url": None,
                "audio_url": AUDIO_URL,
                "option_image_urls": LISTENING_OPTION_IMAGE_URLS[question_number],
                "options": ["①", "②", "③", "④"],
                "question_score": score,
                "correct_answer_text": correct_answer_text,
            }
        )

    for question_number in range(3, 51):
        question_text, options = split_block(listening_blocks[question_number])
        if question_number in LISTENING_TEXT_OVERRIDES:
            question_text = LISTENING_TEXT_OVERRIDES[question_number]
        else:
            question_text = normalize_question_text(question_text)
        if question_number in LISTENING_OPTION_IMAGE_URLS:
            options = ["①", "②", "③", "④"]
        else:
            options = fallback_options(options)
        correct_answer_text, score = LISTENING_ANSWERS[question_number]
        questions.append(
            {
                "section": "listening",
                "question_number": question_number,
                "question_text": question_text,
                "question_image_url": None,
                "audio_url": AUDIO_URL,
                "option_image_urls": LISTENING_OPTION_IMAGE_URLS.get(question_number),
                "options": options,
                "question_score": score,
                "correct_answer_text": correct_answer_text if question_number in LISTENING_OPTION_IMAGE_URLS or options == ["①", "②", "③", "④"] else options[["①", "②", "③", "④"].index(correct_answer_text)],
            }
        )

    for raw_question_number in range(1, 51):
        question_number = raw_question_number + 50
        question_text, options = split_block(reading_blocks[raw_question_number])
        question_text = READING_TEXT_OVERRIDES.get(question_number, normalize_question_text(question_text))
        options = fallback_options(options)
        correct_answer_text, score = READING_ANSWERS[question_number]
        questions.append(
            {
                "section": "reading",
                "question_number": question_number,
                "question_text": question_text,
                "question_image_url": READING_IMAGE_URLS.get(question_number),
                "audio_url": None,
                "option_image_urls": None,
                "options": options,
                "question_score": score,
                "correct_answer_text": correct_answer_text if options == ["①", "②", "③", "④"] else options[["①", "②", "③", "④"].index(correct_answer_text)],
            }
        )

    return questions


def build_sql(questions: list[dict[str, object]]) -> str:
    lines = [
        "-- Generated by scripts/generate_topik_ii_91_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK II 91-р шалгалт',",
        "  'TOPIK_II',",
        "  91,",
        "  '91-р албан ёсны TOPIK II шалгалт',",
        "  100,",
        "  130,",
        "  50,",
        "  50",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_II' AND test_number = 91",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK II 91-р шалгалт', description = '91-р албан ёсны TOPIK II шалгалт', total_questions = 100, duration = 130, listening_questions = 50, reading_questions = 50, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
        "",
        f"DELETE FROM mock_test_questions WHERE mock_test_id = {MOCK_TEST_ID_SQL};",
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
    ]

    values: list[str] = []
    for question in questions:
        values.append(
            "  ("
            + ", ".join(
                [
                    MOCK_TEST_ID_SQL,
                    sql_string(str(question["section"])),
                    str(question["question_number"]),
                    sql_string(str(question["question_text"])),
                    sql_string(question["question_image_url"] if isinstance(question["question_image_url"], str) else None),
                    sql_string(question["audio_url"] if isinstance(question["audio_url"], str) else None),
                    sql_json_array(question["option_image_urls"]) if isinstance(question["option_image_urls"], list) else "NULL",
                    sql_json_array(question["options"]),
                    str(question["question_score"]),
                    sql_string(str(question["correct_answer_text"])),
                    "NULL",
                ]
            )
            + ")"
        )

    lines.append(",\n".join(values) + ";")
    lines.extend(["", "COMMIT;", ""])
    return "\n".join(lines)


def main() -> None:
    questions = build_questions()
    if len(questions) != 100:
        raise ValueError(f"Expected 100 questions, got {len(questions)}")
    build_assets()
    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SQL.write_text(build_sql(questions), encoding="utf-8")
    print(f"Wrote {OUTPUT_SQL}")


if __name__ == "__main__":
    main()
