from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"

PAPERS_PDF = DOWNLOADS / "37th TOPIK I Papers.pdf"
LISTENING_PDF = DOWNLOADS / "37th TOPIK I Listening Text.pdf"
ANSWER_PDF = DOWNLOADS / "37th TOPIK I Answer sheet.pdf"
LISTENING_AUDIO = DOWNLOADS / "37th-TOPIK-I-Listening-Audio-File-64k-mono.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_i_37.sql"
ASSETS_ROOT = ROOT / "topik_i_37_assets"
UPLOAD_ROOT = ASSETS_ROOT / "upload" / "topik-i-37"
BACKEND_MEDIA_ROOT = ROOT / "backend" / "public" / "topik-i-37"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = "37th-TOPIK-I-Listening-Audio-File-64k-mono.mp3"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-i-37/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_I' AND test_number = 37 "
    "ORDER BY created_at DESC LIMIT 1)"
)

CIRCLED_TO_INDEX = {
    "①": 1, "②": 2, "③": 3, "④": 4,
    "❶": 1, "❷": 2, "❸": 3, "❹": 4,
    "➀": 1, "➁": 2, "➂": 3, "➃": 4,
}

LISTENING_OPTION_IMAGE_URLS = {
    15: [f"{STORAGE_BASE_URL}/topik-i-37/listening/q15_option_{index}.png" for index in range(1, 5)],
    16: [f"{STORAGE_BASE_URL}/topik-i-37/listening/q16_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    40: f"{STORAGE_BASE_URL}/topik-i-37/reading/q40.png",
    41: f"{STORAGE_BASE_URL}/topik-i-37/reading/q41.png",
    42: f"{STORAGE_BASE_URL}/topik-i-37/reading/q42.png",
    63: f"{STORAGE_BASE_URL}/topik-i-37/reading/q63_64.png",
    64: f"{STORAGE_BASE_URL}/topik-i-37/reading/q63_64.png",
}

LISTENING_SPECIALS = {
    15: {
        "question_text": (
            "남자 :이 식당은 뭐가 맛있어요?\n"
            "여자 :이거 한번 드셔 보세요.여기 오면 저는 항상 이걸 먹어요.\n"
            "알맞은 그림을 고르십시오."
        ),
        "options": ["①", "②", "③", "④"],
    },
    16: {
        "question_text": (
            "남자 :안경을 쓰고 거울 한번 보세요.어떠세요?\n"
            "여자 :좋아요.아주 마음에 들어요.\n"
            "알맞은 그림을 고르십시오."
        ),
        "options": ["①", "②", "③", "④"],
    },
}

_SHOES_CONTEXT = (
    "여자 :여러분,이쪽으로 오세요.지금 보시는 이것은 옛날 신발인데요."
    "옛날 사람들은 비가 올 때 이 신발을 신었습니다."
    "신발의 앞과 뒤가 바닥보다 높아서 비가 올 때도 발이 물에 젖지 않고요."
    "또 가벼운 나무로 만들었기 때문에 신었을 때 불편하지 않습니다."
    "남자 신발과 여자 신발은 모양이 좀 다른데요."
    "여자 신발은 꽃 그림을 그려서 예쁘게 만들었습니다."
    "다 보셨으면 옆으로 가실까요?"
)

_FURNITURE_CONTEXT = (
    "남자 :요즘 퇴근 후에 뭐 해요?매일 일찍 나가는 것 같아요.\n"
    "여자 :아,집 근처 가구 만드는 곳에 가서 책상을 만들고 있어요.\n"
    "남자 :책상요?책상을 사지 않고 만들어요?\n"
    "여자 :네.좀 큰 책상을 갖고 싶어서 시작했는데 아주 재미있어요."
    "그래서 다음에는 식탁도 만들어 보려고요.\n"
    "남자 :그런 걸 할 줄 알아요?나는 작은 상자도 못 만드는데…….\n"
    "여자 :가구 만드는 곳에 가면 다 가르쳐 줘요.하고 싶으면 같이 가요."
)

_DISHES_CONTEXT = (
    "남자 :안녕하세요?여기 행복마트인데요."
    "지난주에 주문한 그릇 때문에 전화 드렸습니다.\n"
    "여자 :네,연락하려고 했는데 주문한 그릇이 왜 이렇게 안 와요?\n"
    "남자 :원하시는 색깔이 가게에 없어서 공장에 주문을 했는데요."
    "생각보다 늦어져서요.죄송합니다.\n"
    "여자 :그래요?그럼 언제쯤 받을 수 있어요?\n"
    "남자 :내일 보낼 거니까 모레쯤은 도착할 겁니다.\n"
    "여자 :네,알겠습니다."
)

LISTENING_SHARED_CONTEXTS = {
    25: _SHOES_CONTEXT,
    26: _SHOES_CONTEXT,
    27: _FURNITURE_CONTEXT,
    28: _FURNITURE_CONTEXT,
    29: _DISHES_CONTEXT,
    30: _DISHES_CONTEXT,
}

READING_TEXT_OVERRIDES = {
    40: "다음을 읽고 맞지 않는 것을 고르십시오.",
    41: "다음을 읽고 맞지 않는 것을 고르십시오.",
    42: "다음을 읽고 맞지 않는 것을 고르십시오.",
}

LISTENING_IMAGE_ASSETS = {
    15: {"page": 6, "indices": [0, 1, 2, 3]},
    16: {"page": 6, "indices": [4, 5, 6, 7]},
}

READING_IMAGE_ASSETS = {
    40: {"page": 13, "index": 0},
    41: {"page": 14, "index": 0},
    42: {"page": 14, "index": 1},
    63: {"page": 24, "index": 0},
}


def read_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def normalize_text(value: str) -> str:
    value = value.replace(" ", " ")
    value = value.replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{2,}", "\n", value)
    return value.strip()


def clean_listening_text(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("제37회 한국어능력시험"):
            continue
        if line.startswith("듣기 통합"):
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def clean_reading_text(text: str) -> str:
    lines: list[str] = []
    started = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("※ [31～33]"):
            started = True
        if not started:
            continue
        if line.startswith("제37회 한국어능력시험"):
            continue
        if line.startswith("TOPIKⅠ 읽기"):
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def build_question_blocks(text: str, start: int, end: int) -> dict[int, str]:
    matches = list(re.finditer(r"(?m)^(\d+)\.\s*", text))
    blocks: dict[int, str] = {}
    for index, match in enumerate(matches):
        q_num = int(match.group(1))
        if q_num < start or q_num > end:
            continue
        block_start = match.start()
        block_end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        blocks[q_num] = normalize_text(text[block_start:block_end])
    return blocks


def sanitize_stem_text(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"^\d+\.\s*", "", value)
    value = re.sub(r"^\((\d+)점\)\s*", "", value)
    value = re.sub(r"^\d+\.\((\d+)점\)\s*", "", value)
    value = re.sub(r"^\d+\.\s*\((\d+)점\)\s*", "", value)
    value = re.split(r"\n(?:제37회|TOPIKⅠ 읽기|TOPIKⅠ 듣기)", value, maxsplit=1)[0]
    return normalize_text(value)


def sanitize_option_text(value: str) -> str:
    value = re.split(r"\n(?:제37회|TOPIKⅠ 읽기|TOPIKⅠ 듣기|※ \[)", value, maxsplit=1)[0]
    return normalize_text(value)


def split_block(block: str) -> tuple[str, list[str]]:
    option_start = block.find("①")
    if option_start == -1:
        return sanitize_stem_text(block), []

    stem = sanitize_stem_text(block[:option_start])
    options_text = block[option_start:]
    match = re.search(r"①\s*(.*?)\s*②\s*(.*?)\s*③\s*(.*?)\s*④\s*(.*)$", options_text, re.S)
    if not match:
        raise ValueError(f"Could not parse options from block:\n{block}")

    options = [sanitize_option_text(group) for group in match.groups()]
    return stem, options


def parse_answer_meta(page_index: int, start: int, end: int) -> dict[int, tuple[int, int]]:
    reader = PdfReader(str(ANSWER_PDF))
    text = (reader.pages[page_index].extract_text() or "").replace(" ", "").replace("\n", "")

    if (start, end) == (1, 30):
        order = [value for pair in zip(range(1, 16), range(16, 31)) for value in pair]
    elif (start, end) == (31, 70):
        order = [value for pair in zip(range(31, 51), range(51, 71)) for value in pair]
    else:
        raise ValueError(f"Unsupported answer range: {start}-{end}")

    start_match = re.search(rf"{order[0]}[①②③④❶❷❸❹➀➁➂➃]", text)
    if not start_match:
        raise ValueError(f"Could not find first answer marker for range {start}-{end}")

    text = text[start_match.start():]

    answers: dict[int, tuple[int, int]] = {}
    cursor = 0
    for q_num in order:
        q_text = str(q_num)
        if not text[cursor:].startswith(q_text):
            raise ValueError(f"Answer sheet parse drifted at question {q_num}")
        cursor += len(q_text)
        choice = text[cursor]
        score = text[cursor + 1]
        answers[q_num] = (CIRCLED_TO_INDEX[choice], int(score))
        cursor += 2
    return answers


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_json_array(values: list[str]) -> str:
    return sql_string(json.dumps(values, ensure_ascii=False)) + "::jsonb"


def build_questions() -> list[dict[str, object]]:
    listening_blocks = build_question_blocks(clean_listening_text(read_pdf_text(LISTENING_PDF)), 1, 30)
    reading_blocks = build_question_blocks(clean_reading_text(read_pdf_text(PAPERS_PDF)), 31, 70)
    listening_answers = parse_answer_meta(0, 1, 30)
    reading_answers = parse_answer_meta(1, 31, 70)

    if len(listening_answers) != 30:
        raise ValueError(f"Expected 30 listening answers, got {len(listening_answers)}")
    if len(reading_answers) != 40:
        raise ValueError(f"Expected 40 reading answers, got {len(reading_answers)}")

    questions: list[dict[str, object]] = []

    for q_num in range(1, 31):
        if q_num in LISTENING_SPECIALS:
            question_text = LISTENING_SPECIALS[q_num]["question_text"]
            options = LISTENING_SPECIALS[q_num]["options"]
        else:
            stem, options = split_block(listening_blocks[q_num])
            shared = LISTENING_SHARED_CONTEXTS.get(q_num)
            question_text = normalize_text(f"{shared}\n{stem}") if shared else stem

        answer_index = listening_answers[q_num][0] - 1
        questions.append(
            {
                "section": "listening",
                "question_number": q_num,
                "question_text": question_text,
                "question_image_url": None,
                "audio_url": AUDIO_URL,
                "option_image_urls": LISTENING_OPTION_IMAGE_URLS.get(q_num),
                "options": options,
                "question_score": listening_answers[q_num][1],
                "correct_answer_text": options[answer_index],
            }
        )

    for q_num in range(31, 71):
        stem, options = split_block(reading_blocks[q_num])
        question_text = READING_TEXT_OVERRIDES.get(q_num, stem)
        answer_index = reading_answers[q_num][0] - 1
        questions.append(
            {
                "section": "reading",
                "question_number": q_num,
                "question_text": question_text,
                "question_image_url": READING_IMAGE_URLS.get(q_num),
                "audio_url": None,
                "option_image_urls": None,
                "options": options,
                "question_score": reading_answers[q_num][1],
                "correct_answer_text": options[answer_index],
            }
        )

    return questions


def render_pdf_page(pdf_path: Path, page_number: int, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_number - 1)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        pix.save(output_path)
    finally:
        doc.close()


def image_blocks_from_page(pdf_path: Path, page_number: int) -> list[dict[str, object]]:
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_number - 1)
        blocks = []
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 1:
                continue
            x0, y0, x1, y1 = block["bbox"]
            width = x1 - x0
            height = y1 - y0
            if width < 120 or height < 40:
                continue
            blocks.append(block)
        return blocks
    finally:
        doc.close()


def save_block_image(block: dict[str, object], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image_bytes = block.get("image")
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise ValueError(f"Image block does not contain bytes for {output_path}")
    output_path.write_bytes(bytes(image_bytes))


def copy_asset(source: Path, relative_target: Path) -> None:
    upload_target = UPLOAD_ROOT / relative_target
    media_target = BACKEND_MEDIA_ROOT / relative_target
    upload_target.parent.mkdir(parents=True, exist_ok=True)
    media_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, upload_target)
    shutil.copy2(source, media_target)


def build_assets() -> None:
    if not LISTENING_AUDIO.exists():
        raise FileNotFoundError(f"Missing audio file: {LISTENING_AUDIO}")

    copy_asset(LISTENING_AUDIO, Path("audio") / AUDIO_FILENAME)

    listening_page_blocks: dict[int, list[dict[str, object]]] = {}
    for question_number, meta in LISTENING_IMAGE_ASSETS.items():
        page_number = int(meta["page"])
        if page_number not in listening_page_blocks:
            listening_page_blocks[page_number] = image_blocks_from_page(PAPERS_PDF, page_number)
            render_pdf_page(PAPERS_PDF, page_number, ASSETS_ROOT / "debug_pages" / f"listening_page_{page_number}.png")
        blocks = listening_page_blocks[page_number]
        for option_index, block_index in enumerate(meta["indices"], start=1):
            debug_path = ASSETS_ROOT / "debug_pages" / f"q{question_number}_option_{option_index}.png"
            save_block_image(blocks[block_index], debug_path)
            copy_asset(debug_path, Path("listening") / f"q{question_number}_option_{option_index}.png")

    rendered_pages: set[int] = set()
    reading_page_blocks: dict[int, list[dict[str, object]]] = {}
    for meta in READING_IMAGE_ASSETS.values():
        page_number = int(meta["page"])
        if page_number not in rendered_pages:
            render_pdf_page(PAPERS_PDF, page_number, ASSETS_ROOT / "debug_pages" / f"reading_page_{page_number}.png")
            rendered_pages.add(page_number)
        if page_number not in reading_page_blocks:
            reading_page_blocks[page_number] = image_blocks_from_page(PAPERS_PDF, page_number)

    for question_number, meta in READING_IMAGE_ASSETS.items():
        page_number = int(meta["page"])
        block_index = int(meta["index"])
        block = reading_page_blocks[page_number][block_index]
        name = "q63_64.png" if question_number == 63 else f"q{question_number}.png"
        debug_path = ASSETS_ROOT / "debug_pages" / name
        save_block_image(block, debug_path)
        copy_asset(debug_path, Path("reading") / name)


def build_sql(questions: list[dict[str, object]]) -> str:
    lines = [
        "-- Generated by scripts/generate_topik_i_37_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK I 37-р шалгалт',",
        "  'TOPIK_I',",
        "  37,",
        "  '37-р албан ёсны TOPIK I шалгалт',",
        "  70,",
        "  100,",
        "  30,",
        "  40",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 37",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK I 37-р шалгалт', description = '37-р албан ёсны TOPIK I шалгалт', total_questions = 70, duration = 100, listening_questions = 30, reading_questions = 40, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
        "",
        "ALTER TABLE mock_test_questions ADD COLUMN IF NOT EXISTS question_image_url TEXT;",
        "ALTER TABLE mock_test_questions ADD COLUMN IF NOT EXISTS option_image_urls JSONB;",
        "ALTER TABLE mock_test_questions ADD COLUMN IF NOT EXISTS question_score INTEGER NOT NULL DEFAULT 1;",
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

    value_lines: list[str] = []
    for question in questions:
        value_lines.append(
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
                    sql_json_array(question["options"]),  # type: ignore[arg-type]
                    str(question["question_score"]),
                    sql_string(str(question["correct_answer_text"])),
                    "NULL",
                ]
            )
            + ")"
        )

    lines.append(",\n".join(value_lines) + ";")
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
