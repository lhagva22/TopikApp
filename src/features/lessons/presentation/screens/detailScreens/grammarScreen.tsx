import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootDrawerParamList } from '../../../../../app/navigation/types';
import { IconButton } from '../../../../../shared/components/molecules/IconButton';
import { getErrorMessage } from '../../../../../shared/lib/errors';
import type { KoreanGrammarLesson } from '../../../domain/types';
import { lessonUseCases } from '../../dependencies';

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
const GrammarSeparator = () => <View style={styles.separator} />;

const GrammarCard = React.memo(({ lesson }: { lesson: KoreanGrammarLesson }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleExamples = expanded ? lesson.examples : lesson.examples.slice(0, 3);

  return (
    <TouchableOpacity onPress={() => setExpanded((value) => !value)} activeOpacity={0.86} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.patternBlock}>
          <Text style={styles.pattern}>{lesson.grammarPattern}</Text>
          {!!lesson.mongolianTranslation && <Text style={styles.translation}>{lesson.mongolianTranslation}</Text>}
        </View>
        <View style={styles.senseBadge}><Text style={styles.senseText}>Утга {lesson.senseNo}</Text></View>
      </View>

      {!!lesson.partOfSpeech && <Text style={styles.partOfSpeech}>{lesson.partOfSpeech}</Text>}
      {!!lesson.mongolianDefinition && <Text style={styles.definitionMn}>{lesson.mongolianDefinition}</Text>}
      <Text style={styles.definitionKr}>{lesson.koreanDefinition}</Text>

      {!!lesson.formRule && (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>ХЭЛБЭР</Text>
          <Text style={styles.infoText}>{lesson.formRule}</Text>
        </View>
      )}

      {visibleExamples.length > 0 && (
        <View style={styles.examplesBlock}>
          <Text style={styles.infoLabel}>ЖИШЭЭ</Text>
          {visibleExamples.map((example, index) => (
            <View key={`${lesson.id}-${index}`} style={styles.exampleRow}>
              <Text style={styles.exampleDot}>•</Text>
              <View style={styles.exampleBody}>
                {!!example.type && <Text style={styles.exampleType}>{example.type}</Text>}
                <Text style={styles.exampleText}>{example.text}</Text>
              </View>
            </View>
          ))}
          {lesson.examples.length > 3 && (
            <Text style={styles.moreText}>
              {expanded ? 'Хураах' : `Дахин ${lesson.examples.length - 3} жишээ үзэх`}
            </Text>
          )}
        </View>
      )}

      {lesson.relatedWords.length > 0 && (
        <View style={styles.relatedRow}>
          <Icon name="git-branch-outline" size={14} color="#64748B" />
          <Text style={styles.relatedText}>
            {lesson.relatedWords.map((word) => word.rel_word).filter(Boolean).join(' · ')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const GrammarScreen = () => {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
  const [query, setQuery] = useState('');
  const [lessons, setLessons] = useState<KoreanGrammarLesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await lessonUseCases.getKoreanGrammarLessons();
        if (!response.success) {throw new Error(response.error || 'Дүрмийн санг ачаалж чадсангүй.');}
        if (mounted) {setLessons(response.lessons || []); setHasLoaded(true);}
      } catch (loadError) {
        if (mounted) {setError(getErrorMessage(loadError, 'Дүрмийн санг ачаалах үед алдаа гарлаа.'));}
      } finally {
        if (mounted) {setIsLoading(false);}
      }
    };
    load().catch(() => undefined);
    return () => {mounted = false;};
  }, []);

  const filteredLessons = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {return lessons;}
    return lessons.filter((lesson) => normalize([
      lesson.grammarPattern, lesson.mongolianTranslation, lesson.mongolianDefinition,
      lesson.koreanDefinition, lesson.formRule,
      ...lesson.examples.map((example) => example.text),
      ...lesson.relatedWords.map((word) => word.rel_word || ''),
    ].join(' ')).includes(normalizedQuery));
  }, [lessons, query]);

  const renderItem = useCallback(
    ({ item }: { item: KoreanGrammarLesson }) => <GrammarCard lesson={item} />,
    [],
  );

  const header = (
    <>
      <IconButton name="arrow-back" onPress={() => navigation.navigate('Lesson')} style={styles.backBtn} size={36} />
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Icon name="document-text-outline" size={21} color="#60A5FA" /></View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Дүрмийн сан</Text>
          <Text style={styles.heroDesc}>Монгол тайлбар, хэлбэр болон жишээтэй</Text>
        </View>
        <View style={styles.counter}><Text style={styles.counterText}>{lessons.length}</Text></View>
      </View>
      <View style={styles.searchBox}>
        <Icon name="search-outline" size={19} color="#155DFC" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Дүрэм, утга, жишээгээр хайх..."
          placeholderTextColor="#94A3B8" style={styles.searchInput} />
        {!!query && <TouchableOpacity onPress={() => setQuery('')}><Icon name="close-circle" size={19} color="#94A3B8" /></TouchableOpacity>}
      </View>
      {hasLoaded && !isLoading && !error && <Text style={styles.resultText}>Илэрц: {filteredLessons.length}</Text>}
    </>
  );

  const empty = isLoading ? (
    <View style={styles.state}><ActivityIndicator color="#155DFC" /><Text style={styles.stateText}>Ачааллаж байна...</Text></View>
  ) : error ? (
    <View style={styles.state}><Icon name="alert-circle-outline" size={28} color="#EF4444" /><Text style={styles.errorText}>{error}</Text></View>
  ) : hasLoaded ? (
    <View style={styles.state}><Icon name="search-outline" size={28} color="#94A3B8" /><Text style={styles.stateText}>Дүрэм олдсонгүй.</Text></View>
  ) : null;

  return (
    <FlatList style={styles.screen} contentContainerStyle={styles.content}
      data={hasLoaded && !isLoading && !error ? filteredLessons : []}
      keyExtractor={(item) => item.id} renderItem={renderItem}
      ListHeaderComponent={header} ListEmptyComponent={empty}
      ItemSeparatorComponent={GrammarSeparator}
      keyboardShouldPersistTaps="handled" initialNumToRender={10} maxToRenderPerBatch={10}
      windowSize={8} removeClippedSubviews showsVerticalScrollIndicator={false} />
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },
  backBtn: { borderRadius: 10, marginBottom: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 16, padding: 15, marginBottom: 14, gap: 12 },
  heroIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, gap: 3 }, heroTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  heroDesc: { color: '#94A3B8', fontSize: 12 }, counter: { backgroundColor: 'rgba(96,165,250,0.18)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  counterText: { color: '#BFDBFE', fontSize: 12, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 13, paddingVertical: 11, gap: 10, marginBottom: 10 },
  searchInput: { flex: 1, paddingVertical: 0, color: '#0F172A', fontSize: 14 },
  resultText: { color: '#475569', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  separator: { height: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 15, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, patternBlock: { flex: 1, gap: 4 },
  pattern: { color: '#0F172A', fontSize: 18, lineHeight: 25, fontWeight: '900' },
  translation: { color: '#155DFC', fontSize: 14, fontWeight: '800' },
  senseBadge: { backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  senseText: { color: '#2563EB', fontSize: 10, fontWeight: '800' }, partOfSpeech: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  definitionMn: { color: '#334155', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  definitionKr: { color: '#64748B', fontSize: 13, lineHeight: 20 },
  infoBlock: { borderLeftWidth: 3, borderLeftColor: '#155DFC', paddingLeft: 10, gap: 4 },
  infoLabel: { color: '#64748B', fontSize: 10, fontWeight: '900' }, infoText: { color: '#334155', fontSize: 13, lineHeight: 20 },
  examplesBlock: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, gap: 8 },
  exampleRow: { flexDirection: 'row', gap: 7 }, exampleDot: { color: '#155DFC', fontWeight: '900' }, exampleBody: { flex: 1, gap: 2 },
  exampleType: { color: '#2563EB', fontSize: 10, fontWeight: '800' }, exampleText: { color: '#0F172A', fontSize: 13, lineHeight: 20 },
  moreText: { color: '#155DFC', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  relatedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 }, relatedText: { flex: 1, color: '#64748B', fontSize: 11, lineHeight: 17 },
  state: { backgroundColor: '#FFF', borderRadius: 16, padding: 28, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  stateText: { color: '#64748B', fontSize: 13 }, errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
});

export default GrammarScreen;
