import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AppText from '../../../shared/components/atoms/AppText';
import { Card, CardTitle } from '../../../shared/components/molecules/card';

type VowelItem = {
  symbol: string;
  label: string;
};

type NumberItem = {
  label: string;
  korean: string;
  pronunciation?: string;
};

const basicVowels: VowelItem[] = [
  { symbol: 'ㅏ', label: 'а' },
  { symbol: 'ㅑ', label: 'я' },
  { symbol: 'ㅓ', label: 'о' },
  { symbol: 'ㅕ', label: 'ё' },
  { symbol: 'ㅗ', label: 'у' },
  { symbol: 'ㅛ', label: 'юу' },
  { symbol: 'ㅜ', label: 'ү' },
  { symbol: 'ㅠ', label: 'юү' },
  { symbol: 'ㅡ', label: 'ы' },
  { symbol: 'ㅣ', label: 'и' },
];

const compoundVowels: VowelItem[] = [
  { symbol: 'ㅐ', label: 'э' },
  { symbol: 'ㅔ', label: 'е' },
  { symbol: 'ㅒ', label: 'э' },
  { symbol: 'ㅖ', label: 'е' },
  { symbol: 'ㅘ', label: 'ва' },
  { symbol: 'ㅙ', label: 'вэ' },
  { symbol: 'ㅚ', label: 'ө' },
  { symbol: 'ㅝ', label: 'во' },
  { symbol: 'ㅞ', label: 'вэ' },
  { symbol: 'ㅟ', label: 'үи' },
  { symbol: 'ㅢ', label: 'ыи' },
];

const basicConsonants: VowelItem[] = [
  { symbol: 'ㄱ', label: 'к/г' },
  { symbol: 'ㄴ', label: 'н' },
  { symbol: 'ㄷ', label: 'т/д' },
  { symbol: 'ㄹ', label: 'р/л' },
  { symbol: 'ㅁ', label: 'м' },
  { symbol: 'ㅂ', label: 'п/б' },
  { symbol: 'ㅅ', label: 'с' },
  { symbol: 'ㅇ', label: 'н/гүй' },
  { symbol: 'ㅈ', label: 'ж' },
  { symbol: 'ㅊ', label: 'ч' },
  { symbol: 'ㅋ', label: 'кх' },
  { symbol: 'ㅌ', label: 'тх' },
  { symbol: 'ㅍ', label: 'пх' },
  { symbol: 'ㅎ', label: 'х' },
];

const doubleConsonants: VowelItem[] = [
  { symbol: 'ㄲ', label: 'кк' },
  { symbol: 'ㄸ', label: 'тт' },
  { symbol: 'ㅃ', label: 'пп' },
  { symbol: 'ㅆ', label: 'сс' },
  { symbol: 'ㅉ', label: 'жж' },
];

const koreanNumbers: NumberItem[] = [
  { label: '1', korean: '하나', pronunciation: '[хана]' },
  { label: '2', korean: '둘', pronunciation: '[тул]' },
  { label: '3', korean: '셋', pronunciation: '[сэд]' },
  { label: '4', korean: '넷', pronunciation: '[нэд]' },
  { label: '5', korean: '다섯', pronunciation: '[тасод]' },
  { label: '6', korean: '여섯', pronunciation: '[ёсод]' },
  { label: '7', korean: '일곱', pronunciation: '[илгуб]' },
  { label: '8', korean: '여덟', pronunciation: '[ёдол]' },
  { label: '9', korean: '아홉', pronunciation: '[ахуб]' },
  { label: '10', korean: '열', pronunciation: '[ёл]' },
  { label: '11', korean: '열하나', pronunciation: '[ёл-хана]' },
  { label: '12', korean: '열둘', pronunciation: '[ёл-тул]' },
  { label: '13', korean: '열셋', pronunciation: '[ёл-сэд]' },
  { label: '14', korean: '열넷', pronunciation: '[ёл-нэд]' },
  { label: '15', korean: '열다섯', pronunciation: '[ёл-тасод]' },
  { label: '16', korean: '열여섯', pronunciation: '[ёл-ёсод]' },
  { label: '17', korean: '열일곱', pronunciation: '[ёл-илгуб]' },
  { label: '18', korean: '열여덟', pronunciation: '[ёл-ёдол]' },
  { label: '19', korean: '열아홉', pronunciation: '[ёл-ахуб]' },
  { label: '20', korean: '스물', pronunciation: '[сымүл]' },
  { label: '30', korean: '서른', pronunciation: '[сорын]' },
  { label: '40', korean: '마흔', pronunciation: '[махын]' },
  { label: '50', korean: '쉰', pronunciation: '[шюүн]' },
  { label: '60', korean: '예순', pronunciation: '[есүн]' },
  { label: '70', korean: '일흔', pronunciation: '[ирхын]' },
  { label: '80', korean: '여든', pronunciation: '[ёдын]' },
  { label: '90', korean: '아흔', pronunciation: '[ахын]' },
];

const largeKoreanNumbers: NumberItem[] = [
  { label: 'зуу', korean: '백', pronunciation: '[бэг]' },
  { label: 'мянга', korean: '천', pronunciation: '[чон]' },
  { label: 'арван мянга', korean: '만', pronunciation: '[ман]' },
  { label: 'зуун мянга', korean: '십만', pronunciation: '[шимман]' },
  { label: 'сая', korean: '백만', pronunciation: '[бэнман]' },
  { label: 'арван сая', korean: '천만', pronunciation: '[чонман]' },
  { label: 'зуун сая', korean: '억', pronunciation: '[ог]' },
  { label: 'тэрбум', korean: '십억', pronunciation: '[шибог]' },
];

const VowelSection = ({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: VowelItem[];
}) => (
  <Card style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <AppText variant="section" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText tone="secondary" style={styles.sectionSubtitle}>
        {subtitle}
      </AppText>
      <Icon name="school" size={22} color="#334155" />
    </View>

    <View style={styles.grid}>
      {items.map((item) => (
        <View key={`${title}-${item.symbol}`} style={styles.gridItem}>
          <AppText style={styles.symbol}>{item.symbol}</AppText>
          <AppText tone="secondary" style={styles.label}>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  </Card>
);

const NumberSection = ({
  title,
  subtitle,
  items,
  nameOnly = false,
  compact = false,
}: {
  title: string;
  subtitle: string;
  items: NumberItem[];
  nameOnly?: boolean;
  compact?: boolean;
}) => (
  <Card style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <AppText variant="section" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText tone="secondary" style={styles.sectionSubtitle}>
        {subtitle}
      </AppText>
      <Icon name="calculator" size={22} color="#334155" />
    </View>

    <View style={styles.numberGrid}>
      {items.map((item) => (
        <View
          key={`${title}-${item.label}`}
          style={[styles.numberCard, compact && styles.numberCardCompact]}
        >
          {!nameOnly ? (
            <AppText style={[styles.numberLabel, compact && styles.numberLabelCompact]}>
              {item.label}
            </AppText>
          ) : null}
          <AppText style={[styles.numberKorean, compact && styles.numberKoreanCompact]}>
            {item.korean}
          </AppText>
          {!nameOnly && item.pronunciation ? (
            <AppText tone="secondary" style={[styles.numberPronunciation, compact && styles.numberPronunciationCompact]}>
              {item.pronunciation}
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  </Card>
);

const AlphabetNumbersScreen = () => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.introCard}>
        <AppText variant="section" style={styles.introTitle}>
          한글 - Хангыл
        </AppText>

        <AppText tone="secondary" style={styles.paragraph}>
          1443 онд Сэжун их хаан Солонгос цагаан толгой болох Хангылыг анх гаргаж
          дэлгэрүүлсэн бөгөөд эгшиг үсгүүд нь "Тэнгэр (•), Газар (—) ба Хүн ( | )"
          гэсэн 3 хүчинд, гийгүүлэгч үсгүүд нь дуу авиa гаргаж байгаа хоолойн эрхтэний
          хэлбэрт үндэслэн зохиогджээ.
        </AppText>

        <AppText tone="secondary" style={styles.paragraph}>
          Хангыл нь нийт 19 гийгүүлэгч, 21 эгшиг нийт 40 үсгээс бүтдэг ба Монгол
          хэлтэй адил гийгүүлэгч болон эгшгийг солбин бичиж хэрэглэдэг байна.
        </AppText>
      </Card>

      <VowelSection title="기본 모음" subtitle="Үндсэн эгшиг (10)" items={basicVowels} />
      <VowelSection title="복합 모음" subtitle="Хос эгшиг (11)" items={compoundVowels} />
      <VowelSection title="기본 자음" subtitle="Үндсэн гийгүүлэгч (14)" items={basicConsonants} />
      <VowelSection title="쌍자음" subtitle="Давхар гийгүүлэгч (5)" items={doubleConsonants} />
      <NumberSection title="고유 수사" subtitle="Солонгос тоо (1-10)" items={koreanNumbers} />
      <NumberSection
        title="큰 수"
        subtitle="Олон оронтой тоо"
        items={largeKoreanNumbers}
        compact={true}
      />

      <Card style={styles.noteCard}>
        <CardTitle style={styles.noteTitle}>Суралцах зөвлөмж</CardTitle>
        <AppText tone="secondary" style={styles.noteText}>
          Эхлээд үндсэн 10 эгшгээ тогтоогоод дараа нь хос эгшгүүдийн бүтцийг харьцуулж
          цээжлэхэд илүү амар байдаг.
        </AppText>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  introCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  introTitle: {
    color: '#1f2937',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 34,
    color: '#6b7280',
    marginBottom: 18,
  },
  sectionCard: {
    marginBottom: 16,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#e8f0fa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionTitle: {
    color: '#1f2937',
    marginRight: 6,
  },
  sectionSubtitle: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  symbol: {
    fontSize: 54,
    lineHeight: 60,
    color: '#111827',
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    color: '#4b5563',
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  numberCard: {
    width: '25%',
    paddingHorizontal: 6,
    paddingVertical: 16,
    alignItems: 'center',
  },
  numberCardCompact: {
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  numberLabel: {
    fontSize: 24,
    lineHeight: 40,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    includeFontPadding: false,
  },
  numberLabelCompact: {
    fontSize: 16,
    lineHeight: 30,
    marginBottom: 4,
  },
  numberKorean: {
    fontSize: 18,
    lineHeight: 24,
    color: '#1f2937',
    marginBottom: 4,
  },
  numberKoreanCompact: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  numberPronunciation: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  numberPronunciationCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  noteCard: {
    backgroundColor: '#ffffff',
  },
  noteTitle: {
    color: '#1f2937',
    marginBottom: 8,
  },
  noteText: {
    lineHeight: 22,
  },
});

export default AlphabetNumbersScreen;
