import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppStore } from '../../../app/store';
import type { AccessLevel } from '../../../app/store/types';
import { ProtectedTouchable } from '../../../shared/components/molecules/protectedTouchable';
import { getErrorMessage } from '../../../shared/lib/errors';
import { lessonApi, type KoreanGrammarLesson } from '../api/lessonApi';

type LevelFilter = KoreanGrammarLesson['level'] | 'all';
type TopikFilter = KoreanGrammarLesson['topikLevel'] | 'all';

const LEVEL_OPTIONS: Array<{ value: LevelFilter; label: string }> = [
  { value: 'all', label: 'Бүгд' },
  { value: 'Beginner', label: 'Анхан шат' },
  { value: 'Intermediate', label: 'Дунд шат' },
  { value: 'Advanced', label: 'Гүнзгий шат' },
];


const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const getGrammarRequiredStatus = (level: KoreanGrammarLesson['level']): AccessLevel =>
  level === 'Beginner' ? 'registered' : 'paid';

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const Chip = React.memo(({ label, isSelected, onPress }: ChipProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.78}
    style={[styles.chip, isSelected && styles.chipActive]}
  >
    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
));

// ─── Grammar card ─────────────────────────────────────────────────────────────

const GrammarCard = React.memo(({ lesson }: { lesson: KoreanGrammarLesson }) => {
  const { hasAccess } = useAppStore();
  const requiredStatus = getGrammarRequiredStatus(lesson.level);
  const isLocked = !hasAccess(requiredStatus);

  return (
  <ProtectedTouchable requiredStatus={requiredStatus} activeOpacity={0.88} style={styles.cardTouch}>
  <View style={[styles.grammarCard, isLocked && styles.grammarCardLocked]}>
    <View style={styles.cardHeader}>
      <View style={styles.patternBlock}>
        <Text style={styles.patternText}>{lesson.grammarPattern}</Text>
        {isLocked ? (
          <View style={styles.lockedHint}>
            <Icon name="lock-closed" size={13} color="#92400E" />
            <Text style={styles.lockedHintText}>Дунд болон гүнзгий шат Premium эрхээр нээгдэнэ</Text>
          </View>
        ) : (
          <Text style={styles.meaningText}>{lesson.meaningMn}</Text>
        )}
      </View>
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{lesson.sortOrder}</Text>
      </View>
    </View>

    <View style={styles.metaRow}>
      <View style={styles.metaPill}>
        <Icon name="school-outline" size={13} color="#155DFC" />
        <Text style={styles.metaText}>{lesson.level}</Text>
      </View>
      <View style={styles.metaPill}>
        <Icon name="ribbon-outline" size={13} color="#155DFC" />
        <Text style={styles.metaText}>{lesson.topikLevel}</Text>
      </View>
      {!!lesson.category && (
        <View style={styles.metaPill}>
          <Icon name="pricetag-outline" size={13} color="#155DFC" />
          <Text style={styles.metaText}>{lesson.category}</Text>
        </View>
      )}
      {isLocked && (
        <View style={styles.premiumPill}>
          <Icon name="diamond-outline" size={13} color="#B45309" />
          <Text style={styles.premiumPillText}>Premium</Text>
        </View>
      )}
    </View>

    {!isLocked && !!lesson.formRule && (
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Хэлбэр</Text>
        <Text style={styles.infoText}>{lesson.formRule}</Text>
      </View>
    )}

    {!isLocked && (!!lesson.exampleKr || !!lesson.exampleMn) && (
      <View style={styles.exampleBlock}>
        {!!lesson.exampleKr && <Text style={styles.exampleKr}>{lesson.exampleKr}</Text>}
        {!!lesson.exampleMn && <Text style={styles.exampleMn}>{lesson.exampleMn}</Text>}
      </View>
    )}

    {!isLocked && !!lesson.noteMn && (
      <View style={styles.noteBlock}>
        <Icon name="bulb-outline" size={15} color="#92400E" />
        <Text style={styles.noteText}>{lesson.noteMn}</Text>
      </View>
    )}
  </View>
  </ProtectedTouchable>
  );
});

const GrammarSeparator = () => <View style={styles.separator} />;

// ─── Main screen ──────────────────────────────────────────────────────────────

const GrammarScreen = () => {
  const [query, setQuery] = useState('');
  const [lessons, setLessons] = useState<KoreanGrammarLesson[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('all');
  const [selectedTopik, setSelectedTopik] = useState<TopikFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await lessonApi.getKoreanGrammarLessons();
        if (!response.success) {
          throw new Error(response.error || 'Дүрмийн мэдээлэл ачааллах боломжгүй байна.');
        }
        if (isMounted) {setLessons(response.lessons || []);}
      } catch (e) {
        if (isMounted) {
          setError(getErrorMessage(e, 'Дүрмийн мэдээлэл ачааллах үед алдаа гарлаа.'));
        }
      } finally {
        if (isMounted) {setIsLoading(false);}
      }
    };

    load().catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(lessons.map((l) => l.category).filter((c): c is string => Boolean(c))),
    );
    return ['all', ...unique.sort((a, b) => a.localeCompare(b))];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const q = normalize(query);
    return lessons.filter((lesson) => {
      const matchesLevel = selectedLevel === 'all' || lesson.level === selectedLevel;
      const matchesTopik = selectedTopik === 'all' || lesson.topikLevel === selectedTopik;
      const matchesCategory = selectedCategory === 'all' || lesson.category === selectedCategory;
      if (!matchesLevel || !matchesTopik || !matchesCategory) {return false;}
      if (!q) {return true;}
      return normalize(
        [lesson.grammarPattern, lesson.meaningMn, lesson.formRule,
         lesson.exampleKr, lesson.exampleMn, lesson.noteMn,
         lesson.category, lesson.level, lesson.topikLevel].join(' '),
      ).includes(q);
    });
  }, [lessons, query, selectedCategory, selectedLevel, selectedTopik]);

  const resetFilters = useCallback(() => {
    setQuery('');
    setSelectedLevel('all');
    setSelectedTopik('all');
    setSelectedCategory('all');
  }, []);

  const hasActiveFilter =
    !!query || selectedLevel !== 'all' || selectedTopik !== 'all' || selectedCategory !== 'all';

  const renderItem = useCallback(
    ({ item }: { item: KoreanGrammarLesson }) => <GrammarCard lesson={item} />,
    [],
  );

  const keyExtractor = useCallback((item: KoreanGrammarLesson) => item.id, []);

  const listHeader = useMemo(
    () => (
      <>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Icon name="document-text-outline" size={28} color="#60A5FA" />
            </View>
            <View style={styles.heroCounter}>
              <Text style={styles.heroCounterText}>{lessons.length}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Дүрэм</Text>
          <Text style={styles.heroDesc}>Солонгос хэлний дүрмийн сан, жишээ болон тайлбар</Text>
        </View>

        <View style={styles.searchBox}>
          <Icon name="search-outline" size={19} color="#155DFC" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Дүрэм, утга, жишээгээр хайх..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Icon name="close-circle" size={19} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterBlock}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={LEVEL_OPTIONS}
            keyExtractor={(o) => o.value}
            renderItem={({ item: o }) => (
              <Chip
                label={o.label}
                isSelected={selectedLevel === o.value}
                onPress={() => setSelectedLevel(o.value)}
              />
            )}
            contentContainerStyle={styles.chipRow}
          />

        </View>

        {!isLoading && !error && (
          <View style={styles.countRow}>
            <View style={styles.accent} />
            <Text style={styles.countText}>Илэрц: {filteredLessons.length}</Text>
            {hasActiveFilter && (
              <TouchableOpacity onPress={resetFilters} style={styles.resetButton} activeOpacity={0.75}>
                <Icon name="refresh-outline" size={14} color="#155DFC" />
                <Text style={styles.resetText}>Цэвэрлэх</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessons.length, query, selectedLevel, selectedTopik, selectedCategory,
     categories, isLoading, error, filteredLessons.length, hasActiveFilter, resetFilters],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#155DFC" />
          <Text style={styles.stateTitle}>Ачааллаж байна...</Text>
          <Text style={styles.stateDesc}>Дүрмийн санг татаж байна.</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateCard}>
          <View style={[styles.stateIconBox, styles.errorIconBox]}>
            <Icon name="alert-circle-outline" size={26} color="#EF4444" />
          </View>
          <Text style={[styles.stateTitle, styles.errorText]}>Алдаа гарлаа</Text>
          <Text style={styles.stateDesc}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.stateCard}>
        <View style={styles.stateIconBox}>
          <Icon name="search-outline" size={26} color="#94A3B8" />
        </View>
        <Text style={styles.stateTitle}>Дүрэм олдсонгүй</Text>
        <Text style={styles.stateDesc}>Хайлтын үг эсвэл шүүлтүүрээ өөрчлөөд дахин үзээрэй.</Text>
      </View>
    );
  }, [isLoading, error]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={filteredLessons}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={10}
      initialNumToRender={10}
      ItemSeparatorComponent={GrammarSeparator}
    />
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    gap: 10,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCounter: {
    minWidth: 46,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(96,165,250,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  heroCounterText: { color: '#BFDBFE', fontSize: 14, fontWeight: '800' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  heroDesc: { fontSize: 13, color: '#CBD5E1', lineHeight: 20 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500', paddingVertical: 0 },

  filterBlock: { gap: 8, marginBottom: 13 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#DCE6F2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  chipActive: { backgroundColor: '#155DFC', borderColor: '#155DFC' },
  chipText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  accent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  countText: { flex: 1, fontSize: 13, fontWeight: '800', color: '#334155' },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 8 },
  resetText: { fontSize: 12, fontWeight: '700', color: '#155DFC' },

  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  stateIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconBox: { backgroundColor: '#FEF2F2' },
  stateTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  stateDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  errorText: { color: '#EF4444' },

  separator: { height: 12 },
  cardTouch: { borderRadius: 16 },
  grammarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    gap: 12,
  },
  grammarCardLocked: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  patternBlock: { flex: 1, gap: 5 },
  patternText: { fontSize: 18, fontWeight: '900', color: '#0F172A', lineHeight: 25 },
  meaningText: { fontSize: 14, fontWeight: '700', color: '#155DFC', lineHeight: 20 },
  lockedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  lockedHintText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  orderBadge: {
    minWidth: 34,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  orderText: { color: '#155DFC', fontSize: 12, fontWeight: '900' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  metaPill: {
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
  },
  metaText: { fontSize: 11, color: '#475569', fontWeight: '800' },
  premiumPill: {
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
  },
  premiumPillText: { fontSize: 11, color: '#B45309', fontWeight: '900' },

  infoBlock: { borderLeftWidth: 3, borderLeftColor: '#155DFC', paddingLeft: 10, gap: 4 },
  infoLabel: { color: '#64748B', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  infoText: { color: '#334155', fontSize: 13, lineHeight: 20, fontWeight: '600' },

  exampleBlock: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, gap: 7 },
  exampleKr: { color: '#0F172A', fontSize: 15, lineHeight: 22, fontWeight: '800' },
  exampleMn: { color: '#64748B', fontSize: 13, lineHeight: 20 },

  noteBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 11,
  },
  noteText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 18, fontWeight: '600' },
});

export default GrammarScreen;
