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

LISTENING_PDF = DOWNLOADS / "91st-TOPIK-I-Listening-Transcript.pdf"
READING_PDF = DOWNLOADS / "91st-TOPIK-I-Reading-Test-Paper.pdf"
LISTENING_AUDIO = DOWNLOADS / "91-TOPIK-I-Listening-Audio-File-64k-mono.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_i_91.sql"
ASSETS_ROOT = ROOT / "topik_i_91_assets"
UPLOAD_ROOT = ASSETS_ROOT / "upload" / "topik-i-91"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = "91-TOPIK-I-Listening-Audio-File-64k-mono.mp3"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-i-91/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_I' AND test_number = 91 "
    "ORDER BY created_at DESC LIMIT 1)"
)

LISTENING_PATTERN = re.compile(r"(?<!\d)(\d{1,2})(?:\.\||\.|\|)(?=(?:\s|\(|[가-힣A-Z]))")
READING_PATTERN = re.compile(r"(?<!\d)(3[1-9]|[4-6]\d|70)(?:\.\||\.)(?=(?:\s|\(|[가-힣A-Z]))")

LISTENING_PAGE_MAP = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9, 10],
    4: [11, 12, 13, 14],
    5: [15, 16],
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

LISTENING_OPTION_IMAGE_URLS = {
    15: [f"{STORAGE_BASE_URL}/topik-i-91/listening/q15_option_{index}.png" for index in range(1, 5)],
    16: [f"{STORAGE_BASE_URL}/topik-i-91/listening/q16_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    40: f"{STORAGE_BASE_URL}/topik-i-91/reading/q40.png",
    41: f"{STORAGE_BASE_URL}/topik-i-91/reading/q41.png",
    42: f"{STORAGE_BASE_URL}/topik-i-91/reading/q42.png",
    63: f"{STORAGE_BASE_URL}/topik-i-91/reading/q63_64.png",
    64: f"{STORAGE_BASE_URL}/topik-i-91/reading/q63_64.png",
}

LISTENING_SPECIALS = {
    15: "남자: 이것보다 작은 가방 있어요?\n여자: 네, 가게 안에 있어요. 들어와서 보세요.",
    16: "여자: 책상 위에 휴대전화가 있네요.\n남자: 그럼 이걸로 전화해 볼까요?",
}

READING_TEXT_OVERRIDES = {
    40: "다음을 읽고 맞지 않는 것을 고르십시오.",
    41: "다음을 읽고 맞지 않는 것을 고르십시오.",
    42: "다음을 읽고 맞지 않는 것을 고르십시오.",
    63: "왜 윗글을 쓰는지 맞는 것을 고르십시오.",
    64: "윗글의 내용과 같은 것을 고르십시오.",
}

LISTENING_CROP_BOXES = {
    (15, 1): (315, 299, 747, 584),
    (15, 2): (849, 299, 1277, 584),
    (15, 3): (315, 613, 747, 897),
    (15, 4): (849, 613, 1277, 897),
    (16, 1): (315, 1053, 747, 1338),
    (16, 2): (849, 1053, 1277, 1338),
    (16, 3): (315, 1361, 747, 1648),
    (16, 4): (849, 1361, 1277, 1648),
}

READING_CROP_BOXES = {
    "q40.png": (315, 1040, 943, 1289),
    "q41.png": (316, 336, 1268, 748),
    "q42.png": (315, 1090, 760, 1775),
    "q63_64.png": (274, 305, 1265, 786),
}

LISTENING_ANSWERS = {
    1: ("①", 4), 2: ("④", 4), 3: ("③", 3), 4: ("④", 3), 5: ("①", 4),
    6: ("④", 3), 7: ("①", 3), 8: ("②", 3), 9: ("②", 3), 10: ("③", 4),
    11: ("②", 3), 12: ("④", 3), 13: ("②", 4), 14: ("①", 3), 15: ("①", 4),
    16: ("②", 4), 17: ("①", 3), 18: ("②", 3), 19: ("②", 3), 20: ("③", 3),
    21: ("④", 3), 22: ("③", 3), 23: ("③", 3), 24: ("①", 3), 25: ("③", 3),
    26: ("④", 4), 27: ("④", 3), 28: ("①", 4), 29: ("④", 3), 30: ("③", 4),
}

READING_ANSWERS = {
    31: ("②", 2), 32: ("①", 2), 33: ("②", 2), 34: ("④", 2), 35: ("③", 2),
    36: ("③", 2), 37: ("①", 3), 38: ("③", 3), 39: ("①", 2), 40: ("④", 3),
    41: ("①", 3), 42: ("④", 3), 43: ("①", 3), 44: ("②", 2), 45: ("③", 3),
    46: ("①", 3), 47: ("①", 3), 48: ("②", 2), 49: ("①", 2), 50: ("③", 2),
    51: ("①", 3), 52: ("②", 2), 53: ("④", 2), 54: ("③", 3), 55: ("④", 2),
    56: ("②", 3), 57: ("②", 3), 58: ("④", 2), 59: ("④", 2), 60: ("③", 3),
    61: ("④", 2), 62: ("③", 2), 63: ("④", 2), 64: ("③", 3), 65: ("②", 2),
    66: ("③", 3), 67: ("①", 3), 68: ("④", 3), 69: ("②", 3), 70: ("②", 3),
}


def clean_page(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if "TOPIK" in line or "한국어능력시험" in line or "제91회" in line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        if len(line) <= 2 and any(ch.isdigit() for ch in line):
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
        target = ASSETS_ROOT / "debug" / f"q{question_number}_option_{option_index}.png"
        crop_rendered_region(READING_PDF.parent / "91st-TOPIK-I-Listening-Test-Paper.pdf", 5, box, target, scale=2.0)
        copy_asset(target, Path("listening") / f"q{question_number}_option_{option_index}.png")

    reading_pages = {40: 3, 41: 4, 42: 4, 63: 14}
    for name, box in READING_CROP_BOXES.items():
        page_number = 14 if name == "q63_64.png" else { "q40.png": 3, "q41.png": 4, "q42.png": 4 }[name]
        target = ASSETS_ROOT / "debug" / name
        crop_rendered_region(READING_PDF, page_number, box, target, scale=2.0)
        copy_asset(target, Path("reading") / name)


def build_questions() -> list[dict[str, object]]:
    listening_pages = get_page_texts(
        LISTENING_PDF,
        range(1, 13),
        ROOT / "tmp91_gen" / "i_listen",
        clean_page,
        scale=2.0,
        psm=6,
    )
    reading_pages = get_page_texts(
        READING_PDF,
        range(1, 18),
        ROOT / "tmp91_gen" / "i_read",
        clean_page,
        scale=2.0,
        psm=6,
    )

    listening_blocks = build_page_mapped_blocks(listening_pages, LISTENING_PAGE_MAP, LISTENING_PATTERN)
    reading_blocks = build_page_mapped_blocks(reading_pages, READING_PAGE_MAP, READING_PATTERN)

    questions: list[dict[str, object]] = []

    for question_number in range(1, 31):
        _, raw_options = split_block(listening_blocks[question_number])
        if question_number in LISTENING_SPECIALS:
            question_text = LISTENING_SPECIALS[question_number]
            options = ["①", "②", "③", "④"]
        else:
            question_text, raw_options = split_block(listening_blocks[question_number])
            question_text = normalize_question_text(question_text)
            options = fallback_options(raw_options)
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
                "correct_answer_text": correct_answer_text if question_number in LISTENING_SPECIALS or options == ["①", "②", "③", "④"] else options[["①", "②", "③", "④"].index(correct_answer_text)],
            }
        )

    for question_number in range(31, 71):
        question_text, options = split_block(reading_blocks[question_number])
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
        "-- Generated by scripts/generate_topik_i_91_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK I 91-р шалгалт',",
        "  'TOPIK_I',",
        "  91,",
        "  '91-р албан ёсны TOPIK I шалгалт',",
        "  70,",
        "  100,",
        "  30,",
        "  40",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 91",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK I 91-р шалгалт', description = '91-р албан ёсны TOPIK I шалгалт', total_questions = 70, duration = 100, listening_questions = 30, reading_questions = 40, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
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
    if len(questions) != 70:
        raise ValueError(f"Expected 70 questions, got {len(questions)}")
    build_assets()
    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SQL.write_text(build_sql(questions), encoding="utf-8")
    print(f"Wrote {OUTPUT_SQL}")


if __name__ == "__main__":
    main()
