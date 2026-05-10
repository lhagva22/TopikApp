from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"

PAPERS_PDF = DOWNLOADS / "52nd TOPIK I Papers.pdf"
LISTENING_PDF = DOWNLOADS / "52nd TOPIK I Listening Text.pdf"
ANSWER_PDF = DOWNLOADS / "52nd TOPIK I Answer Sheets.pdf"
LISTENING_AUDIO = DOWNLOADS / "52nd-TOPIK-I-Listening-Audio-File-64k-mono.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_i_52.sql"
ASSETS_ROOT = ROOT / "topik_i_52_assets"
UPLOAD_ROOT = ASSETS_ROOT / "upload" / "topik-i-52"
BACKEND_MEDIA_ROOT = ROOT / "backend" / "public" / "topik-i-52"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = "52nd-TOPIK-I-Listening-Audio-File-64k-mono.mp3"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-i-52/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_I' AND test_number = 52 "
    "ORDER BY created_at DESC LIMIT 1)"
)

CIRCLED_TO_INDEX = {"①": 1, "②": 2, "③": 3, "④": 4, "❶": 1, "❷": 2, "❸": 3, "❹": 4, "➀": 1, "➁": 2, "➂": 3, "➃": 4}

LISTENING_OPTION_IMAGE_URLS = {
    15: [f"{STORAGE_BASE_URL}/topik-i-52/listening/q15_option_{index}.png" for index in range(1, 5)],
    16: [f"{STORAGE_BASE_URL}/topik-i-52/listening/q16_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    40: f"{STORAGE_BASE_URL}/topik-i-52/reading/q40.png",
    41: f"{STORAGE_BASE_URL}/topik-i-52/reading/q41.png",
    42: f"{STORAGE_BASE_URL}/topik-i-52/reading/q42.png",
    63: f"{STORAGE_BASE_URL}/topik-i-52/reading/q63_64.png",
    64: f"{STORAGE_BASE_URL}/topik-i-52/reading/q63_64.png",
}

LISTENING_SPECIALS = {
    15: {
        "question_text": "여자 :뭘 드릴까요?손님.\n남자 :김밥 하나 주세요.\n알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
    16: {
        "question_text": "여자 :비가 오네요.우산이 없는데…….\n남자 :그래요?저하고 같이 써요.\n알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
}

LISTENING_SHARED_CONTEXTS = {
    25: (
        "여자 :딩동댕 승객 여러분,안녕하십니까?이 버스는 시청에서 출발해서 중앙공원까지 가는 서울 투어 버스입니다."
        "중간에 내려서 관광지를 구경할 수 있고,다음 버스를 탈 때는 표를 다시 사지 않아도 됩니다."
        "버스는 삼십 분마다 서울 투어 버스 정류장에서 이용하실 수 있습니다.감사합니다."
    ),
    26: (
        "여자 :딩동댕 승객 여러분,안녕하십니까?이 버스는 시청에서 출발해서 중앙공원까지 가는 서울 투어 버스입니다."
        "중간에 내려서 관광지를 구경할 수 있고,다음 버스를 탈 때는 표를 다시 사지 않아도 됩니다."
        "버스는 삼십 분마다 서울 투어 버스 정류장에서 이용하실 수 있습니다.감사합니다."
    ),
    27: (
        "여자 :네,인주 서비스 센터입니다.무엇을 도와 드릴까요?\n"
        "남자 :새로 산 텔레비전이 갑자기 소리가 안 나와요.\n"
        "여자 :그럼 텔레비전을 한번 꺼 보세요.그리고 잠시 후에 다시 켜 보세요.\n"
        "남자 :그렇게 해 봤는데 안 돼요.(잠시 쉬고)오늘 고칠 수 있을까요?\n"
        "여자 :오늘은 늦어서 어렵고요.내일 오전에 직원이 연락 드리고 고치러 갈 겁니다.\n"
        "남자 :네,알겠습니다."
    ),
    28: (
        "여자 :네,인주 서비스 센터입니다.무엇을 도와 드릴까요?\n"
        "남자 :새로 산 텔레비전이 갑자기 소리가 안 나와요.\n"
        "여자 :그럼 텔레비전을 한번 꺼 보세요.그리고 잠시 후에 다시 켜 보세요.\n"
        "남자 :그렇게 해 봤는데 안 돼요.(잠시 쉬고)오늘 고칠 수 있을까요?\n"
        "여자 :오늘은 늦어서 어렵고요.내일 오전에 직원이 연락 드리고 고치러 갈 겁니다.\n"
        "남자 :네,알겠습니다."
    ),
    29: (
        "남자 :이번 한국어 말하기 대회에서 1등을 하셨는데요.기분이 어떠세요?\n"
        "여자 :잘하는 학생들이 많았는데 제가 상을 받아서 정말 기뻐요.\n"
        "남자 :그렇군요.실수도 하지 않고 자연스럽게 잘하셔서 정말 놀랐어요.\n"
        "여자 :사실 제가 사람들 앞에서 긴장을 많이 해요.그래서 친구들 앞에서 매일 말하기 연습을 했어요."
        "또 한국어 선생님께서 발음 연습을 도와주셨어요.그 덕분에 1등을 한 것 같아요.\n"
        "남자 :네,그런데 이번 대회에는 어떻게 참가하게 되셨어요?\n"
        "여자 :이번이 한국에서 공부하는 마지막 학기라서 그동안 해 보지 못한 경험을 하고 싶었어요."
    ),
    30: (
        "남자 :이번 한국어 말하기 대회에서 1등을 하셨는데요.기분이 어떠세요?\n"
        "여자 :잘하는 학생들이 많았는데 제가 상을 받아서 정말 기뻐요.\n"
        "남자 :그렇군요.실수도 하지 않고 자연스럽게 잘하셔서 정말 놀랐어요.\n"
        "여자 :사실 제가 사람들 앞에서 긴장을 많이 해요.그래서 친구들 앞에서 매일 말하기 연습을 했어요."
        "또 한국어 선생님께서 발음 연습을 도와주셨어요.그 덕분에 1등을 한 것 같아요.\n"
        "남자 :네,그런데 이번 대회에는 어떻게 참가하게 되셨어요?\n"
        "여자 :이번이 한국에서 공부하는 마지막 학기라서 그동안 해 보지 못한 경험을 하고 싶었어요."
    ),
}

READING_TEXT_OVERRIDES = {
    40: "다음을 읽고 맞지 않는 것을 고르십시오.",
    41: "다음을 읽고 맞지 않는 것을 고르십시오.",
    42: "다음을 읽고 맞지 않는 것을 고르십시오.",
}

LISTENING_IMAGE_ASSETS = {
    15: {"page": 5, "option_groups": [[0, 1], [2, 3], [4, 5], [6, 7]]},
    16: {"page": 5, "option_groups": [[8, 9], [10, 11], [12, 13], [14, 15]]},
}

READING_IMAGE_ASSETS = {
    40: {"page": 15, "block_indices": [0, 1, 2]},
    41: {"page": 16, "block_indices": [1, 2, 3]},
    42: {"page": 16, "block_indices": [4, 5, 6, 7, 8, 9]},
    63: {"page": 26, "block_indices": [1, 2, 3, 4, 5, 6]},
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
        if "한국어능력시험I" in line:
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
        if line.startswith("※ [31～33]") or line.startswith("※[31～33]"):
            started = True
        if not started:
            continue
        if "한국어능력시험I" in line:
            continue
        if ("TOPIKⅠ" in line or "TO PIKⅠ" in line) and "읽기" in line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def build_question_blocks(text: str, start: int, end: int) -> dict[int, str]:
    if start == 1 and end == 30:
        pattern = re.compile(r"(?<!\d)(\d{1,2})\.\s*(?=(?:\(\d+점\)|[가-힣]))")
    elif start == 31 and end == 70:
        pattern = re.compile(r"(?<!\d)(3[1-9]|[4-6]\d|70)\.")
    else:
        raise ValueError(f"Unsupported question range: {start}-{end}")

    matches = list(pattern.finditer(text))
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
    value = re.split(r"\n(?:제\d+회|TOPIKⅠ ?(?:읽기|듣기)|TO PIKⅠ ?읽기|※ ?\[)", value, maxsplit=1)[0]
    return normalize_text(value)


def sanitize_option_text(value: str) -> str:
    value = re.split(r"\n(?:제\d+회|TOPIKⅠ ?(?:읽기|듣기)|TO PIKⅠ ?읽기|※ ?\[)", value, maxsplit=1)[0]
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


def image_blocks_from_page(pdf_path: Path, page_number: int) -> list[dict[str, object]]:
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_number - 1)
        blocks = []
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 1:
                continue
            x0, y0, x1, y1 = block["bbox"]
            if (x1 - x0) < 60 or (y1 - y0) < 20:
                continue
            blocks.append(block)
        return blocks
    finally:
        doc.close()


def crop_region_from_blocks(pdf_path: Path, page_number: int, blocks: list[dict[str, object]], block_indices: list[int], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    selected = [blocks[index] for index in block_indices]
    x0 = min(block["bbox"][0] for block in selected)
    y0 = min(block["bbox"][1] for block in selected)
    x1 = max(block["bbox"][2] for block in selected)
    y1 = max(block["bbox"][3] for block in selected)

    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_number - 1)
        clip = fitz.Rect(x0, y0, x1, y1)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
        pix.save(output_path)
    finally:
        doc.close()


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
        blocks = listening_page_blocks[page_number]

        for option_index, group in enumerate(meta["option_groups"], start=1):
            debug_path = ASSETS_ROOT / "debug_pages" / f"q{question_number}_option_{option_index}.png"
            crop_region_from_blocks(LISTENING_PDF, page_number, blocks, group, debug_path)
            copy_asset(debug_path, Path("listening") / f"q{question_number}_option_{option_index}.png")

    reading_page_blocks: dict[int, list[dict[str, object]]] = {}
    for question_number, meta in READING_IMAGE_ASSETS.items():
        page_number = int(meta["page"])
        if page_number not in reading_page_blocks:
            reading_page_blocks[page_number] = image_blocks_from_page(PAPERS_PDF, page_number)
        blocks = reading_page_blocks[page_number]
        name = "q63_64.png" if question_number == 63 else f"q{question_number}.png"
        debug_path = ASSETS_ROOT / "debug_pages" / name
        crop_region_from_blocks(PAPERS_PDF, page_number, blocks, meta["block_indices"], debug_path)
        copy_asset(debug_path, Path("reading") / name)


def build_sql(questions: list[dict[str, object]]) -> str:
    lines = [
        "-- Generated by scripts/generate_topik_i_52_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK I 52-р шалгалт',",
        "  'TOPIK_I',",
        "  52,",
        "  '52-р албан ёсны TOPIK I шалгалт',",
        "  70,",
        "  100,",
        "  30,",
        "  40",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 52",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK I 52-р шалгалт', description = '52-р албан ёсны TOPIK I шалгалт', total_questions = 70, duration = 100, listening_questions = 30, reading_questions = 40, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
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
