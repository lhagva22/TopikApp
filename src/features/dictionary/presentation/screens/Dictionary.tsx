import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { getErrorMessage } from '../../../../shared/lib/errors';
import type { DictionaryWord } from '../../domain/types';
import { dictionaryUseCases } from '../dependencies';

const PAGE_SIZE = 200;

const LEVEL_THEME: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'TOPIK I', color: '#059669', bg: '#ECFDF5' },
  2: { label: 'TOPIK I', color: '#059669', bg: '#ECFDF5' },
  3: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
  4: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
  5: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
  6: { label: 'TOPIK II', color: '#8B5CF6', bg: '#F5F3FF' },
};

const Dictionary = () => {
  const [query, setQuery] = useState('');
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedWords, setHasLoadedWords] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let loadingTid: ReturnType<typeof setTimeout> | null = null;

    const loadWords = async () => {
      try {
        loadingTid = setTimeout(() => {
          if (isMounted) {
            setIsLoading(true);
          }
        }, 180);
        setError(null);

        const response = await dictionaryUseCases.searchWords(query, { limit: PAGE_SIZE, offset: 0 });
        if (!response.success) {
          throw new Error(response.error || 'Үгийн сан ачаалах боломжгүй байна.');
        }

        if (isMounted) {
          setWords(response.words || []);
          setTotal(response.total || 0);
          setHasMore(Boolean(response.hasMore));
          setHasLoadedWords(true);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, 'Үгийн сан ачаалах үед алдаа гарлаа.'));
        }
      } finally {
        if (loadingTid) {
          clearTimeout(loadingTid);
        }
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWords().catch(() => undefined);

    return () => {
      isMounted = false;
      if (loadingTid) {
        clearTimeout(loadingTid);
      }
    };
  }, [query]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const response = await dictionaryUseCases.searchWords(query, { limit: PAGE_SIZE, offset: words.length });

      if (!response.success) {
        throw new Error(response.error || 'Үг нэмж ачаалах боломжгүй байна.');
      }

      setWords((prev) => [...prev, ...(response.words || [])]);
      setTotal(response.total || total);
      setHasMore(Boolean(response.hasMore));
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Үг нэмж ачаалах үед алдаа гарлаа.'));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const countLabel = useMemo(() => {
    if (query.trim()) {
      return `"${query}" - ${total} үр дүн`;
    }

    return `Нийт ${total} үг`;
  }, [query, total]);

  const listData = hasLoadedWords && !isLoading && !error ? words : [];

  const renderHeader = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Icon name="library-outline" size={20} color="#60A5FA" />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Үгийн сан</Text>
          <Text style={styles.heroDesc}>Солонгос үгийн жагсаалт, утга тайлбартай</Text>
        </View>
      </View>

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

      {hasLoadedWords && !isLoading && !error && words.length > 0 && (
        <View style={styles.countRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="hourglass-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Ачааллаж байна...</Text>
          <Text style={styles.stateDesc}>Эхний {PAGE_SIZE} үгийг бэлдэж байна.</Text>
        </View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (!isLoading && error) {
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

    if (hasLoadedWords && !isLoading && !error && words.length === 0) {
      return (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="search-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Үг олдсонгүй</Text>
          <Text style={styles.stateDesc}>
            {query.trim() ? `"${query}" гэсэн үг олдсонгүй. Өөр үг хайна уу.` : 'Хайх үгээ дээрх талбарт бичнэ үү.'}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (!hasLoadedWords || isLoading || error || !hasMore) {
      return null;
    }

    return (
      <TouchableOpacity
        onPress={() => {
          loadMore().catch(() => undefined);
        }}
        disabled={isLoadingMore}
        activeOpacity={0.75}
        style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonDisabled]}
      >
        <Icon name="chevron-down-outline" size={16} color="#155DFC" />
        <Text style={styles.loadMoreText}>{isLoadingMore ? 'Ачааллаж байна...' : 'Цааш үзэх'}</Text>
      </TouchableOpacity>
    );
  };

  const renderWord = ({ item, index }: { item: DictionaryWord; index: number }) => {
    const levelTheme = item.level != null ? LEVEL_THEME[item.level] : null;

    return (
      <View style={[styles.wordRow, index < words.length - 1 && styles.wordRowBorder]}>
        <View style={styles.wordIconBox}>
          <Icon name="text-outline" size={16} color="#155DFC" />
        </View>
        <View style={styles.wordBody}>
          <View style={styles.wordTitleRow}>
            <Text style={styles.wordKorean}>{item.koreanWord}</Text>
            {levelTheme && (
              <View style={[styles.levelBadge, { backgroundColor: levelTheme.bg }]}>
                <Text style={[styles.levelBadgeText, { color: levelTheme.color }]}>{levelTheme.label}</Text>
              </View>
            )}
          </View>
          {!!item.mongolianMeaning && <Text style={styles.wordMeaning}>{item.mongolianMeaning}</Text>}
          {!!item.exampleSentence && (
            <View style={styles.exampleWrap}>
              <Icon name="chatbubble-outline" size={11} color="#94A3B8" style={styles.exampleIcon} />
              <Text style={styles.wordExample}>{item.exampleSentence}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={listData}
      keyExtractor={(item) => item.id}
      renderItem={renderWord}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={14}
      maxToRenderPerBatch={16}
      windowSize={7}
      removeClippedSubviews
      onEndReached={() => {
        if (hasMore && !isLoadingMore && !isLoading && !error) {
          loadMore().catch(() => undefined);
        }
      }}
      onEndReachedThreshold={0.35}
    />
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 12,
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 15, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.2 },
  heroDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },

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
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 2 },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  countText: { fontSize: 13, fontWeight: '700', color: '#374151' },

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
  errorIconBox: { backgroundColor: '#FEF2F2' },
  errorText: { color: '#EF4444' },
  stateTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  stateDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
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
  wordKorean: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  levelBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  levelBadgeText: { fontSize: 10, fontWeight: '700' },
  wordMeaning: { fontSize: 14, color: '#374151', fontWeight: '500', lineHeight: 20 },
  exampleWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 2 },
  exampleIcon: { marginTop: 2 },
  wordExample: { flex: 1, fontSize: 12, color: '#94A3B8', lineHeight: 18, fontStyle: 'italic' },

  loadMoreButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadMoreButtonDisabled: { opacity: 0.65 },
  loadMoreText: { color: '#155DFC', fontSize: 13, fontWeight: '800' },
});

export default Dictionary;
