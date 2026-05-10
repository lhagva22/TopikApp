import type { ImageSourcePropType } from 'react-native';

export type LessonCategoryRoute =
  | 'LessonAlphabetNumbers'
  | 'LessonGrammar'
  | 'LessonVocabulary'
  | 'LessonBooks';

export type LessonCategorySlug = 'alphabet-numbers' | 'grammar' | 'vocabulary' | 'books';

export type LessonCategory = {
  id: string;
  slug: LessonCategorySlug;
  title: string;
  description: string;
  image: ImageSourcePropType;
  level: string;
  route: LessonCategoryRoute;
  subtitle: string;
  points: string[];
};

export const lessonCategories: LessonCategory[] = [
  {
    id: 'alphabet-numbers',
    slug: 'alphabet-numbers',
    title: 'Үсэг & Тоо',
    description: 'Хангыл, Солонгос тоо, Ханз тоо',
    image: require('../../shared/assets/images/letter-removebg-preview.png'),
    level: 'Анхан шат',
    route: 'LessonAlphabetNumbers',
    subtitle: 'Хангыл үсэг, Солонгос тоо, Ханз тооны суурь ойлголтуудыг энэ хэсгээс үзнэ.',
    points: [
      'Эгшиг, гийгүүлэгч үсгүүдийг таних',
      'Үе үсэг холбож унших',
      'Уугуул Солонгос тоо ба Ханз тоог ялгах',
      'Өдөр тутмын энгийн тоолол, цаг, насны хэрэглээ',
    ],
  },
  {
    id: 'grammar',
    slug: 'grammar',
    title: 'Дүрэм',
    description: 'Дүрмийн сан ба үйл үгийн хувилбарууд',
    image: require('../../shared/assets/images/law-removebg-preview.png'),
    level: 'Бүх шат',
    route: 'LessonGrammar',
    subtitle: 'Өгүүлбэрийн бүтэц, дүрмийн сан, үйл үгийн хувилбаруудыг шат дараатайгаар сурна.',
    points: [
      'Үндсэн нөхцөл, холбоос, төгсгөлийн хэлбэрүүд',
      'Үйл үгийн цаг ба хэв',
      'TOPIK дээр түгээмэл ордог дүрмийн загварууд',
      'Жишээ өгүүлбэртэй тайлбарууд',
    ],
  },
  {
    id: 'vocabulary',
    slug: 'vocabulary',
    title: 'Өргөн хэрэглээний үгс',
    description: '6000 гаруй үгсийн сан',
    image: require('../../shared/assets/images/dictionary.png'),
    level: 'Бүх шат',
    route: 'LessonVocabulary',
    subtitle: 'Өдөр тутмын болон шалгалтад түгээмэл ашиглагддаг үгсийн сангаа нэмэгдүүлнэ.',
    points: [
      'Сэдэвчилсэн үгсийн сан',
      'Эсрэг, ойролцоо утгатай үгс',
      'TOPIK сонсгол ба уншлагад ордог түгээмэл үгс',
      'Үгсийг өгүүлбэр дунд хэрэглэх жишээнүүд',
    ],
  },
  {
    id: 'books',
    slug: 'books',
    title: 'Ном сурах бичиг',
    description: 'Бүх шатны сурах бичиг',
    image: require('../../shared/assets/images/book.png'),
    level: 'Бүх шат',
    route: 'LessonBooks',
    subtitle: 'Шат шатны сурах бичиг, бие дааж давтах материалуудыг энэ хэсгээс үзнэ.',
    points: [
      'Анхан, дунд шатны сурах бичгийн жагсаалт',
      'Дасгал ажлын материалууд',
      'Өөрөө давтахаад тохиромжтой эх сурвалжууд',
      'TOPIK бэлтгэлийн нэмэлт материал',
    ],
  },
];

export const lessonCategorySlugMap: Record<LessonCategorySlug, LessonCategory> = lessonCategories.reduce(
  (acc, item) => {
    acc[item.slug] = item;
    return acc;
  },
  {} as Record<LessonCategorySlug, LessonCategory>,
);

export const lessonCategoryMap: Record<LessonCategoryRoute, LessonCategory> = lessonCategories.reduce(
  (acc, item) => {
    acc[item.route] = item;
    return acc;
  },
  {} as Record<LessonCategoryRoute, LessonCategory>,
);
