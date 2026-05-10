from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"

PAPERS_PDF = DOWNLOADS / "36th TOPIK I Papers - Listening + Reading.pdf"
LISTENING_PDF = DOWNLOADS / "36th TOPIK I Listening Text.pdf"
ANSWER_PDF = DOWNLOADS / "36th TOPIK I Answers.pdf"
LISTENING_AUDIO = DOWNLOADS / "36th-TOPIK-I-Listening-Audio-File-64k-mono.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_i_36.sql"
ASSETS_ROOT = ROOT / "topik_i_36_assets"
UPLOAD_ROOT = ASSETS_ROOT / "upload" / "topik-i-36"
BACKEND_MEDIA_ROOT = ROOT / "backend" / "public" / "topik-i-36"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = "36th-TOPIK-I-Listening-Audio-File-64k-mono.mp3"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-i-36/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_I' AND test_number = 36 "
    "ORDER BY created_at DESC LIMIT 1)"
)

CIRCLED_TO_INDEX = {"①": 1, "②": 2, "③": 3, "④": 4, "❶": 1, "❷": 2, "❸": 3, "❹": 4}

LISTENING_OPTION_IMAGE_URLS = {
    15: [f"{STORAGE_BASE_URL}/topik-i-36/listening/q15_option_{index}.png" for index in range(1, 5)],
    16: [f"{STORAGE_BASE_URL}/topik-i-36/listening/q16_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    40: f"{STORAGE_BASE_URL}/topik-i-36/reading/q40.png",
    41: f"{STORAGE_BASE_URL}/topik-i-36/reading/q41.png",
    42: f"{STORAGE_BASE_URL}/topik-i-36/reading/q42.png",
    63: f"{STORAGE_BASE_URL}/topik-i-36/reading/q63_64.png",
    64: f"{STORAGE_BASE_URL}/topik-i-36/reading/q63_64.png",
}

LISTENING_SPECIALS = {
    15: {
        "question_text": "남자 :무거우시죠?제가 도와 드릴까요?\n여자 :감사합니다.문 좀 열어 주시겠어요?\n알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
    16: {
        "question_text": "남자 :잠깐만요,손님.여기 전화기 놓고 가셨어요.\n여자 :(놀란 듯이)어머,그래요?\n알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
}

LISTENING_SHARED_CONTEXTS = {
    25: (
        "여자 :요즘 집안에 실내 정원을 만들고 싶어하는 분들 많으시죠?하지만 "
        "꽃을 심고 정원을 가꾸는 게 보통 일은 아닙니다.이럴 때 도움을 받을 수 있는 책이 한 권 있는데요."
        "이 책에는 꽃을 키우는 방법들이 사진과 함께 있어 배우기가 아주 쉽습니다.또 봄,여름,가을,겨울에 "
        "키울 수 있는 꽃의 종류도 알 수 있고요."
    ),
    26: (
        "여자 :요즘 집안에 실내 정원을 만들고 싶어하는 분들 많으시죠?하지만 "
        "꽃을 심고 정원을 가꾸는 게 보통 일은 아닙니다.이럴 때 도움을 받을 수 있는 책이 한 권 있는데요."
        "이 책에는 꽃을 키우는 방법들이 사진과 함께 있어 배우기가 아주 쉽습니다.또 봄,여름,가을,겨울에 "
        "키울 수 있는 꽃의 종류도 알 수 있고요."
    ),
    27: (
        "여자 :선생님,안녕하세요?다음 주부터 방학이라 인사드리러 왔어요.\n"
        "남자 :어,어서 와요.(조금 쉬고)이번 방학에는 뭐 할 거예요?\n"
        "여자 :방학을 좀 특별하게 보내고 싶어서 자전거 여행을 해 보려고요.\n"
        "남자 :음,자전거 여행 좋죠.힘들기는 하겠지만 좋은 경험이 될 거예요.\n"
        "여자 :네.그리고 기타도 한번 배워 보려고 해요.\n"
        "남자 :새로운 걸 배워 보는 것도 좋겠네요."
    ),
    28: (
        "여자 :선생님,안녕하세요?다음 주부터 방학이라 인사드리러 왔어요.\n"
        "남자 :어,어서 와요.(조금 쉬고)이번 방학에는 뭐 할 거예요?\n"
        "여자 :방학을 좀 특별하게 보내고 싶어서 자전거 여행을 해 보려고요.\n"
        "남자 :음,자전거 여행 좋죠.힘들기는 하겠지만 좋은 경험이 될 거예요.\n"
        "여자 :네.그리고 기타도 한번 배워 보려고 해요.\n"
        "남자 :새로운 걸 배워 보는 것도 좋겠네요."
    ),
    29: (
        "여자 :아이 통장을 하나 만들려고 하는데요.\n"
        "남자 :아,어린이 통장요?요즘 입학 때라 많이들 만드시네요.\n"
        "여자 :네.우리 아이도 자기 통장을 갖고 싶어해서 선물하려고요.\n"
        "남자 :좋은 생각이세요.자기 통장이 생기면 돈을 모으는 즐거움을 느낄 수 있을 거예요."
        "참,아이 도장은 가져오셨죠?\n"
        "여자 :도장이 필요해요?안 가져왔는데…….그냥 내일 다시 와야겠네요.\n"
        "남자 :그럼 내일 아이도 데리고 오세요.은행에 와서 직접 통장을 만들면 더 좋아할 거예요."
    ),
    30: (
        "여자 :아이 통장을 하나 만들려고 하는데요.\n"
        "남자 :아,어린이 통장요?요즘 입학 때라 많이들 만드시네요.\n"
        "여자 :네.우리 아이도 자기 통장을 갖고 싶어해서 선물하려고요.\n"
        "남자 :좋은 생각이세요.자기 통장이 생기면 돈을 모으는 즐거움을 느낄 수 있을 거예요."
        "참,아이 도장은 가져오셨죠?\n"
        "여자 :도장이 필요해요?안 가져왔는데…….그냥 내일 다시 와야겠네요.\n"
        "남자 :그럼 내일 아이도 데리고 오세요.은행에 와서 직접 통장을 만들면 더 좋아할 거예요."
    ),
}

READING_TEXT_OVERRIDES = {
    40: "다음을 읽고 맞지 않는 것을 고르십시오.",
    41: "다음을 읽고 맞지 않는 것을 고르십시오.",
    42: "다음을 읽고 맞지 않는 것을 고르십시오.",
}

LISTENING_IMAGE_ASSETS = {
    15: {"page": 5, "indices": [0, 1, 2, 3]},
    16: {"page": 5, "indices": [4, 5, 6, 7]},
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
    value = value.replace("\u00a0", " ")
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
        if line.startswith("제36회 한국어능력시험I B형"):
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
        if line.startswith("제36회 한국어능력시험I B형"):
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
    value = re.split(r"\n(?:제36회|TOPIKⅠ 읽기|TOPIKⅠ 듣기)", value, maxsplit=1)[0]
    return normalize_text(value)


def sanitize_option_text(value: str) -> str:
    value = re.split(r"\n(?:제36회|TOPIKⅠ 읽기|TOPIKⅠ 듣기|※ \[)", value, maxsplit=1)[0]
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

    start_match = re.search(rf"{order[0]}[①②③④❶❷❸❹]", text)
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
            listening_page_blocks[page_number] = image_blocks_from_page(LISTENING_PDF, page_number)
            render_pdf_page(LISTENING_PDF, page_number, ASSETS_ROOT / "debug_pages" / f"listening_page_{page_number}.png")
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
        "-- Generated by scripts/generate_topik_i_36_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK I 36-р шалгалт',",
        "  'TOPIK_I',",
        "  36,",
        "  '36-р албан ёсны TOPIK I шалгалт',",
        "  70,",
        "  100,",
        "  30,",
        "  40",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 36",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK I 36-р шалгалт', description = '36-р албан ёсны TOPIK I шалгалт', total_questions = 70, duration = 100, listening_questions = 30, reading_questions = 40, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
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
