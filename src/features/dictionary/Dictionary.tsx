import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { getErrorMessage } from '../../shared/lib/errors';
import { dictionaryApi, type DictionaryWord } from './api/dictionaryApi';

const LEVEL_THEME: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'TOPIK I',  color: '#059669', bg: '#ECFDF5' },
  2: { label: 'TOPIK I',  color: '#059669', bg: '#ECFDF5' },
  3: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
  4: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
  5: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
  6: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
};

const Dictionary = () => {
  const [query, setQuery] = useState('');
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadWords = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await dictionaryApi.searchWords(query);
        if (!response.success) throw new Error(response.error || 'Үгийн сан ачаалах боломжгүй байна.');
        if (isMounted) setWords(response.words || []);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError, 'Үгийн сан ачаалах үед алдаа гарлаа.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const tid = setTimeout(() => void loadWords(), 250);
    return () => { isMounted = false; clearTimeout(tid); };
  }, [query]);

  const countLabel = useMemo(() => {
    if (query.trim()) return `"${query}" — ${words.length} үг олдлоо`;
    return `Нийт ${words.length} үг`;
  }, [query, words.length]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Icon name="library-outline" size={28} color="#60A5FA" />
        </View>
        <Text style={styles.heroTitle}>Үгийн сан</Text>
        <Text style={styles.heroDesc}>Солонгос үгс хайж, утгыг нь олоорой.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchCard}>
        <View style={styles.searchIconBox}>
          <Icon name="search-outline" size={18} color="#155DFC" />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Үг хайх..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.7}>
            <Icon name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count row */}
      {!isLoading && !error && (
        <View style={styles.countRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="hourglass-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Ачааллаж байна...</Text>
          <Text style={styles.stateDesc}>Үгс татаж байна, хүлээнэ үү.</Text>
        </View>
      )}

      {/* Error */}
      {!isLoading && error && (
        <View style={styles.stateCard}>
          <View style={[styles.stateIconBox, { backgroundColor: '#FEF2F2' }]}>
            <Icon name="alert-circle-outline" size={26} color="#EF4444" />
          </View>
          <Text style={[styles.stateTitle, { color: '#EF4444' }]}>Алдаа гарлаа</Text>
          <Text style={styles.stateDesc}>{error}</Text>
        </View>
      )}

      {/* Empty */}
      {!isLoading && !error && words.length === 0 && (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="search-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Үг олдсонгүй</Text>
          <Text style={styles.stateDesc}>
            {query.trim() ? `"${query}" гэсэн үг олдсонгүй. Өөр үг хайна уу.` : 'Хайх үгээ дээрх талбарт бичнэ үү.'}
          </Text>
        </View>
      )}

      {/* Word list */}
      {!isLoading && !error && words.length > 0 && (
        <View style={styles.listCard}>
          {words.map((word, idx) => {
            const levelTheme = word.level != null ? LEVEL_THEME[word.level] : null;
            return (
              <View
                key={word.id}
                style={[styles.wordRow, idx < words.length - 1 && styles.wordRowBorder]}
              >
                <View style={styles.wordIconBox}>
                  <Icon name="text-outline" size={16} color="#155DFC" />
                </View>
                <View style={styles.wordBody}>
                  <View style={styles.wordTitleRow}>
                    <Text style={styles.wordKorean}>{word.koreanWord}</Text>
                    {levelTheme && (
                      <View style={[styles.levelBadge, { backgroundColor: levelTheme.bg }]}>
                        <Text style={[styles.levelBadgeText, { color: levelTheme.color }]}>
                          {levelTheme.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!!word.mongolianMeaning && (
                    <Text style={styles.wordMeaning}>{word.mongolianMeaning}</Text>
                  )}
                  {!!word.exampleSentence && (
                    <View style={styles.exampleWrap}>
                      <Icon name="chatbubble-outline" size={11} color="#94A3B8" style={styles.exampleIcon} />
                      <Text style={styles.wordExample}>{word.exampleSentence}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

  /* Hero */
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  heroIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.3 },
  heroDesc:  { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  /* Search */
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },

  /* Count */
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  countText: { fontSize: 13, fontWeight: '700', color: '#374151', letterSpacing: -0.1 },

  /* State */
  stateCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  stateIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  stateDesc:  { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  /* List */
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wordRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  wordIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  wordBody: { flex: 1, gap: 4 },
  wordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  wordKorean: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  levelBadgeText: { fontSize: 10, fontWeight: '700' },
  wordMeaning: { fontSize: 14, color: '#374151', fontWeight: '500', lineHeight: 20 },
  exampleWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 2 },
  exampleIcon: { marginTop: 2 },
  wordExample: { flex: 1, fontSize: 12, color: '#94A3B8', lineHeight: 18, fontStyle: 'italic' },
});

export default Dictionary;
