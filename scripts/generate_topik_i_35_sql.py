from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"
PAPERS_PDF = DOWNLOADS / "35th-TOPIK-I-Papers.pdf"
LISTENING_PDF = DOWNLOADS / "35th TOPIK I Listening Text.pdf"
ANSWER_PDF = DOWNLOADS / "35th-TOPIK-I-Answer-Sheet.pdf"
OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_i_35.sql"

MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_I' AND test_number = 35 "
    "ORDER BY created_at DESC LIMIT 1)"
)
STORAGE_BASE_URL = "__STORAGE_BASE_URL__"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-i-35/audio/35-TOPIK-I-Listening-Audio-File.mp3"

CIRCLED_TO_INDEX = {"①": 1, "②": 2, "③": 3, "④": 4}

LISTENING_SPECIALS = {
    15: {
        "question_text": "남자: 졸업 축하해요. 이 꽃 받으세요.\n여자: 고마워요.\n알맞은 그림을 고르십시오.",
        "options": [
            "졸업식에서 남자가 여자에게 꽃을 선물합니다.",
            "집 앞에서 두 사람이 화분에 물을 줍니다.",
            "졸업식에서 사진을 찍고 있습니다.",
            "꽃가게에서 남자가 꽃을 사고 있습니다.",
        ],
    },
    16: {
        "question_text": "남자: (약간 멀리서) 유미 씨, 빨리 오세요.\n여자: 잠깐만요. 오랜만에 자전거를 타니까 잘 못 타겠어요.\n알맞은 그림을 고르십시오.",
        "options": [
            "두 사람이 자전거 대신 뛰고 있습니다.",
            "두 사람이 한 대의 자전거를 함께 타고 있습니다.",
            "두 사람이 각자 자전거를 타고 있습니다.",
            "자전거를 수리하고 있습니다.",
        ],
    },
}

READING_SPECIALS = {
    40: {
        "question_text": "\"1년 사용한 컴퓨터를 팔아요.\"\n가격: 100,000원\n연락처: study@Korea.co.kr\n맞지 않는 것을 고르십시오.",
    },
    41: {
        "question_text": "민수 씨,\n제 동생이 왔어요.\n그래서 지금 회사 앞 커피숍에 있어요.\n1시에 회사에 가겠습니다. ^^\n지현 드림\n맞지 않는 것을 고르십시오.",
    },
    42: {
        "question_text": "행복음악회\n음악회에 초대합니다.\n기간: 2014년 8월 1일 ~ 8월 31일\n일시: 매주 토요일 오후 8시\n장소: 하늘공원\n맞지 않는 것을 고르십시오.",
    },
    63: {
        "question_text": "받는사람: sarang@parang.com; koreal@empan.com; minsu@bola.com; ok1213@maver.com; tree@maver.com\n제목: 유학생 농구 대회\n보낸사람: yumi@parang.com\n\n농구 대회에 참가 신청을 해 주셔서 감사합니다.\n이번 주 토요일 오전 10시에 운동장에서 대회가 시작됩니다.\n경기에 참가하는 선수들은 9시까지 와 주시기 바랍니다.\n비가 오면 학생회관 옆에 있는 체육관에서 경기를 하겠습니다.\n그럼, 토요일에 뵙겠습니다.\n학생회장 김유미 올림\n유미 씨는 왜 이 글을 썼습니까?",
    },
    64: {
        "question_text": "받는사람: sarang@parang.com; koreal@empan.com; minsu@bola.com; ok1213@maver.com; tree@maver.com\n제목: 유학생 농구 대회\n보낸사람: yumi@parang.com\n\n농구 대회에 참가 신청을 해 주셔서 감사합니다.\n이번 주 토요일 오전 10시에 운동장에서 대회가 시작됩니다.\n경기에 참가하는 선수들은 9시까지 와 주시기 바랍니다.\n비가 오면 학생회관 옆에 있는 체육관에서 경기를 하겠습니다.\n그럼, 토요일에 뵙겠습니다.\n학생회장 김유미 올림\n이 글의 내용과 같은 것을 고르십시오.",
    },
}

QUESTION_IMAGE_URLS = {
    40: f"{STORAGE_BASE_URL}/topik-i-35/reading/q40.png",
    41: f"{STORAGE_BASE_URL}/topik-i-35/reading/q41.png",
    42: f"{STORAGE_BASE_URL}/topik-i-35/reading/q42.png",
    63: f"{STORAGE_BASE_URL}/topik-i-35/reading/q63_64.png",
    64: f"{STORAGE_BASE_URL}/topik-i-35/reading/q63_64.png",
}

OPTION_IMAGE_URLS = {
    15: [
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q15_option_1.png",
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q15_option_2.png",
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q15_option_3.png",
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q15_option_4.png",
    ],
    16: [
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q16_option_1.png",
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q16_option_2.png",
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q16_option_3.png",
        f"{STORAGE_BASE_URL}/topik-i-35/listening/q16_option_4.png",
    ],
}

QUESTION_SCORE_OVERRIDES = {
    49: 2,
    50: 3,
    61: 2,
    62: 3,
    67: 2,
    68: 2,
    69: 3,
    70: 3,
}

SHARED_CONTEXTS = {
    25: "여자: 자, 여러분. 호텔에 도착했습니다. 많이 피곤하시죠? 먼저 방에 가 계시면 짐들을 가져다 드리겠습니다. 식사는 지하 1층 식당에서 하시면 됩니다. 호텔에 있는 수영장은 무료로 이용하실 수 있습니다. 그리고 필요한 것이 있으면 저에게 전화해 주십시오. 제 방은 301호입니다. 그럼 편히 쉬십시오.",
    26: "여자: 자, 여러분. 호텔에 도착했습니다. 많이 피곤하시죠? 먼저 방에 가 계시면 짐들을 가져다 드리겠습니다. 식사는 지하 1층 식당에서 하시면 됩니다. 호텔에 있는 수영장은 무료로 이용하실 수 있습니다. 그리고 필요한 것이 있으면 저에게 전화해 주십시오. 제 방은 301호입니다. 그럼 편히 쉬십시오.",
    27: "여자: 부산에 소포를 보내려고 하는데 지금 보내면 언제 도착해요?\n남자: 지금 보내시면 모레 도착할 거예요.\n여자: 오늘 저녁까지 도착할 수는 없을까요? 제가 좀 급해서요.\n남자: 오전에 보내셨으면 오늘 안에 도착하는데 지금은 너무 늦었어요. 지금은 특급으로 보내도 내일 오전에 도착해요.\n여자: 아, 그래요? 내일 오전까지 들어갈 수 있으면 그걸로 해 주세요.",
    28: "여자: 부산에 소포를 보내려고 하는데 지금 보내면 언제 도착해요?\n남자: 지금 보내시면 모레 도착할 거예요.\n여자: 오늘 저녁까지 도착할 수는 없을까요? 제가 좀 급해서요.\n남자: 오전에 보내셨으면 오늘 안에 도착하는데 지금은 너무 늦었어요. 지금은 특급으로 보내도 내일 오전에 도착해요.\n여자: 아, 그래요? 내일 오전까지 들어갈 수 있으면 그걸로 해 주세요.",
    29: "여자: 민수 씨, 이번 주말에 ‘사랑나누기’ 모임이 있는데 같이 가실래요?\n남자: ‘사랑나누기’요? 그게 뭐예요?\n여자: 혼자 사시는 할머니들을 도와 드리는 모임이에요.\n남자: 아, 그래요? 근데 무슨 일을 도와 드려요?\n여자: 청소를 하거나 음식을 만들어 드려요. 이번 주말엔 김치를 담가서 드릴 거예요.\n남자: 좋은 일을 하시네요. 저도 이번 모임에 가 보고 싶어요. 김치를 담가 본 적은 없지만 열심히 해 볼게요.",
    30: "여자: 민수 씨, 이번 주말에 ‘사랑나누기’ 모임이 있는데 같이 가실래요?\n남자: ‘사랑나누기’요? 그게 뭐예요?\n여자: 혼자 사시는 할머니들을 도와 드리는 모임이에요.\n남자: 아, 그래요? 근데 무슨 일을 도와 드려요?\n여자: 청소를 하거나 음식을 만들어 드려요. 이번 주말엔 김치를 담가서 드릴 거예요.\n남자: 좋은 일을 하시네요. 저도 이번 모임에 가 보고 싶어요. 김치를 담가 본 적은 없지만 열심히 해 볼게요.",
    49: "제 친구는 그림 그리는 것을 좋아합니다. 그래서 시간이 있을 때마다 종이컵에 그림을 그립니다. 그리고 친한 사람들에게 종이컵을 선물합니다. (㉠) 종이컵은 세상에 하나만 있습니다. 친구의 종이컵은 참 예쁩니다.",
    50: "제 친구는 그림 그리는 것을 좋아합니다. 그래서 시간이 있을 때마다 종이컵에 그림을 그립니다. 그리고 친한 사람들에게 종이컵을 선물합니다. (㉠) 종이컵은 세상에 하나만 있습니다. 친구의 종이컵은 참 예쁩니다.",
    51: "몇 십 년 후에는 자동차가 하늘로 다닐 것입니다. 그러면 그 자동차를 만드는 사람이 필요합니다. 그리고 하늘에 자동차가 있으면 하늘에서 일하는 교통경찰도 있어야 합니다. 지금은 이런 사람들을 (㉠) 없습니다. 하지만 앞으로는 이런 사람들을 자주 볼 수 있을 것입니다.",
    52: "몇 십 년 후에는 자동차가 하늘로 다닐 것입니다. 그러면 그 자동차를 만드는 사람이 필요합니다. 그리고 하늘에 자동차가 있으면 하늘에서 일하는 교통경찰도 있어야 합니다. 지금은 이런 사람들을 (㉠) 없습니다. 하지만 앞으로는 이런 사람들을 자주 볼 수 있을 것입니다.",
    53: "저는 아침에 일어나서 혼자 운동을 합니다. 운동을 하면 즐겁습니다. 그런데 아침에 (㉠) 일어나는 것이 힘들어서 가끔 운동을 못 합니다. 그래서 다음 주부터는 저녁에 친구와 같이 운동을 하기로 했습니다. 이제 매일 운동을 할 것 같습니다.",
    54: "저는 아침에 일어나서 혼자 운동을 합니다. 운동을 하면 즐겁습니다. 그런데 아침에 (㉠) 일어나는 것이 힘들어서 가끔 운동을 못 합니다. 그래서 다음 주부터는 저녁에 친구와 같이 운동을 하기로 했습니다. 이제 매일 운동을 할 것 같습니다.",
    55: "저는 안경이 여러 개 있습니다. 그래서 그때그때 다른 안경을 씁니다. 사람을 처음 만날 때는 부드러운 느낌의 안경을 씁니다. 운동을 할 때는 가벼운 안경을 씁니다. (㉠) 멋있게 보이고 싶을 때는 유행하는 안경을 씁니다. 이렇게 안경을 바꿔서 쓰면 기분이 좋아집니다.",
    56: "저는 안경이 여러 개 있습니다. 그래서 그때그때 다른 안경을 씁니다. 사람을 처음 만날 때는 부드러운 느낌의 안경을 씁니다. 운동을 할 때는 가벼운 안경을 씁니다. (㉠) 멋있게 보이고 싶을 때는 유행하는 안경을 씁니다. 이렇게 안경을 바꿔서 쓰면 기분이 좋아집니다.",
    59: "라면은 맛있지만 소금이 많이 들어 있어서 건강에 나쁩니다. (㉠) 라면의 소금은 보통 국물을 만드는 스프에 있습니다. (㉡) 그래도 국물을 먹고 싶으면 스프를 조금만 넣습니다. (㉢) 그리고 라면을 끓일 때 스프를 늦게 넣는 것도 소금을 덜 먹는 또 하나의 방법입니다. (㉣)",
    60: "라면은 맛있지만 소금이 많이 들어 있어서 건강에 나쁩니다. (㉠) 라면의 소금은 보통 국물을 만드는 스프에 있습니다. (㉡) 그래도 국물을 먹고 싶으면 스프를 조금만 넣습니다. (㉢) 그리고 라면을 끓일 때 스프를 늦게 넣는 것도 소금을 덜 먹는 또 하나의 방법입니다. (㉣)",
    61: "지금은 동전과 지폐를 모두 사용합니다. 하지만 전에는 동전만 사용했습니다. 종이로 만든 지폐는 쉽게 찢어지고 더러워져서 (㉠) 못합니다. 그리고 가짜 돈을 만들기도 쉽습니다. 그래서 동전보다 지폐를 늦게 사용한 것입니다.",
    62: "지금은 동전과 지폐를 모두 사용합니다. 하지만 전에는 동전만 사용했습니다. 종이로 만든 지폐는 쉽게 찢어지고 더러워져서 (㉠) 못합니다. 그리고 가짜 돈을 만들기도 쉽습니다. 그래서 동전보다 지폐를 늦게 사용한 것입니다.",
    65: "식혜는 한국의 전통 음료수입니다. 보통 모임이나 잔치에서 (㉠) 식혜를 마십니다. 이것은 식혜가 소화를 도와주기 때문입니다. 식혜는 달고 맛있어서 많은 사람들이 좋아합니다. 시원하게 마시면 더 좋습니다. 저는 식혜를 만드는 방법이 간단해서 자주 만들어 먹습니다. 하지만 만드는 데 시간이 오래 걸립니다.",
    66: "식혜는 한국의 전통 음료수입니다. 보통 모임이나 잔치에서 (㉠) 식혜를 마십니다. 이것은 식혜가 소화를 도와주기 때문입니다. 식혜는 달고 맛있어서 많은 사람들이 좋아합니다. 시원하게 마시면 더 좋습니다. 저는 식혜를 만드는 방법이 간단해서 자주 만들어 먹습니다. 하지만 만드는 데 시간이 오래 걸립니다.",
    67: "문제를 풀기 어려울 때는 책상 앞에만 앉아 있지 마십시오. 계속 앉아 있으면 좋은 생각이 (㉠) 않습니다. 그럴 때는 일어나서 걷는 것이 좋습니다. 걸으려고 꼭 밖으로 (㉡). 집 안도 좋고 사무실 안도 괜찮습니다.",
    68: "문제를 풀기 어려울 때는 책상 앞에만 앉아 있지 마십시오. 계속 앉아 있으면 좋은 생각이 (㉠) 않습니다. 그럴 때는 일어나서 걷는 것이 좋습니다. 걸으려고 꼭 밖으로 (㉡). 집 안도 좋고 사무실 안도 괜찮습니다.",
    69: "우리 가족은 (㉠) 적이 없습니다. 그래서 저는 그동안 할머니께서 노래를 좋아하는 것을 몰랐습니다. 그런데 어젯밤에 할머니께서 공연 초대장을 주셨습니다. 그 공연에서 할머니가 노래를 하실 것입니다. 우리 가족은 공연에 가려고 합니다. 거기에서 할머니의 노래를 처음 듣게 될 것입니다.",
    70: "우리 가족은 (㉠) 적이 없습니다. 그래서 저는 그동안 할머니께서 노래를 좋아하는 것을 몰랐습니다. 그런데 어젯밤에 할머니께서 공연 초대장을 주셨습니다. 그 공연에서 할머니가 노래를 하실 것입니다. 우리 가족은 공연에 가려고 합니다. 거기에서 할머니의 노래를 처음 듣게 될 것입니다.",
}


def read_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def clean_text(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("제35회 한국어능력시험I B형"):
            continue
        if line.startswith("TOPIKⅠ"):
            continue
        if line.startswith("듣기 통합"):
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def parse_listening_answer_meta() -> dict[int, tuple[int, int]]:
    pattern = re.compile(r"(\d{1,2})([①②③④])(\d)")
    answers: dict[int, tuple[int, int]] = {}

    reader = PdfReader(str(ANSWER_PDF))
    listening_text = (reader.pages[0].extract_text() or "").replace(" ", "").replace("\n", "")
    for q_num, choice, _score in pattern.findall(listening_text):
        answers[int(q_num)] = (CIRCLED_TO_INDEX[choice], int(_score))

    return answers


def parse_answer_map() -> dict[int, int]:
    answers = {q_num: answer for q_num, (answer, _score) in parse_listening_answer_meta().items()}

    reading_answers = [
        3, 4, 1, 4, 1, 3, 3, 1, 1, 3,
        2, 4, 1, 2, 2, 4, 3, 3, 2, 4,
        1, 2, 4, 3, 3, 2, 4, 2, 2, 3,
        1, 1, 4, 4, 2, 3, 1, 3, 4, 1,
    ]
    for index, answer in enumerate(reading_answers, start=31):
        answers[index] = answer
    return answers


def build_question_blocks(text: str, start: int, end: int) -> dict[int, str]:
    clean = clean_text(text)
    matches = list(re.finditer(r"(?m)^(\d+)\.\s*", clean))
    blocks: dict[int, str] = {}
    for index, match in enumerate(matches):
        q_num = int(match.group(1))
        if q_num < start or q_num > end:
            continue
        block_start = match.start()
        block_end = matches[index + 1].start() if index + 1 < len(matches) else len(clean)
        blocks[q_num] = clean[block_start:block_end].strip()
    return blocks


def split_block(block: str) -> tuple[str, list[str]]:
    option_start = block.find("①")
    if option_start == -1:
        return block.strip(), []

    stem = block[:option_start].strip()
    options_text = block[option_start:].strip()
    match = re.search(r"①\s*(.*?)\s*②\s*(.*?)\s*③\s*(.*?)\s*④\s*(.*)$", options_text, re.S)
    if not match:
        raise ValueError(f"Could not parse options from block:\n{block}")

    options = [sanitize_option_text(group) for group in match.groups()]
    stem = sanitize_stem_text(stem)
    return stem, options


def normalize_text(value: str) -> str:
    value = value.replace("  ", " ")
    value = re.sub(r"\n{2,}", "\n", value)
    value = re.sub(r"[ \t]+", " ", value)
    return value.strip()


def sanitize_stem_text(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"^\d+\.\s*", "", value)
    value = re.sub(r"^\(\d+점\)\s*", "", value)
    return normalize_text(value)


def sanitize_option_text(value: str) -> str:
    value = re.split(r"\n※\s*\[", value, maxsplit=1)[0]
    value = re.split(r"\n제35회", value, maxsplit=1)[0]
    return normalize_text(value)


def strip_leading_score(stem: str) -> str:
    return sanitize_stem_text(stem)


def extract_question_score(block: str) -> int:
    match = re.search(r"\((\d+)점\)", block)
    if not match:
        return 1
    return int(match.group(1))


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_json_array(values: list[str]) -> str:
    return sql_string(json.dumps(values, ensure_ascii=False)) + "::jsonb"


def build_questions() -> list[dict[str, object]]:
    answers = parse_answer_map()
    listening_meta = parse_listening_answer_meta()
    listening_blocks = build_question_blocks(read_pdf_text(LISTENING_PDF), 1, 30)
    reading_blocks = build_question_blocks(read_pdf_text(PAPERS_PDF), 31, 70)

    questions: list[dict[str, object]] = []

    for q_num in range(1, 31):
        if q_num in LISTENING_SPECIALS:
            question_text = LISTENING_SPECIALS[q_num]["question_text"]
            options = LISTENING_SPECIALS[q_num]["options"]
        else:
            stem, options = split_block(listening_blocks[q_num])
            stem = strip_leading_score(stem)
            shared = SHARED_CONTEXTS.get(q_num)
            question_text = f"{shared}\n{stem}" if shared else stem
        answer_index = answers[q_num] - 1
        questions.append(
            {
                "section": "listening",
                "question_number": q_num,
                "question_text": question_text,
                "question_image_url": None,
                "audio_url": AUDIO_URL,
                "option_image_urls": OPTION_IMAGE_URLS.get(q_num),
                "options": options,
                "question_score": listening_meta[q_num][1],
                "correct_answer_text": options[answer_index],
            }
        )

    for q_num in range(31, 71):
        stem, options = split_block(reading_blocks[q_num])
        stem = strip_leading_score(stem)
        if q_num in READING_SPECIALS:
            question_text = READING_SPECIALS[q_num]["question_text"]
        else:
            shared = SHARED_CONTEXTS.get(q_num)
            question_text = f"{shared}\n{stem}" if shared else stem

        answer_index = answers[q_num] - 1
        questions.append(
            {
                "section": "reading",
                "question_number": q_num,
                "question_text": question_text,
                "question_image_url": QUESTION_IMAGE_URLS.get(q_num),
                "audio_url": None,
                "option_image_urls": None,
                "options": options,
                "question_score": QUESTION_SCORE_OVERRIDES.get(q_num, extract_question_score(reading_blocks[q_num])),
                "correct_answer_text": options[answer_index],
            }
        )

    return questions


def build_sql(questions: list[dict[str, object]]) -> str:
    lines = [
        "-- Generated by scripts/generate_topik_i_35_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK I 35-р шалгалт',",
        "  'TOPIK_I',",
        "  35,",
        "  '35-р албан ёсны TOPIK I шалгалт',",
        "  70,",
        "  100,",
        "  30,",
        "  40",  # reading questions
        # keep SELECT and WHERE on separate list items
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 35",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK I 35-р шалгалт', description = '35-р албан ёсны TOPIK I шалгалт', total_questions = 70, duration = 100, listening_questions = 30, reading_questions = 40, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
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

    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SQL.write_text(build_sql(questions), encoding="utf-8")
    print(f"Wrote {OUTPUT_SQL}")


if __name__ == "__main__":
    main()
