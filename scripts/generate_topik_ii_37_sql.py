from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"

PAPERS_PDF = DOWNLOADS / "37th TOPIK II Papers.pdf"
LISTENING_PDF = DOWNLOADS / "37th TOPIK II Listening Text.pdf"
ANSWER_PDF = DOWNLOADS / "37th TOPIK II Answer sheet.pdf"
LISTENING_AUDIO = DOWNLOADS / "37th-TOPIK-II-Listening-Audio-File-64k-mono.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_ii_37.sql"
ASSETS_ROOT = ROOT / "topik_ii_37_assets"
UPLOAD_ROOT = ASSETS_ROOT / "upload" / "topik-ii-37"
BACKEND_MEDIA_ROOT = ROOT / "backend" / "public" / "topik-ii-37"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-ii-37/audio/37th-TOPIK-II-Listening-Audio-File-64k-mono.mp3"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_II' AND test_number = 37 "
    "ORDER BY created_at DESC LIMIT 1)"
)

CIRCLED_TO_INDEX = {"①": 1, "②": 2, "③": 3, "④": 4, "❶": 1, "❷": 2, "❸": 3, "❹": 4, "➀": 1, "➁": 2, "➂": 3, "➃": 4}
QUESTION_PATTERN = re.compile(r"(?<!\d)(\d{1,2})\.\s*(?=\S)")

# Listening Text PDF 1-26 хуудас
LISTENING_PAGE_RANGES = range(1, 27)
# Papers PDF доторх reading хэсэг (cover=18, info=19, асуултууд 20-40)
READING_PAGE_RANGES = range(20, 41)

LISTENING_IMAGE_URLS: dict[int, str] = {}

# Сонсголын 1, 2, 3-р асуултад зураг байдаг — 35, 36-тай ижил бүтэц
LISTENING_OPTION_IMAGE_URLS = {
    1: [f"{STORAGE_BASE_URL}/topik-ii-37/listening/q1_option_{index}.png" for index in range(1, 5)],
    2: [f"{STORAGE_BASE_URL}/topik-ii-37/listening/q2_option_{index}.png" for index in range(1, 5)],
    3: [f"{STORAGE_BASE_URL}/topik-ii-37/listening/q3_option_{index}.png" for index in range(1, 5)],
}

# Уншлагын зурагтай асуултуудын URL — 55–60 стандарт бүтэц
READING_IMAGE_URLS = {
    55: f"{STORAGE_BASE_URL}/topik-ii-37/reading/q55.png",
    56: f"{STORAGE_BASE_URL}/topik-ii-37/reading/q56.png",
    57: f"{STORAGE_BASE_URL}/topik-ii-37/reading/q57.png",
    58: f"{STORAGE_BASE_URL}/topik-ii-37/reading/q58.png",
    59: f"{STORAGE_BASE_URL}/topik-ii-37/reading/q59.png",
    60: f"{STORAGE_BASE_URL}/topik-ii-37/reading/q60.png",
}

# 55–58: зургийг харж хариулах асуулт; 59–60: нийтлэлтэй танилцах асуулт
READING_TEXT_OVERRIDES = {
    55: "다음은 무엇에 대한 글인지 고르십시오.",
    56: "다음은 무엇에 대한 글인지 고르십시오.",
    57: "다음은 무엇에 대한 글인지 고르십시오.",
    58: "다음은 무엇에 대한 글인지 고르십시오.",
    59: "다음 글 또는 도표의 내용과 같은 것을 고르십시오.",
    60: "다음 글 또는 도표의 내용과 같은 것을 고르십시오.",
}

# TODO: 37-р шалгалтын уншлагын холбогдох асуултуудыг шалгаж бөглөх
# Жишээ: {69: 68, 70: 68}  ← хэрэв 68, 69, 70 нэг эхийн асуулт бол
READING_SHARED_CONTEXT_FROM_PREVIOUS: dict[int, int] = {}

# Reading 19-20 (output 69-70) — passage parser-д q18-д хавчуулагдсан тул гараар нөхөв.
_PASSAGE_19_20 = (
    "대부분의 상품은 고유 번호가 있어서 정품을 쉽게 확인할 수 있다."
    " 그러나 미술품은 그렇지 않아서 진품 확인이 힘들다."
    " ( ) 미술 작품이 진짜인지를 확인해야 하는 상황이라면 미술품 감정 과정이 필요하다."
    " 미술품을 감정할 때에는 전문가 감정과 과학적 감정이 함께 사용되는데"
    " 이때 출처나 예술 기법, 서명 등이 고려된다."
    " 이러한 방법은 고미술품에서 현대 작품에 이르기까지 광범위하게 적용되고 있다."
)
READING_TEXT_MANUAL_OVERRIDES: dict[int, str] = {
    69: f"{_PASSAGE_19_20}\n( )에 들어갈 알맞은 것을 고르십시오.",
    70: f"{_PASSAGE_19_20}\n이 글의 내용과 같은 것을 고르십시오.",
}

# Сонсголын зурагтай хуудасны мэдээлэл — listening PDF дахь хуудас дугаарыг шалгах
LISTENING_IMAGE_ASSETS = {
    1: {"page": 1, "expected": 4},
    2: {"page": 2, "expected": 4},
    3: {"page": 3, "expected": 4},
}

# TODO: PAPERS_PDF-д reading зургуудын яг хуудас дугаарыг шалгаж тохируулах
# (36-д: q55-58 → page 21, q59-60 → page 22)
READING_IMAGE_ASSETS = {
    55: {"page": 21, "index": 0},
    56: {"page": 21, "index": 1},
    57: {"page": 21, "index": 2},
    58: {"page": 21, "index": 3},
    59: {"page": 22, "index": 0},
    60: {"page": 22, "index": 1},
}


def read_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def get_page_texts(path: Path, page_numbers: range) -> dict[int, str]:
    reader = PdfReader(str(path))
    pages: dict[int, str] = {}
    for page_number in page_numbers:
        text = reader.pages[page_number - 1].extract_text() or ""
        pages[page_number] = text
    return pages


def normalize_text(value: str) -> str:
    value = value.replace(" ", " ")
    value = value.replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{2,}", "\n", value)
    return value.strip()


def clean_listening_page(text: str) -> str:
    text = text.replace("듣기 통합 (1번 ～ 50번)", "")
    text = text.replace("듣기 통합(1번～50번)", "")
    text = re.sub(r"제37회 한국어능력시험II\s*B형\(듣기 통합\)", "", text)
    text = re.sub(r"제37회 한국어능력시험II\s*B형\s*\(듣기 통합\)", "", text)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.M)
    text = re.sub(r"(?m)^(\d{1,2})\s+(?=[가-힣A-Z\(])", r"\1. ", text)
    return normalize_text(text)


def clean_reading_page(text: str) -> str:
    text = re.sub(r"제37회 한국어능력시험II\s*B형\s*2교시\(읽기\)", "", text)
    text = re.sub(r"TOPIK\s*Ⅱ\s*읽기\s*\(1번\s*～\s*50번\)", "", text)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.M)
    text = re.sub(r"(?m)^(\d{1,2})\s+(?=[가-힣A-Z\(])", r"\1. ", text)
    return normalize_text(text)


def extract_shared_prefix(text: str, first_question_start: int) -> str:
    prefix = normalize_text(text[:first_question_start])
    if not prefix:
        return ""
    prefix = re.sub(r"^※\s*\[[^\]]+\].*?\(각\s*\d+점\)", "", prefix)
    prefix = re.sub(r"^※\s*\[[^\]]+\].*?\(\s*\d+\s*점\)", "", prefix)
    return normalize_text(prefix)


def build_question_blocks(page_texts: dict[int, str], cleaner, valid_numbers: range) -> dict[int, str]:
    blocks: dict[int, str] = {}
    for _page, raw_text in page_texts.items():
        text = cleaner(raw_text)
        matches = list(QUESTION_PATTERN.finditer(text))
        shared_prefix = extract_shared_prefix(text, matches[0].start()) if matches else ""
        for index, match in enumerate(matches):
            q_num = int(match.group(1))
            if q_num not in valid_numbers:
                continue
            start = match.start()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            block = normalize_text(text[start:end])
            if shared_prefix:
                block = normalize_text(f"{shared_prefix}\n{block}")
            blocks[q_num] = block
    missing = [number for number in valid_numbers if number not in blocks]
    if missing:
        raise ValueError(f"Missing question blocks: {missing}")
    return blocks


def sanitize_stem_text(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"(?m)^\d+\.\s*", "", value)
    return normalize_text(value)


def sanitize_option_text(value: str) -> str:
    value = re.split(r"\n(?:※|TOPIK\b)", value, maxsplit=1)[0]
    value = re.split(r"\s+TOPIK[ⅡII]+\b", value, maxsplit=1)[0]
    value = value.replace("\n", " ")
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


def parse_answer_page(page_index: int) -> dict[int, tuple[int, int]]:
    reader = PdfReader(str(ANSWER_PDF))
    text = (reader.pages[page_index].extract_text() or "").replace(" ", "").replace("\n", "")
    pattern = re.compile(r"(?=(\d{1,2})([①②③④❶❷❸❹➀➁➂➃])2)")
    answers: dict[int, tuple[int, int]] = {}
    for q_num, choice in pattern.findall(text):
        q_num_int = int(q_num)
        if 1 <= q_num_int <= 50:
            answers[q_num_int] = (CIRCLED_TO_INDEX[choice], 2)
    return answers


def parse_listening_answers() -> dict[int, tuple[int, int]]:
    answers = parse_answer_page(0)
    if len(answers) != 50:
        raise ValueError(f"Expected 50 listening answers, got {len(answers)}")
    return answers


def parse_reading_answers() -> dict[int, tuple[int, int]]:
    # TODO: Answer PDF-д reading хариулт хэдэн хуудсанд байгааг шалгах
    # 35-д: page_index=1, 36-д: page_index=2
    answers = parse_answer_page(2)
    if len(answers) != 50:
        raise ValueError(f"Expected 50 reading answers, got {len(answers)}")
    return answers


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_json_array(values: list[str]) -> str:
    return sql_string(json.dumps(values, ensure_ascii=False)) + "::jsonb"


def build_questions() -> list[dict[str, object]]:
    listening_blocks = build_question_blocks(get_page_texts(LISTENING_PDF, LISTENING_PAGE_RANGES), clean_listening_page, range(1, 51))
    reading_blocks = build_question_blocks(get_page_texts(PAPERS_PDF, READING_PAGE_RANGES), clean_reading_page, range(1, 51))
    listening_answers = parse_listening_answers()
    reading_answers = parse_reading_answers()

    questions: list[dict[str, object]] = []
    for q_num in range(1, 51):
        stem, options = split_block(listening_blocks[q_num])
        if q_num in LISTENING_OPTION_IMAGE_URLS:
            options = ["①", "②", "③", "④"]
        answer_index = listening_answers[q_num][0] - 1
        questions.append(
            {
                "section": "listening",
                "question_number": q_num,
                "question_text": stem,
                "question_image_url": LISTENING_IMAGE_URLS.get(q_num),
                "audio_url": AUDIO_URL,
                "option_image_urls": LISTENING_OPTION_IMAGE_URLS.get(q_num),
                "options": options,
                "question_score": listening_answers[q_num][1],
                "correct_answer_text": options[answer_index],
            }
        )

    for raw_q_num in range(1, 51):
        output_q_num = raw_q_num + 50
        stem, options = split_block(reading_blocks[raw_q_num])
        if output_q_num in READING_TEXT_OVERRIDES and not stem:
            stem = READING_TEXT_OVERRIDES[output_q_num]
        answer_index = reading_answers[raw_q_num][0] - 1
        questions.append(
            {
                "section": "reading",
                "question_number": output_q_num,
                "question_text": stem,
                "question_image_url": READING_IMAGE_URLS.get(output_q_num),
                "audio_url": None,
                "option_image_urls": None,
                "options": options,
                "question_score": reading_answers[raw_q_num][1],
                "correct_answer_text": options[answer_index],
            }
        )

    by_number = {question["question_number"]: question for question in questions if question["section"] == "reading"}
    for question_number, previous_question_number in READING_SHARED_CONTEXT_FROM_PREVIOUS.items():
        current = by_number.get(question_number)
        previous = by_number.get(previous_question_number)
        if not current or not previous:
            continue
        if len(str(current["question_text"])) < 80:
            current["question_text"] = normalize_text(f"{previous['question_text']}\n{current['question_text']}")

    for question_number, override_text in READING_TEXT_MANUAL_OVERRIDES.items():
        current = by_number.get(question_number)
        if current:
            current["question_text"] = normalize_text(override_text)

    return questions


def build_sql(questions: list[dict[str, object]]) -> str:
    lines = [
        "-- Generated by scripts/generate_topik_ii_37_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK II 37-р шалгалт',",
        "  'TOPIK_II',",
        "  37,",
        "  '37-р албан ёсны TOPIK II шалгалт',",
        "  100,",
        "  130,",
        "  50,",
        "  50",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_II' AND test_number = 37",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK II 37-р шалгалт', description = '37-р албан ёсны TOPIK II шалгалт', total_questions = 100, duration = 130, listening_questions = 50, reading_questions = 50, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
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
                    sql_json_array(question["options"]),  # type: ignore[arg-type]
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
    copy_asset(LISTENING_AUDIO, Path("audio") / LISTENING_AUDIO.name)
    for question_number, meta in LISTENING_IMAGE_ASSETS.items():
        page_number = int(meta["page"])
        expected = int(meta["expected"])
        blocks = image_blocks_from_page(LISTENING_PDF, page_number)
        if len(blocks) != expected:
            raise ValueError(f"Listening page {page_number}: expected {expected} image blocks, found {len(blocks)}")
        for index, block in enumerate(blocks, start=1):
            debug_path = ASSETS_ROOT / "debug_pages" / f"q{question_number}_option_{index}.png"
            save_block_image(block, debug_path)
            copy_asset(debug_path, Path("listening") / f"q{question_number}_option_{index}.png")

    reading_pages_to_render = sorted({int(meta["page"]) for meta in READING_IMAGE_ASSETS.values()})
    for page_number in reading_pages_to_render:
        render_pdf_page(PAPERS_PDF, page_number, ASSETS_ROOT / "debug_pages" / f"reading_page_{page_number}.png")
    reading_page_blocks = {page_number: image_blocks_from_page(PAPERS_PDF, page_number) for page_number in reading_pages_to_render}
    for question_number, meta in READING_IMAGE_ASSETS.items():
        page_number = int(meta["page"])
        index = int(meta["index"])
        blocks = reading_page_blocks[page_number]
        if index >= len(blocks):
            raise ValueError(f"Reading page {page_number}: expected image index {index}, found {len(blocks)} blocks")
        debug_path = ASSETS_ROOT / "debug_pages" / f"q{question_number}.png"
        save_block_image(blocks[index], debug_path)
        copy_asset(debug_path, Path("reading") / f"q{question_number}.png")


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
