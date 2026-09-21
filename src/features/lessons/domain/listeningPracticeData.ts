export type ListeningCategory =
  | 'response'
  | 'numbers'
  | 'place'
  | 'purpose'
  | 'main-idea'
  | 'announcement';

export type ListeningPracticeItem = {
  id: string;
  category: ListeningCategory;
  speechText: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const listeningCategories: Array<{
  id: ListeningCategory;
  title: string;
  description: string;
  icon: string;
}> = [
  { id: 'response', title: 'Зөв хариулт', description: 'Асуултад тохирох хариулт', icon: 'chatbubbles-outline' },
  { id: 'numbers', title: 'Тоо & цаг', description: 'Тоо, үнэ, огноо, цаг', icon: 'time-outline' },
  { id: 'place', title: 'Газар & нөхцөл', description: 'Яриа хаана болж байгааг олох', icon: 'location-outline' },
  { id: 'purpose', title: 'Яригчийн зорилго', description: 'Яагаад ярьж байгааг таних', icon: 'help-circle-outline' },
  { id: 'main-idea', title: 'Гол санаа', description: 'Богино ярианы утгыг ойлгох', icon: 'bulb-outline' },
  { id: 'announcement', title: 'Зарлал', description: 'Мэдээллээс чухал зүйлийг олох', icon: 'megaphone-outline' },
];

export const listeningPracticeItems: ListeningPracticeItem[] = [
  {
    id: 'response-1', category: 'response', speechText: '지금 몇 시예요?',
    question: 'Сонссон асуултад тохирох хариултыг сонгоно уу.',
    options: ['세 시예요.', '학교에 가요.', '책을 읽어요.', '날씨가 좋아요.'], correctIndex: 0,
    explanation: '“지금 몇 시예요?” нь “Одоо хэдэн цаг вэ?” гэсэн асуулт.',
  },
  {
    id: 'response-2', category: 'response', speechText: '어디에 가요?',
    question: 'Тохирох хариултыг сонгоно уу.',
    options: ['친구하고 가요.', '도서관에 가요.', '아홉 시에 가요.', '버스로 가요.'], correctIndex: 1,
    explanation: '“어디” нь газар асууж байгаа тул “Номын сан руу явна” гэж хариулна.',
  },
  {
    id: 'response-3', category: 'response', speechText: '주말에 뭐 했어요?',
    question: 'Тохирох хариултыг сонгоно уу.',
    options: ['주말이에요.', '영화를 봤어요.', '토요일에 만나요.', '집이 멀어요.'], correctIndex: 1,
    explanation: 'Өнгөрсөн амралтын өдөр юу хийснийг асуусан.',
  },
  {
    id: 'response-4', category: 'response', speechText: '이 음식이 매워요?',
    question: 'Тохирох хариултыг сонгоно уу.',
    options: ['네, 조금 매워요.', '네, 음식이에요.', '아니요, 식당이에요.', '물을 마셨어요.'], correctIndex: 0,
    explanation: 'Хоол халуун ногоотой эсэхийг асууж байна.',
  },
  {
    id: 'response-5', category: 'response', speechText: '같이 점심을 먹을까요?',
    question: 'Тохирох хариултыг сонгоно уу.',
    options: ['점심은 열두 시예요.', '네, 좋아요.', '식당이 커요.', '김밥을 먹었어요.'], correctIndex: 1,
    explanation: '“Хамт өдрийн хоол идэх үү?” гэсэн саналд зөвшөөрч байна.',
  },

  {
    id: 'numbers-1', category: 'numbers', speechText: '회의는 오후 두 시 반에 시작합니다.',
    question: 'Хурал хэдэн цагт эхлэх вэ?',
    options: ['1:30', '2:00', '2:30', '3:30'], correctIndex: 2,
    explanation: '“오후 두 시 반” нь өдрийн 2 цаг 30 минут.',
  },
  {
    id: 'numbers-2', category: 'numbers', speechText: '사과 세 개하고 우유 한 개 주세요.',
    question: 'Хэдэн алим авах вэ?',
    options: ['1', '2', '3', '4'], correctIndex: 2,
    explanation: '“사과 세 개” нь гурван алим.',
  },
  {
    id: 'numbers-3', category: 'numbers', speechText: '이 가방은 삼만 오천 원입니다.',
    question: 'Цүнх ямар үнэтэй вэ?',
    options: ['15,000 вон', '30,000 вон', '35,000 вон', '50,000 вон'], correctIndex: 2,
    explanation: '“삼만 오천 원” нь 35,000 вон.',
  },
  {
    id: 'numbers-4', category: 'numbers', speechText: '제 생일은 구월 십오 일입니다.',
    question: 'Төрсөн өдөр нь хэзээ вэ?',
    options: ['5-р сарын 9', '9-р сарын 5', '9-р сарын 15', '10-р сарын 15'], correctIndex: 2,
    explanation: '“구월 십오 일” нь 9-р сарын 15.',
  },
  {
    id: 'numbers-5', category: 'numbers', speechText: '서울까지 두 시간 십 분 걸립니다.',
    question: 'Сөүл хүртэл хэр удах вэ?',
    options: ['1 цаг 20 минут', '2 цаг 10 минут', '2 цаг 20 минут', '3 цаг 10 минут'], correctIndex: 1,
    explanation: '“두 시간 십 분” нь 2 цаг 10 минут.',
  },

  {
    id: 'place-1', category: 'place', speechText: '어서 오세요. 무엇을 드릴까요? 커피 한 잔 주세요.',
    question: 'Энэ яриа хаана болж байна вэ?',
    options: ['Кофе шоп', 'Эмнэлэг', 'Сургууль', 'Банк'], correctIndex: 0,
    explanation: 'Кофе захиалж байгаа учраас кофе шопт байна.',
  },
  {
    id: 'place-2', category: 'place', speechText: '어디가 아프세요? 어제부터 머리가 아파요.',
    question: 'Энэ яриа хаана болж байна вэ?',
    options: ['Номын сан', 'Зах', 'Эмнэлэг', 'Онгоцны буудал'], correctIndex: 2,
    explanation: 'Өвдсөн газрыг асууж байгаа тул эмнэлэгт байна.',
  },
  {
    id: 'place-3', category: 'place', speechText: '이 책을 다음 주까지 빌릴 수 있어요? 네, 가능합니다.',
    question: 'Энэ яриа хаана болж байна вэ?',
    options: ['Номын сан', 'Ресторан', 'Эмийн сан', 'Шуудан'], correctIndex: 0,
    explanation: 'Ном зээлэх тухай ярьж байгаа тул номын сан.',
  },
  {
    id: 'place-4', category: 'place', speechText: '부산 가는 표 한 장 주세요. 오전 열 시 표로 주세요.',
    question: 'Энэ яриа хаана болж байна вэ?',
    options: ['Хувцасны дэлгүүр', 'Тасалбарын касс', 'Зочид буудал', 'Үсчин'], correctIndex: 1,
    explanation: 'Пусан явах тасалбар авч байна.',
  },
  {
    id: 'place-5', category: 'place', speechText: '이 소포를 몽골로 보내고 싶어요. 안에 무엇이 들어 있어요?',
    question: 'Энэ яриа хаана болж байна вэ?',
    options: ['Банк', 'Шуудан', 'Цагдаагийн газар', 'Сургууль'], correctIndex: 1,
    explanation: 'Монгол руу илгээмж явуулах тухай ярьж байна.',
  },

  {
    id: 'purpose-1', category: 'purpose', speechText: '내일 약속 시간을 세 시에서 네 시로 바꾸고 싶어서 전화했어요.',
    question: 'Яригч яагаад утасдсан бэ?',
    options: ['Уулзалтыг цуцлах', 'Цагийг өөрчлөх', 'Газар асуух', 'Хүн урих'], correctIndex: 1,
    explanation: 'Уулзалтын цагийг 3-аас 4 цаг болгохыг хүссэн.',
  },
  {
    id: 'purpose-2', category: 'purpose', speechText: '지갑을 잃어버렸는데 혹시 여기 들어온 게 있나요?',
    question: 'Яригчийн зорилго юу вэ?',
    options: ['Түрийвч худалдаж авах', 'Алдсан түрийвчээ асуух', 'Мөнгө солих', 'Үнэ асуух'], correctIndex: 1,
    explanation: 'Алдсан түрийвч нь олдсон эсэхийг асууж байна.',
  },
  {
    id: 'purpose-3', category: 'purpose', speechText: '감기에 걸려서 오늘 수업에 못 갈 것 같아요.',
    question: 'Яригч юу мэдэгдэж байна вэ?',
    options: ['Хичээлд хоцорно', 'Хичээлдээ очиж чадахгүй', 'Эмнэлгээс гарсан', 'Шалгалт өгнө'], correctIndex: 1,
    explanation: 'Ханиад хүрсэн учраас өнөөдөр хичээлд очихгүй.',
  },
  {
    id: 'purpose-4', category: 'purpose', speechText: '컴퓨터가 갑자기 꺼져서 일을 할 수 없어요. 좀 봐주세요.',
    question: 'Яригч юу хүсэж байна вэ?',
    options: ['Компьютер авах', 'Компьютер засуулах', 'Ажил солих', 'Цахилгаан унтраах'], correctIndex: 1,
    explanation: 'Унтарсан компьютерийг шалгаж өгөхийг хүсэж байна.',
  },
  {
    id: 'purpose-5', category: 'purpose', speechText: '이번 주 토요일에 집들이를 하는데 꼭 오세요.',
    question: 'Яригчийн зорилго юу вэ?',
    options: ['Гэрээ зарах', 'Хүн урих', 'Бэлэг авах', 'Нүүх өдөр асуух'], correctIndex: 1,
    explanation: 'Бямба гарагийн гэрийн найранд урьж байна.',
  },

  {
    id: 'main-1', category: 'main-idea', speechText: '저는 아침마다 공원에서 삼십 분 동안 운동합니다. 운동을 하면 하루를 기분 좋게 시작할 수 있습니다.',
    question: 'Ярианы гол санаа юу вэ?',
    options: ['Өглөө дасгал хийдэг', 'Цэцэрлэг хол байдаг', 'Орой эрт унтдаг', 'Өдөржин ажилладаг'], correctIndex: 0,
    explanation: 'Яригч өглөө бүр 30 минут дасгал хийдэг тухай ярьсан.',
  },
  {
    id: 'main-2', category: 'main-idea', speechText: '요즘 한국 요리를 배우고 있습니다. 지난주에는 불고기를 만들었고 이번 주에는 김치찌개를 배울 겁니다.',
    question: 'Яригч юуны тухай ярьж байна вэ?',
    options: ['Солонгос аялал', 'Солонгос хоол сурах', 'Ресторан нээх', 'Дэлгүүр хэсэх'], correctIndex: 1,
    explanation: 'Солонгос хоол хийж сурч байгаа тухай ярьсан.',
  },
  {
    id: 'main-3', category: 'main-idea', speechText: '회사까지 버스로 한 시간이 걸립니다. 그래서 다음 달에 회사 근처로 이사하려고 합니다.',
    question: 'Яригч яагаад нүүх гэж байна вэ?',
    options: ['Байр жижиг', 'Автобус үнэтэй', 'Ажил хол', 'Хот таалагдахгүй'], correctIndex: 2,
    explanation: 'Ажил хүртэл автобусаар нэг цаг явдаг учраас ойрхон нүүнэ.',
  },
  {
    id: 'main-4', category: 'main-idea', speechText: '비가 많이 오지만 오늘 축구 경기는 예정대로 열립니다. 우산과 비옷을 준비하세요.',
    question: 'Ямар мэдээлэл өгсөн бэ?',
    options: ['Тоглолт цуцлагдсан', 'Тоглолт хойшилсон', 'Тоглолт төлөвлөснөөр болно', 'Тасалбар дууссан'], correctIndex: 2,
    explanation: 'Бороо орсон ч тоглолт төлөвлөсөн цагаараа болно.',
  },
  {
    id: 'main-5', category: 'main-idea', speechText: '이 식당은 음식이 맛있고 가격도 싸지만 손님이 많아서 오래 기다려야 합니다.',
    question: 'Рестораны тухай юу хэлсэн бэ?',
    options: ['Үнэтэй, хүнгүй', 'Амтгүй боловч хурдан', 'Амттай, хямд боловч хүлээнэ', 'Зөвхөн хүргэлттэй'], correctIndex: 2,
    explanation: 'Хоол амттай, үнэ хямд ч олон хүнтэй учраас удаан хүлээнэ.',
  },

  {
    id: 'announcement-1', category: 'announcement', speechText: '오늘 도서관은 내부 공사 때문에 오후 여섯 시에 문을 닫습니다. 이용에 참고하시기 바랍니다.',
    question: 'Номын сан өнөөдөр хэдэн цагт хаах вэ?',
    options: ['4 цаг', '5 цаг', '6 цаг', '7 цаг'], correctIndex: 2,
    explanation: 'Дотоод засварын улмаас оройн 6 цагт хаана.',
  },
  {
    id: 'announcement-2', category: 'announcement', speechText: '서울행 열차가 십 분 늦게 도착할 예정입니다. 승객 여러분의 양해를 바랍니다.',
    question: 'Галт тэрэг хэр хугацаагаар хоцрох вэ?',
    options: ['5 минут', '10 минут', '15 минут', '20 минут'], correctIndex: 1,
    explanation: 'Сөүл явах галт тэрэг 10 минут хоцорно.',
  },
  {
    id: 'announcement-3', category: 'announcement', speechText: '이번 주 일요일 오전 아홉 시부터 아파트 전체가 단수됩니다. 오후 한 시부터 다시 물이 나옵니다.',
    question: 'Ус хэзээнээс дахин ирэх вэ?',
    options: ['09:00', '11:00', '13:00', '15:00'], correctIndex: 2,
    explanation: 'Өдрийн 1 цагаас ус дахин ирнэ.',
  },
  {
    id: 'announcement-4', category: 'announcement', speechText: '박물관 안에서는 사진을 찍을 수 없습니다. 음식과 음료도 가지고 들어갈 수 없습니다.',
    question: 'Музейд юу хийж болохгүй вэ?',
    options: ['Тайлбар сонсох', 'Зураг авах', 'Алхах', 'Үзмэр үзэх'], correctIndex: 1,
    explanation: 'Музей дотор зураг авахыг хориглосон.',
  },
  {
    id: 'announcement-5', category: 'announcement', speechText: '내일 예정된 등산 모임은 비가 와서 다음 주 토요일로 연기되었습니다.',
    question: 'Ууланд алхах уулзалт яасан бэ?',
    options: ['Цуцлагдсан', 'Өнөөдөр болсон', 'Дараагийн бямба хүртэл хойшилсон', 'Газар нь өөрчлөгдсөн'], correctIndex: 2,
    explanation: 'Борооноос болж дараагийн долоо хоногийн бямба хүртэл хойшилсон.',
  },
];
