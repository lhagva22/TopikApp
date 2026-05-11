import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AppText from '../../../shared/components/atoms/AppText';

type VowelItem = { symbol: string; label: string };
type NumberItem = { label: string; korean: string; pronunciation?: string };

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
  { label: '1',  korean: '하나', pronunciation: '[хана]' },
  { label: '2',  korean: '둘',   pronunciation: '[тул]' },
  { label: '3',  korean: '셋',   pronunciation: '[сэд]' },
  { label: '4',  korean: '넷',   pronunciation: '[нэд]' },
  { label: '5',  korean: '다섯', pronunciation: '[тасод]' },
  { label: '6',  korean: '여섯', pronunciation: '[ёсод]' },
  { label: '7',  korean: '일곱', pronunciation: '[илгуб]' },
  { label: '8',  korean: '여덟', pronunciation: '[ёдол]' },
  { label: '9',  korean: '아홉', pronunciation: '[ахуб]' },
  { label: '10', korean: '열',   pronunciation: '[ёл]' },
  { label: '11', korean: '열하나', pronunciation: '[ёл-хана]' },
  { label: '12', korean: '열둘',  pronunciation: '[ёл-тул]' },
  { label: '13', korean: '열셋',  pronunciation: '[ёл-сэд]' },
  { label: '14', korean: '열넷',  pronunciation: '[ёл-нэд]' },
  { label: '15', korean: '열다섯', pronunciation: '[ёл-тасод]' },
  { label: '16', korean: '열여섯', pronunciation: '[ёл-ёсод]' },
  { label: '17', korean: '열일곱', pronunciation: '[ёл-илгуб]' },
  { label: '18', korean: '열여덟', pronunciation: '[ёл-ёдол]' },
  { label: '19', korean: '열아홉', pronunciation: '[ёл-ахуб]' },
  { label: '20', korean: '스물',  pronunciation: '[сымүл]' },
  { label: '30', korean: '서른',  pronunciation: '[сорын]' },
  { label: '40', korean: '마흔',  pronunciation: '[махын]' },
  { label: '50', korean: '쉰',   pronunciation: '[шюүн]' },
  { label: '60', korean: '예순',  pronunciation: '[есүн]' },
  { label: '70', korean: '일흔',  pronunciation: '[ирхын]' },
  { label: '80', korean: '여든',  pronunciation: '[ёдын]' },
  { label: '90', korean: '아흔',  pronunciation: '[ахын]' },
];

const largeKoreanNumbers: NumberItem[] = [
  { label: 'зуу',        korean: '백',  pronunciation: '[бэг]' },
  { label: 'мянга',      korean: '천',  pronunciation: '[чон]' },
  { label: 'арван мянга', korean: '만', pronunciation: '[ман]' },
  { label: 'зуун мянга', korean: '십만', pronunciation: '[шимман]' },
  { label: 'сая',        korean: '백만', pronunciation: '[бэнман]' },
  { label: 'арван сая',  korean: '천만', pronunciation: '[чонман]' },
  { label: 'зуун сая',   korean: '억',  pronunciation: '[ог]' },
  { label: 'тэрбум',     korean: '십억', pronunciation: '[шибог]' },
];

type Theme = { color: string; bg: string; border: string };

const THEMES: Record<string, Theme> = {
  blue:   { color: '#155DFC', bg: '#EFF6FF', border: '#BFDBFE' },
  purple: { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  green:  { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  orange: { color: '#EA580C', bg: '#FFF7ED', border: '#FDBA74' },
  cyan:   { color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  violet: { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD' },
};

const SectionHeader = ({
  title,
  subtitle,
  icon,
  theme,
}: {
  title: string;
  subtitle: string;
  icon: string;
  theme: Theme;
}) => (
  <View style={[styles.sectionHeader, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
    <View style={[styles.sectionAccent, { backgroundColor: theme.color }]} />
    <View style={styles.sectionHeaderText}>
      <AppText style={[styles.sectionTitle, { color: theme.color }]}>{title}</AppText>
      <AppText style={styles.sectionSubtitle}>{subtitle}</AppText>
    </View>
    <View style={[styles.sectionIconBox, { backgroundColor: theme.color + '18' }]}>
      <Icon name={icon} size={18} color={theme.color} />
    </View>
  </View>
);

const VowelGrid = ({ items, theme }: { items: VowelItem[]; theme: Theme }) => (
  <View style={styles.grid}>
    {items.map((item) => (
      <View key={item.symbol} style={styles.charCard}>
        <AppText style={styles.charSymbol}>{item.symbol}</AppText>
        <View style={[styles.charLabelBox, { backgroundColor: theme.bg }]}>
          <AppText style={[styles.charLabel, { color: theme.color }]}>{item.label}</AppText>
        </View>
      </View>
    ))}
  </View>
);

const NumberGrid = ({
  items,
  theme,
  compact = false,
}: {
  items: NumberItem[];
  theme: Theme;
  compact?: boolean;
}) => (
  <View style={styles.numberList}>
    {items.map((item) => (
      <View key={item.label} style={[styles.numberRow, { borderColor: theme.border }]}>
        <View style={[styles.numberLabelBox, { backgroundColor: theme.bg }]}>
          <AppText style={[styles.numberLabelText, compact && styles.numberLabelCompact, { color: theme.color }]}>
            {item.label}
          </AppText>
        </View>
        <AppText style={[styles.numberKorean, compact && styles.numberKoreanCompact]}>
          {item.korean}
        </AppText>
        {item.pronunciation ? (
          <AppText style={styles.numberPronun}>{item.pronunciation}</AppText>
        ) : null}
      </View>
    ))}
  </View>
);

const AlphabetNumbersScreen = () => (
  <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    {/* Intro hero */}
    <View style={styles.hero}>
      <View style={styles.heroKoreanBox}>
        <AppText style={styles.heroKorean}>한글</AppText>
      </View>
      <View style={styles.heroBody}>
        <AppText style={styles.heroTitle}>Хангыл</AppText>
        <AppText style={styles.heroDesc}>
          1443 онд Сэжун их хаан зохиосон Солонгос цагаан толгой. Нийт 19 гийгүүлэгч,
          21 эгшиг — нийт 40 үсэгтэй.
        </AppText>
      </View>
    </View>

    {/* Basic vowels */}
    <View style={styles.section}>
      <SectionHeader
        title="기본 모음"
        subtitle="Үндсэн эгшиг · 10"
        icon="mic-outline"
        theme={THEMES.blue}
      />
      <VowelGrid items={basicVowels} theme={THEMES.blue} />
    </View>

    {/* Compound vowels */}
    <View style={styles.section}>
      <SectionHeader
        title="복합 모음"
        subtitle="Хос эгшиг · 11"
        icon="git-merge-outline"
        theme={THEMES.purple}
      />
      <VowelGrid items={compoundVowels} theme={THEMES.purple} />
    </View>

    {/* Basic consonants */}
    <View style={styles.section}>
      <SectionHeader
        title="기본 자음"
        subtitle="Үндсэн гийгүүлэгч · 14"
        icon="text-outline"
        theme={THEMES.green}
      />
      <VowelGrid items={basicConsonants} theme={THEMES.green} />
    </View>

    {/* Double consonants */}
    <View style={styles.section}>
      <SectionHeader
        title="쌍자음"
        subtitle="Давхар гийгүүлэгч · 5"
        icon="layers-outline"
        theme={THEMES.orange}
      />
      <VowelGrid items={doubleConsonants} theme={THEMES.orange} />
    </View>

    {/* Korean numbers */}
    <View style={styles.section}>
      <SectionHeader
        title="고유 수사"
        subtitle="Солонгос тоо · 1-90"
        icon="calculator-outline"
        theme={THEMES.cyan}
      />
      <NumberGrid items={koreanNumbers} theme={THEMES.cyan} />
    </View>

    {/* Large numbers */}
    <View style={styles.section}>
      <SectionHeader
        title="큰 수"
        subtitle="Олон оронтой тоо"
        icon="trending-up-outline"
        theme={THEMES.violet}
      />
      <NumberGrid items={largeKoreanNumbers} theme={THEMES.violet} compact />
    </View>

    {/* Tip */}
    <View style={styles.tipCard}>
      <View style={styles.tipIconBox}>
        <Icon name="bulb-outline" size={20} color="#F59E0B" />
      </View>
      <View style={styles.tipBody}>
        <AppText style={styles.tipTitle}>Суралцах зөвлөмж</AppText>
        <AppText style={styles.tipText}>
          Эхлээд үндсэн 10 эгшгээ тогтоогоод дараа нь хос эгшгүүдийн бүтцийг харьцуулж
          цээжлэхэд илүү амар байдаг.
        </AppText>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },

  /* Hero */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  heroKoreanBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKorean: {
    fontSize: 32,
    color: '#F8FAFC',
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroBody: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },

  /* Section container */
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Char grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  charCard: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  charSymbol: {
    fontSize: 40,
    lineHeight: 46,
    color: '#0F172A',
    fontWeight: '600',
  },
  charLabelBox: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  charLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Number list */
  numberList: {
    padding: 12,
    gap: 6,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  numberLabelBox: {
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberLabelText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  numberLabelCompact: {
    fontSize: 13,
    fontWeight: '700',
  },
  numberKorean: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 12,
    letterSpacing: -0.2,
  },
  numberKoreanCompact: {
    fontSize: 16,
  },
  numberPronun: {
    fontSize: 11,
    color: '#94A3B8',
    paddingRight: 12,
  },

  /* Tip */
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 20,
  },
});

export default AlphabetNumbersScreen;
