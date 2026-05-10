from __future__ import annotations

from pathlib import Path
import re

from topik_scanned_ocr_utils import (
    build_page_mapped_blocks,
    copy_asset,
    crop_rendered_region,
    get_page_texts,
    normalize_text,
    pdf_page_count,
    split_block,
    sql_json_array,
    sql_string,
)


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"

LISTENING_PDF = DOWNLOADS / "64th-TOPIK-I-Listening-Transcript.pdf"
READING_PDF = DOWNLOADS / "64th-TOPIK-I-Reading-Test-Paper.pdf"
LISTENING_AUDIO = DOWNLOADS / "64-TOPIK-I-Listening-Audio-File.mp3"

OUTPUT_SQL = ROOT / "backend" / "sql" / "mock_tests" / "topik_i_64.sql"
ASSETS_ROOT = ROOT / "topik_i_64_assets"
UPLOAD_ROOT = ASSETS_ROOT / "upload" / "topik-i-64"
OCR_CACHE_ROOT = ASSETS_ROOT / "ocr_cache"

STORAGE_BASE_URL = "https://ywtxdfwntobzegrlyplw.supabase.co/storage/v1/object/public/mock%20test%20files"
AUDIO_FILENAME = "64-TOPIK-I-Listening-Audio-File.mp3"
AUDIO_URL = f"{STORAGE_BASE_URL}/topik-i-64/audio/{AUDIO_FILENAME}"
MOCK_TEST_ID_SQL = (
    "(SELECT id FROM mock_test_bank "
    "WHERE exam_type = 'TOPIK_I' AND test_number = 64 "
    "ORDER BY created_at DESC LIMIT 1)"
)

LISTENING_QUESTION_PATTERN = re.compile(r"(?<!\d)(\d{1,2})[\.,]\s*\|?\s*(?=(?:\(|[가-힣A-Z<]))")
READING_QUESTION_PATTERN = re.compile(r"(?<!\d)(3[1-9]|[4-6]\d|70)[\.,]\s*\|?\s*(?=(?:\(|[가-힣A-Z<]))")

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

LISTENING_ANSWERS = {
    1: (2, 4), 2: (3, 4), 3: (3, 3), 4: (4, 3), 5: (3, 4), 6: (2, 3), 7: (1, 3), 8: (2, 3), 9: (1, 3), 10: (2, 4),
    11: (2, 3), 12: (4, 3), 13: (1, 4), 14: (3, 3), 15: (3, 4), 16: (1, 4), 17: (4, 3), 18: (1, 3), 19: (3, 3), 20: (2, 3),
    21: (2, 3), 22: (4, 3), 23: (2, 3), 24: (4, 3), 25: (1, 3), 26: (3, 4), 27: (4, 3), 28: (1, 4), 29: (4, 3), 30: (4, 4),
}

READING_ANSWERS = {
    31: (4, 2), 32: (2, 2), 33: (1, 2), 34: (2, 2), 35: (4, 2), 36: (2, 2), 37: (1, 3), 38: (4, 3), 39: (3, 2), 40: (3, 3),
    41: (2, 3), 42: (2, 3), 43: (2, 3), 44: (1, 2), 45: (2, 3), 46: (3, 3), 47: (4, 3), 48: (3, 2), 49: (1, 2), 50: (4, 2),
    51: (1, 3), 52: (3, 2), 53: (3, 2), 54: (1, 3), 55: (4, 2), 56: (3, 3), 57: (2, 3), 58: (3, 2), 59: (1, 2), 60: (1, 3),
    61: (2, 2), 62: (1, 2), 63: (4, 2), 64: (1, 3), 65: (4, 2), 66: (2, 3), 67: (4, 3), 68: (3, 3), 69: (3, 3), 70: (4, 3),
}

LISTENING_OPTION_IMAGE_URLS = {
    15: [f"{STORAGE_BASE_URL}/topik-i-64/listening/q15_option_{index}.png" for index in range(1, 5)],
    16: [f"{STORAGE_BASE_URL}/topik-i-64/listening/q16_option_{index}.png" for index in range(1, 5)],
}

READING_IMAGE_URLS = {
    40: f"{STORAGE_BASE_URL}/topik-i-64/reading/q40.png",
    41: f"{STORAGE_BASE_URL}/topik-i-64/reading/q41.png",
    42: f"{STORAGE_BASE_URL}/topik-i-64/reading/q42.png",
    63: f"{STORAGE_BASE_URL}/topik-i-64/reading/q63_64.png",
    64: f"{STORAGE_BASE_URL}/topik-i-64/reading/q63_64.png",
}

LISTENING_FULL_OVERRIDES: dict[int, dict[str, object]] = {
    1: {
        "stem": "다음을 듣고 <보기>와 같이 물음에 맞는 대답을 고르십시오.",
        "options": [
            "네, 책이 없어요.",
            "네, 책을 읽어요.",
            "아니요, 책이 많아요.",
            "아니요, 책을 좋아해요.",
        ],
    },
    2: {
        "stem": "다음을 듣고 <보기>와 같이 물음에 맞는 대답을 고르십시오.",
        "options": [
            "네, 구두예요.",
            "네, 구두가 예뻐요.",
            "아니요, 구두가 작아요.",
            "아니요, 구두가 있어요.",
        ],
    },
    3: {
        "stem": "다음을 듣고 <보기>와 같이 물음에 맞는 대답을 고르십시오.",
        "options": ["자주 먹어요.", "집에서 먹어요.", "김밥을 먹어요.", "언니하고 먹어요."],
    },
    4: {
        "stem": "다음을 듣고 <보기>와 같이 물음에 맞는 대답을 고르십시오.",
        "options": ["세 명이에요.", "같이 숙제해요.", "친구 집에 가요.", "두 시에 만나요."],
    },
    5: {
        "stem": "다음을 듣고 <보기>와 같이 이어지는 말을 고르십시오.",
        "options": ["괜찮아요.", "반가워요.", "여기 있어요.", "잘 지냈어요."],
    },
    6: {
        "stem": "다음을 듣고 <보기>와 같이 이어지는 말을 고르십시오.",
        "options": ["미안해요.", "아니에요.", "부탁해요.", "좋겠어요."],
    },
    7: {
        "stem": "여기는 어디입니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["꽃집", "식당", "교실", "약국"],
    },
    8: {
        "stem": "여기는 어디입니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["공항", "택시", "우체국", "백화점"],
    },
    9: {
        "stem": "여기는 어디입니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["호텔", "회사", "극장", "빵집"],
    },
    10: {
        "stem": "여기는 어디입니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["서점", "공원", "사진관", "미용실"],
    },
    11: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["일", "맛", "시간", "이름"],
    },
    12: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["나라", "장소", "날짜", "운동"],
    },
    13: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["계획", "날씨", "주말", "취미"],
    },
    14: {
        "stem": "다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.",
        "options": ["약속", "교통", "위치", "소개"],
    },
    15: {
        "stem": "다음 대화를 듣고 알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
    16: {
        "stem": "다음 대화를 듣고 알맞은 그림을 고르십시오.",
        "options": ["①", "②", "③", "④"],
    },
    17: {
        "stem": "다음을 듣고 <보기>와 같이 대화 내용과 같은 것을 고르십시오.",
        "options": [
            "남자는 출장을 갑니다.",
            "여자는 아침에 출발합니다.",
            "여자는 내일 회사에 안 갑니다.",
            "남자는 내일 여자를 만날 겁니다.",
        ],
    },
    18: {
        "stem": "다음을 듣고 <보기>와 같이 대화 내용과 같은 것을 고르십시오.",
        "options": [
            "여자는 식빵을 못 샀습니다.",
            "남자는 여자에게 빵을 줬습니다.",
            "여자는 이 곳에 세 시에 왔습니다.",
            "남자는 지금 빵집에 다녀올 겁니다.",
        ],
    },
    19: {
        "stem": "다음을 듣고 <보기>와 같이 대화 내용과 같은 것을 고르십시오.",
        "options": [
            "남자는 혼자 결혼식에 갈 겁니다.",
            "여자는 일곱 시에 남자를 만날 겁니다.",
            "여자는 지하철로 결혼식장에 갈 겁니다.",
            "남자는 결혼식에 차를 가지고 갈 겁니다.",
        ],
    },
    20: {
        "stem": "다음을 듣고 <보기>와 같이 대화 내용과 같은 것을 고르십시오.",
        "options": [
            "남자는 지금 카드가 없습니다.",
            "남자는 인터넷으로 예약했습니다.",
            "여자는 이 식당에 처음 왔습니다.",
            "여자는 남자와 같이 식사를 했습니다.",
        ],
    },
    21: {
        "stem": "다음을 듣고 <보기>와 같이 대화 내용과 같은 것을 고르십시오.",
        "options": [
            "여자는 남자와 같은 일을 합니다.",
            "여자는 박물관에서 일하고 있습니다.",
            "남자는 박물관에서 일을 해 봤습니다.",
            "남자는 아르바이트를 안 하려고 합니다.",
        ],
    },
    22: {
        "stem": "다음을 듣고 여자의 중심 생각을 고르십시오.",
        "options": [
            "재미있는 영화를 보고 싶습니다.",
            "영화는 여러 번 봐도 재미있습니다.",
            "이 영화는 많은 사람이 봐야 합니다.",
            "이 영화는 영화관에서 보는 게 좋습니다.",
        ],
    },
    23: {
        "stem": "다음을 듣고 여자의 중심 생각을 고르십시오.",
        "options": [
            "반이 더 많아져야 합니다.",
            "쉬운 수업을 듣고 싶습니다.",
            "수업을 더 듣는 것이 좋습니다.",
            "영어 수업이 많이 도움이 됩니다.",
        ],
    },
    24: {
        "stem": "다음을 듣고 여자의 중심 생각을 고르십시오.",
        "options": [
            "쓰레기를 모아서 버려야 합니다.",
            "물건을 많이 살 필요가 없습니다.",
            "쓰레기를 버리는 곳이 많이 필요합니다.",
            "물건을 안 버리고 다시 쓰는 게 좋습니다.",
        ],
    },
    25: {
        "stem": "다음을 듣고 물음에 답하십시오.\n여자가 왜 이 이야기를 하고 있는지 고르십시오.",
        "options": [
            "신청을 더 받으려고",
            "신청 방법이 바뀌어서",
            "대회 내용을 설명하려고",
            "대회 날짜를 알려 주려고",
        ],
    },
    26: {
        "stem": "다음을 듣고 물음에 답하십시오.\n들은 내용과 같은 것을 고르십시오.",
        "options": [
            "이 대회는 이번 달에 합니다.",
            "홈페이지에 대회 내용이 없습니다.",
            "금요일까지 참가 신청을 할 수 있습니다.",
            "이 대회에 참가 신청을 한 사람이 많습니다.",
        ],
    },
    27: {
        "stem": "다음을 듣고 물음에 답하십시오.\n두 사람이 무엇에 대해 이야기를 하고 있는지 고르십시오.",
        "options": ["인기 있는 드라마", "기억에 남는 여행", "원하는 휴가 기간", "드라마에 나온 장소"],
    },
    28: {
        "stem": "다음을 듣고 물음에 답하십시오.\n들은 내용과 같은 것을 고르십시오.",
        "options": [
            "남자는 작년 여름에 섬에 갔습니다.",
            "여자는 어제 드라마를 못 봤습니다.",
            "남자는 여수에 가 본 적이 없습니다.",
            "여자는 여수에서 휴가를 보냈습니다.",
        ],
    },
    29: {
        "stem": "다음을 듣고 물음에 답하십시오.\n남자가 그림을 배우게 된 이유를 고르십시오.",
        "options": [
            "새로운 취미를 갖고 싶어서",
            "그림을 보면 기분이 좋아져서",
            "좋아하는 사람을 그리고 싶어서",
            "영화에서 화가 역할을 하게 되어서",
        ],
    },
    30: {
        "stem": "다음을 듣고 물음에 답하십시오.\n들은 내용과 같은 것을 고르십시오.",
        "options": [
            "남자는 요즘 주로 산을 그립니다.",
            "남자는 어릴 때부터 그림을 배웠습니다.",
            "남자는 그림 전시회를 한 적이 있습니다.",
            "남자는 다른 사람과 함께 전시회를 합니다.",
        ],
    },
}

READING_FULL_OVERRIDES: dict[int, dict[str, object]] = {
    31: {
        "stem": "지금은 아침입니다. 여덟 시입니다.",
        "options": ["사람", "나이", "계절", "시간"],
    },
    32: {
        "stem": "오늘은 집에 있습니다. 쉽니다.",
        "options": ["나라", "휴일", "쇼핑", "직업"],
    },
    33: {
        "stem": "저는 바지를 좋아합니다. 치마는 안 입습니다.",
        "options": ["옷", "값", "일", "집"],
    },
    34: {
        "stem": "저는 (    )에 갑니다. 공부를 합니다.",
        "options": ["약국", "학교", "여행사", "편의점"],
    },
    35: {
        "stem": "전화를 합니다. 친구와 (    ).",
        "options": ["씁니다", "줍니다", "읽습니다", "이야기합니다"],
    },
    36: {
        "stem": "집에서 은행이 (    ). 집 앞에 있습니다.",
        "options": ["넓습니다", "가깝습니다", "깨끗합니다", "시원합니다"],
    },
    37: {
        "stem": "저는 보통 버스를 탑니다. (    ) 지하철을 탑니다.",
        "options": ["가끔", "빨리", "아주", "항상"],
    },
    38: {
        "stem": "오늘은 수미의 생일입니다. 저는 수미(    ) 선물을 했습니다.",
        "options": ["도", "를", "에서", "에게"],
    },
    39: {
        "stem": "형이 아직 안 왔습니다. 형을 (    ).",
        "options": ["압니다", "보냅니다", "기다립니다", "가르칩니다"],
    },
    40: {
        "stem": "다음을 읽고 맞지 않는 것을 고르십시오.\n[축구 동아리 모임 / 언제: 매주 금요일 저녁 6시 / 어디서: 학교 운동장]",
        "options": ["금요일에 합니다.", "같이 축구를 합니다.", "모임은 오전에 있습니다.", "학교 운동장에서 만납니다."],
    },
    41: {
        "stem": "다음을 읽고 맞지 않는 것을 고르십시오.\n[행복 김치 라면 / 3분 / 계란이 들어 있어요! / 1,200원]",
        "options": ["삼 분 후에 먹습니다.", "가격은 이천 원입니다.", "이 라면은 김치 맛입니다.", "이 라면에 계란이 있습니다."],
    },
    42: {
        "stem": "다음을 읽고 맞지 않는 것을 고르십시오.\n[김미영: 마이클 씨, 오늘 시간이 있어요? 친구들이 우리 집에 와요. 같이 집에서 영화를 볼 거예요. 마이클 씨도 오세요.]",
        "options": [
            "마이클 씨가 문자 메시지를 받습니다.",
            "마이클 씨는 지금 미영 씨와 있습니다.",
            "미영 씨는 오늘 친구들을 만날 겁니다.",
            "미영 씨는 오늘 집에서 영화를 볼 겁니다.",
        ],
    },
    43: {
        "stem": "우리 집에서는 제가 요리를 합니다. 한국 음식도 잘하고 다른 나라의 음식도 잘 만듭니다. 매일 음식을 해서 가족들과 같이 먹습니다.",
        "options": [
            "가족들은 매일 요리를 합니다.",
            "저는 한국 음식을 잘 만듭니다.",
            "가족들은 한국 음식을 안 먹습니다.",
            "저는 다른 나라 음식을 잘 못 만듭니다.",
        ],
    },
    44: {
        "stem": "오늘도 인주시에 비가 많이 오겠습니다. 오후부터 비가 오고 밤에는 비가 오지 않겠습니다. 내일은 날씨가 맑겠습니다.",
        "options": [
            "내일은 비가 내리지 않을 겁니다.",
            "오늘 밤에 비가 많이 올 겁니다.",
            "오늘 오후에 비가 오지 않을 겁니다.",
            "인주시에 오랜만에 비가 내릴 겁니다.",
        ],
    },
    45: {
        "stem": "제 취미는 가구 만들기입니다. 주말에만 만들어서 하나를 만들 때 시간이 많이 걸립니다. 지금까지 책장 하나와 의자 두 개를 만들었습니다.",
        "options": [
            "저는 가구를 빨리 만듭니다.",
            "저는 주말에 가구를 만듭니다.",
            "저는 책장을 많이 만들었습니다.",
            "저는 의자를 한 개 만들었습니다.",
        ],
    },
    46: {
        "stem": "오늘 자동차 박물관에 갔습니다. 박물관이 작고 자동차도 많지 않았습니다. 재미가 없어서 일찍 나왔습니다.",
        "options": [
            "박물관에 다시 가겠습니다.",
            "박물관이 더 컸으면 좋겠습니다.",
            "박물관이 마음에 들지 않았습니다.",
            "박물관에 자동차가 너무 적었습니다.",
        ],
    },
    47: {
        "stem": "저는 한복을 한번 입어 보고 싶었습니다. 그래서 이번 방학에 한국에 가면 한복을 입어 볼 겁니다. 한복을 입고 사진도 찍을 겁니다.",
        "options": [
            "방학에 한국에 가고 싶습니다.",
            "한복을 자주 입으면 좋겠습니다.",
            "여러 한복 사진을 찍고 싶습니다.",
            "한국에서 한복을 입어 보려고 합니다.",
        ],
    },
    48: {
        "stem": "저는 게임 회사에 다니고 있습니다. 일도 재미있고 회사 사람들도 좋습니다. 저는 이 회사에 오래 다니고 싶습니다.",
        "options": [
            "저는 게임을 하는 것이 좋습니다.",
            "저는 이 회사의 게임을 좋아합니다.",
            "저는 이 회사에서 계속 일하면 좋겠습니다.",
            "저는 회사에서 같이 일하는 사람들이 좋습니다.",
        ],
    },
    49: {
        "stem": "저는 음악 공연 보는 것을 좋아합니다. 하지만 요즘에는 바빠서 공연을 거의 보지 못했습니다. 오늘은 일이 빨리 끝나서 오랜만에 친구와 같이 공연을 (㉠). 공연은 정말 신나고 좋았습니다. 공연을 보고 나올 때 행복했습니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["보러 갔습니다", "봐야 했습니다", "보지 않았습니다", "볼 수 없었습니다"],
    },
    50: {
        "stem": "저는 음악 공연 보는 것을 좋아합니다. 하지만 요즘에는 바빠서 공연을 거의 보지 못했습니다. 오늘은 일이 빨리 끝나서 오랜만에 친구와 같이 공연을 (㉠). 공연은 정말 신나고 좋았습니다. 공연을 보고 나올 때 행복했습니다.\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "저는 요즘 시간이 많습니다.",
            "저는 오늘 일을 쉬었습니다.",
            "저는 친구와 공연을 자주 봅니다.",
            "저는 공연을 봐서 기분이 좋았습니다.",
        ],
    },
    51: {
        "stem": "전에는 문을 열 때 항상 열쇠를 사용했습니다. 그런데 요즘은 꼭 열쇠가 필요한 것은 아닙니다. 자기만 아는 번호를 사용할 수도 있고 카드로 문을 열 수도 있습니다. (㉠) 사람마다 모두 다른 목소리나 얼굴 모양을 이용하는 방법도 있습니다. 요즘은 이렇게 다양한 방법을 씁니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["그리고", "그래서", "그러면", "그렇지만"],
    },
    52: {
        "stem": "전에는 문을 열 때 항상 열쇠를 사용했습니다. 그런데 요즘은 꼭 열쇠가 필요한 것은 아닙니다. 자기만 아는 번호를 사용할 수도 있고 카드로 문을 열 수도 있습니다. (㉠) 사람마다 모두 다른 목소리나 얼굴 모양을 이용하는 방법도 있습니다. 요즘은 이렇게 다양한 방법을 씁니다.\n무엇에 대한 이야기인지 맞는 것을 고르십시오.",
        "options": [
            "열쇠가 사용되는 곳",
            "열쇠로 할 수 있는 일",
            "문을 여는 여러 가지 방법",
            "문을 열 때 카드를 쓰는 이유",
        ],
    },
    53: {
        "stem": "저는 초등학교 때 친하게 지낸 친구가 한 명 있었습니다. 항상 같이 다닌 좋은 친구였습니다. 그런데 초등학교를 (㉠) 그 친구는 부산으로 이사를 갔습니다. 서로 멀리 떨어져서 만나지 못했고 이제는 연락이 안 됩니다. 그 친구를 찾을 수 있으면 좋겠습니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["졸업해도", "졸업하거나", "졸업하고 나서", "졸업하게 되면"],
    },
    54: {
        "stem": "저는 초등학교 때 친하게 지낸 친구가 한 명 있었습니다. 항상 같이 다닌 좋은 친구였습니다. 그런데 초등학교를 (㉠) 그 친구는 부산으로 이사를 갔습니다. 서로 멀리 떨어져서 만나지 못했고 이제는 연락이 안 됩니다. 그 친구를 찾을 수 있으면 좋겠습니다.\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "저는 그 친구와 연락을 할 수 없습니다.",
            "저는 초등학교 때부터 부산에 살았습니다.",
            "저는 초등학교에 다닐 때 이사를 갔습니다.",
            "저는 그 친구를 이제 만나고 싶지 않습니다.",
        ],
    },
    55: {
        "stem": "동문시장은 작고 조용한 시장이었습니다. 이곳에는 70년이 된 작은 국수 가게가 하나 있습니다. 얼마 전 이 국수 가게가 방송에 소개되었습니다. 그 후 동문시장의 분위기는 크게 달라졌습니다. 방송에 나온 후 이 국수 가게에 (㉠) 동문시장도 함께 유명해졌기 때문입니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["일할 자리가 나서", "바뀐 것이 없어서", "없는 물건이 없어서", "오는 사람이 많아져서"],
    },
    56: {
        "stem": "동문시장은 작고 조용한 시장이었습니다. 이곳에는 70년이 된 작은 국수 가게가 하나 있습니다. 얼마 전 이 국수 가게가 방송에 소개되었습니다. 그 후 동문시장의 분위기는 크게 달라졌습니다. 방송에 나온 후 이 국수 가게에 (㉠) 동문시장도 함께 유명해졌기 때문입니다.\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "이 시장은 전과 달라진 것이 없습니다.",
            "이 시장은 요즘에 사람이 거의 없습니다.",
            "이 가게는 생긴 지 칠십 년이 되었습니다.",
            "이 가게는 방송에 소개된 후 문을 닫았습니다.",
        ],
    },
    57: {
        "stem": "다음을 순서대로 맞게 나열한 것을 고르십시오.\n(가) 저는 종이컵을 많이 썼습니다.\n(나) 이제부터 그 컵을 쓰려고 합니다.\n(다) 그래서 가지고 다닐 컵을 샀습니다.\n(라) 그런데 종이컵은 바로 쓰레기가 됩니다.",
        "options": [
            "(가)-(다)-(나)-(라)",
            "(가)-(라)-(다)-(나)",
            "(나)-(다)-(라)-(가)",
            "(나)-(라)-(가)-(다)",
        ],
    },
    58: {
        "stem": "다음을 순서대로 맞게 나열한 것을 고르십시오.\n(가) 회사원들의 이런 생활은 목에 좋지 않습니다.\n(나) 그래서 잠깐씩 일어나서 목 운동을 해야 합니다.\n(다) 또 목 주위를 따뜻하게 해 주는 것도 도움이 됩니다.\n(라) 회사원들은 오랜 시간 앉아서 컴퓨터를 보고 일합니다.",
        "options": [
            "(가)-(나)-(라)-(다)",
            "(가)-(다)-(나)-(라)",
            "(라)-(가)-(나)-(다)",
            "(라)-(다)-(나)-(가)",
        ],
    },
    59: {
        "stem": "저는 피아노 학원에 다닌 지 3년이 되었습니다. (㉠) 그렇지만 지금은 여러 노래들을 잘 칠 수 있게 되었습니다. (㉡) 피아노를 치면서 좋아하는 가수의 노래를 부르면 정말 즐거워집니다. (㉢) 피아노를 배우는 것이 정말 좋습니다. (㉣)\n다음 문장이 들어갈 곳을 고르십시오.\n[처음에는 피아노를 전혀 치지 못했습니다.]",
        "options": ["㉠", "㉡", "㉢", "㉣"],
    },
    60: {
        "stem": "저는 피아노 학원에 다닌 지 3년이 되었습니다. (㉠) 그렇지만 지금은 여러 노래들을 잘 칠 수 있게 되었습니다. (㉡) 피아노를 치면서 좋아하는 가수의 노래를 부르면 정말 즐거워집니다. (㉢) 피아노를 배우는 것이 정말 좋습니다. (㉣)\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "저는 피아노를 배우러 다닙니다.",
            "저는 피아노 학원을 그만두고 싶습니다.",
            "저는 가수가 되기 위해서 피아노를 배웁니다.",
            "저는 삼 년 전부터 학원에서 일하고 있습니다.",
        ],
    },
    61: {
        "stem": "저는 조금 전에 텔레비전을 보고 깜짝 놀랐습니다. 텔레비전에 제 동생이 크게 나왔기 때문입니다. 동생은 테니스 경기장에서 경기를 보고 있었는데 박수를 치면서 웃고 있었습니다. 동생의 모습을 텔레비전에서 본 것은 처음이었습니다. 매일 보는 동생이지만 동생의 얼굴을 텔레비전에서 보니까 (㉠) 새로운 기분이 들었습니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["편하고", "반갑고", "복잡하고", "비슷하고"],
    },
    62: {
        "stem": "저는 조금 전에 텔레비전을 보고 깜짝 놀랐습니다. 텔레비전에 제 동생이 크게 나왔기 때문입니다. 동생은 테니스 경기장에서 경기를 보고 있었는데 박수를 치면서 웃고 있었습니다. 동생의 모습을 텔레비전에서 본 것은 처음이었습니다. 매일 보는 동생이지만 동생의 얼굴을 텔레비전에서 보니까 (㉠) 새로운 기분이 들었습니다.\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "동생은 테니스를 보러 경기장에 갔습니다.",
            "저는 박수를 치면서 동생의 모습을 보았습니다.",
            "전에도 텔레비전에서 동생의 얼굴을 보았습니다.",
            "저는 오늘 테니스 경기장에서 동생을 만났습니다.",
        ],
    },
    63: {
        "stem": "[한국아파트 게시판 — 지하 주차장 청소 안내]\n우리 아파트 지하 주차장 물청소를 다음 주 월요일과 화요일에 할 예정입니다. 청소를 하는 날에는 주차를 할 수 없습니다. 아파트의 다른 주차장을 이용하시기 바랍니다.\n청소 일정: 301동, 302동: 7월 29일(월) / 303동, 304동: 7월 30일(화)\n청소 시간: 09:00~18:00\n2019년 7월 22일(월) 한국아파트 관리실\n왜 이 글을 썼는지 맞는 것을 고르십시오.",
        "options": [
            "청소 장소를 바꾸려고",
            "청소 계획을 물어보려고",
            "청소 이유를 설명하려고",
            "청소 날짜와 시간을 알리려고",
        ],
    },
    64: {
        "stem": "[한국아파트 게시판 — 지하 주차장 청소 안내]\n우리 아파트 지하 주차장 물청소를 다음 주 월요일과 화요일에 할 예정입니다. 청소를 하는 날에는 주차를 할 수 없습니다. 아파트의 다른 주차장을 이용하시기 바랍니다.\n청소 일정: 301동, 302동: 7월 29일(월) / 303동, 304동: 7월 30일(화)\n청소 시간: 09:00~18:00\n2019년 7월 22일(월) 한국아파트 관리실\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "이틀 동안 주차장 청소를 할 겁니다.",
            "주차장 청소는 화요일에 시작할 겁니다.",
            "지하 주차장 물청소는 아홉 시까지 합니다.",
            "7월 22일까지 다른 주차장을 이용해야 합니다.",
        ],
    },
    65: {
        "stem": "얼음 음료는 여름철 인기 메뉴입니다. 그런데 얼음이 녹아서 물이 되면 음료의 맛이 없어집니다. 그래서 얼음 음료를 만들 때는 천천히 녹는 얼음을 넣으면 좋습니다. 큰 얼음은 작은 얼음보다 천천히 녹고, 오래 얼린 얼음도 잠깐 얼린 얼음보다 천천히 녹습니다. 이런 얼음을 넣으면 (㉠) 처음 음료의 맛을 오래 즐길 수 있습니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["마시지만", "마시려고", "마시기 때문에", "마시는 동안에"],
    },
    66: {
        "stem": "얼음 음료는 여름철 인기 메뉴입니다. 그런데 얼음이 녹아서 물이 되면 음료의 맛이 없어집니다. 그래서 얼음 음료를 만들 때는 천천히 녹는 얼음을 넣으면 좋습니다. 큰 얼음은 작은 얼음보다 천천히 녹고, 오래 얼린 얼음도 잠깐 얼린 얼음보다 천천히 녹습니다. 이런 얼음을 넣으면 (㉠) 처음 음료의 맛을 오래 즐길 수 있습니다.\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "오래 얼린 얼음이 더 빨리 녹습니다.",
            "작은 얼음은 큰 얼음보다 빨리 녹습니다.",
            "큰 얼음을 음료에 넣으면 맛이 금방 달라집니다.",
            "음료 맛은 작은 얼음을 넣을 때 천천히 변합니다.",
        ],
    },
    67: {
        "stem": "태풍은 보통 7월부터 9월까지 많이 생깁니다. 이런 태풍들도 이름이 있는데 그 중에는 한국어로 된 이름도 있습니다. 태풍의 이름은 태풍이 지나가는 곳에 있는 열네 개 나라에서 만들고 있습니다. 한국도 2000년부터 태풍의 이름을 (㉠). 한국어로 이름을 만들 때는 다른 나라 사람들도 발음하기 쉬운 단어를 고릅니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["부르려고 합니다", "원하고 있습니다", "바꾸기로 했습니다", "만들기 시작했습니다"],
    },
    68: {
        "stem": "태풍은 보통 7월부터 9월까지 많이 생깁니다. 이런 태풍들도 이름이 있는데 그 중에는 한국어로 된 이름도 있습니다. 태풍의 이름은 태풍이 지나가는 곳에 있는 열네 개 나라에서 만들고 있습니다. 한국도 2000년부터 태풍의 이름을 (㉠). 한국어로 이름을 만들 때는 다른 나라 사람들도 발음하기 쉬운 단어를 고릅니다.\n이 글의 내용과 같은 것을 고르십시오.",
        "options": [
            "태풍은 보통 겨울과 봄에 생깁니다.",
            "한국에는 태풍이 거의 불지 않습니다.",
            "태풍의 이름은 열네 개 나라에서 만듭니다.",
            "태풍의 한국어 이름은 발음이 쉽지 않습니다.",
        ],
    },
    69: {
        "stem": "몇 달 전, 우리 집 앞에서 떨고 있는 작고 마른 강아지를 보았습니다. 저는 그 강아지가 너무 불쌍해 보였습니다. 저는 강아지를 집으로 데려와 먹을 것을 주고 잠도 재워 주었습니다. 그때부터 주인을 찾고 있는데 아직도 주인이 나타나지 않습니다. 그 강아지는 이제 (㉠) 저의 좋은 친구가 되었습니다. 강아지와 헤어지기 싫습니다.\n㉠에 들어갈 알맞은 말을 고르십시오.",
        "options": ["잠이 많아져서", "주인을 찾아서", "크고 건강해져서", "계속 떨고 있어서"],
    },
    70: {
        "stem": "몇 달 전, 우리 집 앞에서 떨고 있는 작고 마른 강아지를 보았습니다. 저는 그 강아지가 너무 불쌍해 보였습니다. 저는 강아지를 집으로 데려와 먹을 것을 주고 잠도 재워 주었습니다. 그때부터 주인을 찾고 있는데 아직도 주인이 나타나지 않습니다. 그 강아지는 이제 (㉠) 저의 좋은 친구가 되었습니다. 강아지와 헤어지기 싫습니다.\n이 글의 내용으로 알 수 있는 것을 고르십시오.",
        "options": [
            "저는 강아지의 주인을 만났습니다.",
            "저는 이 강아지를 잃어버렸습니다.",
            "저는 이 강아지를 키우는 것이 싫습니다.",
            "저는 길에서 데려온 강아지를 키우고 있습니다.",
        ],
    },
}

LISTENING_IMAGE_CROPS = {
    15: {"page": 5, "boxes": [(120, 302, 453, 563), (455, 302, 787, 563), (120, 505, 453, 767), (455, 505, 787, 767)]},
    16: {"page": 5, "boxes": [(120, 630, 453, 840), (455, 630, 787, 840), (120, 840, 453, 1050), (455, 840, 787, 1050)]},
}

READING_IMAGE_CROPS = {
    40: {"page": 3, "box": (175, 610, 645, 760), "name": "q40.png"},
    41: {"page": 4, "box": (170, 105, 535, 455), "name": "q41.png"},
    42: {"page": 4, "box": (170, 690, 455, 920), "name": "q42.png"},
    63: {"page": 14, "box": (120, 110, 780, 570), "name": "q63_64.png"},
}


def clean_listening_page(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if "한국어능력시험" in line or "Test of Proficiency" in line:
            continue
        if "듣기 통합" in line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    text = "\n".join(lines)
    text = re.sub(r"(?m)^(\d{1,2})\s+(?=(?:\(|[가-힣<]))", r"\1. ", text)
    return normalize_text(text)


def clean_reading_page(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if "한국어능력시험" in line or "Test of Proficiency" in line:
            continue
        if "TOPIK" in line and "읽기" in line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    text = "\n".join(lines)
    text = re.sub(r"(?m)^(\d{2})\s+(?=(?:\(|[가-힣<]))", r"\1. ", text)
    return normalize_text(text)


def build_questions() -> list[dict[str, object]]:
    listening_pages = get_page_texts(
        LISTENING_PDF,
        range(1, pdf_page_count(LISTENING_PDF) + 1),
        OCR_CACHE_ROOT / "listening",
        clean_listening_page,
    )
    listening_blocks = build_page_mapped_blocks(listening_pages, LISTENING_PAGE_MAP, LISTENING_QUESTION_PATTERN)

    questions: list[dict[str, object]] = []
    for q_num in range(1, 31):
        override = LISTENING_FULL_OVERRIDES.get(q_num)
        if override is not None:
            question_text = str(override["stem"])
            options = list(override["options"])  # type: ignore[arg-type]
        else:
            question_text, options = split_block(listening_blocks[q_num])
        if not options:
            raise ValueError(f"Missing listening options for question {q_num}")
        answer_index = LISTENING_ANSWERS[q_num][0] - 1
        questions.append(
            {
                "section": "listening",
                "question_number": q_num,
                "question_text": question_text,
                "question_image_url": None,
                "audio_url": AUDIO_URL,
                "option_image_urls": LISTENING_OPTION_IMAGE_URLS.get(q_num),
                "options": options,
                "question_score": LISTENING_ANSWERS[q_num][1],
                "correct_answer_text": options[answer_index],
            }
        )

    for q_num in range(31, 71):
        override = READING_FULL_OVERRIDES.get(q_num)
        if override is None:
            raise ValueError(f"Missing reading override for question {q_num}")
        question_text = str(override["stem"])
        options = list(override["options"])  # type: ignore[arg-type]
        if not options:
            raise ValueError(f"Missing reading options for question {q_num}")
        answer_index = READING_ANSWERS[q_num][0] - 1
        questions.append(
            {
                "section": "reading",
                "question_number": q_num,
                "question_text": question_text,
                "question_image_url": READING_IMAGE_URLS.get(q_num),
                "audio_url": None,
                "option_image_urls": None,
                "options": options,
                "question_score": READING_ANSWERS[q_num][1],
                "correct_answer_text": options[answer_index],
            }
        )
    return questions


def build_assets() -> None:
    if not LISTENING_AUDIO.exists():
        raise FileNotFoundError(f"Missing audio file: {LISTENING_AUDIO}")
    copy_asset(LISTENING_AUDIO, UPLOAD_ROOT, Path("audio") / AUDIO_FILENAME)

    for question_number, meta in LISTENING_IMAGE_CROPS.items():
        for index, box in enumerate(meta["boxes"], start=1):
            output_path = ASSETS_ROOT / "debug_pages" / f"q{question_number}_option_{index}.png"
            crop_rendered_region(LISTENING_PDF, int(meta["page"]), box, output_path, scale=1.5)
            copy_asset(output_path, UPLOAD_ROOT, Path("listening") / f"q{question_number}_option_{index}.png")

    for question_number, meta in READING_IMAGE_CROPS.items():
        output_path = ASSETS_ROOT / "debug_pages" / str(meta["name"])
        crop_rendered_region(READING_PDF, int(meta["page"]), meta["box"], output_path, scale=1.5)
        copy_asset(output_path, UPLOAD_ROOT, Path("reading") / str(meta["name"]))


def build_sql(questions: list[dict[str, object]]) -> str:
    lines = [
        "-- Generated by scripts/generate_topik_i_64_sql.py",
        "BEGIN;",
        "",
        "INSERT INTO mock_test_bank (",
        "  title, exam_type, test_number, description, total_questions, duration, listening_questions, reading_questions",
        ")",
        "SELECT",
        "  'TOPIK I 64-р шалгалт',",
        "  'TOPIK_I',",
        "  64,",
        "  '64-р албан ёсны TOPIK I шалгалт',",
        "  70,",
        "  100,",
        "  30,",
        "  40",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM mock_test_bank WHERE exam_type = 'TOPIK_I' AND test_number = 64",
        ");",
        "",
        f"UPDATE mock_test_bank SET title = 'TOPIK I 64-р шалгалт', description = '64-р албан ёсны TOPIK I шалгалт', total_questions = 70, duration = 100, listening_questions = 30, reading_questions = 40, updated_at = NOW() WHERE id = {MOCK_TEST_ID_SQL};",
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
            "  (" + ", ".join(
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
            ) + ")"
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
