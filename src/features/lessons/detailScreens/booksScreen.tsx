import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { getErrorMessage } from '../../../shared/lib/errors';
import { lessonApi, type LessonContent } from '../api/lessonApi';

const sanitizeUrl = (url?: string | null) => {
  const trimmed = url?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const LEVEL_THEME: Record<string, { color: string; bg: string }> = {
  'topik i':  { color: '#059669', bg: '#ECFDF5' },
  'topik ii': { color: '#8B5CF6', bg: '#F5F3FF' },
  'beginner': { color: '#059669', bg: '#ECFDF5' },
  'intermediate': { color: '#F59E0B', bg: '#FFFBEB' },
  'advanced': { color: '#8B5CF6', bg: '#F5F3FF' },
};

const getLevelTheme = (level?: string) => {
  if (!level) return null;
  return LEVEL_THEME[level.toLowerCase()] ?? { color: '#155DFC', bg: '#EFF6FF' };
};

const BooksScreen = () => {
  const [books, setBooks] = useState<LessonContent[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await lessonApi.getLessonsByCategory('books');
        if (!response.success) throw new Error(response.error || 'Номын жагсаалт ачаалах боломжгүй байна.');
        if (!isMounted) return;
        const next = (response.lessons || []).filter(
          (item) => item.contentType === 'book' || item.contentType === 'pdf' || Boolean(item.contentUrl),
        );
        setBooks(next);
      } catch (e) {
        if (isMounted) setError(getErrorMessage(e, 'Номын жагсаалт ачаалах үед алдаа гарлаа.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) =>
      `${b.title} ${b.description} ${b.level ?? ''}`.toLowerCase().includes(q),
    );
  }, [books, searchQuery]);

  const handleOpenBook = async (book: LessonContent) => {
    const url = sanitizeUrl(book.contentUrl);
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

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
        <Text style={styles.heroTitle}>Ном сурах бичиг</Text>
        <Text style={styles.heroDesc}>TOPIK бэлтгэлд зориулсан ном, гарын авлагууд</Text>
      </View>

      {/* Search */}
      <View style={styles.searchCard}>
        <View style={styles.searchIconBox}>
          <Icon name="search-outline" size={18} color="#8B5CF6" />
        </View>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Ном хайх..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Icon name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      {!isLoading && !error && (
        <View style={styles.countRow}>
          <View style={styles.accent} />
          <Text style={styles.countText}>
            {searchQuery.trim()
              ? `"${searchQuery}" — ${filteredBooks.length} ном`
              : `Нийт ${books.length} ном`}
          </Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="hourglass-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Ачааллаж байна...</Text>
          <Text style={styles.stateDesc}>Номын жагсаалт татаж байна.</Text>
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
      {!isLoading && !error && filteredBooks.length === 0 && (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="book-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Ном олдсонгүй</Text>
          <Text style={styles.stateDesc}>
            {searchQuery.trim()
              ? `"${searchQuery}" тохирох ном олдсонгүй.`
              : 'Номын мэдээлэл байхгүй байна.'}
          </Text>
        </View>
      )}

      {/* Book cards */}
      {!isLoading && !error && filteredBooks.length > 0 && (
        <View style={styles.cardList}>
          {filteredBooks.map((book) => {
            const thumbnailUrl = sanitizeUrl(book.thumbnailUrl);
            const hasBrokenImage = brokenImages[book.id];
            const canOpen = Boolean(sanitizeUrl(book.contentUrl));
            const levelTheme = getLevelTheme(book.level);

            return (
              <TouchableOpacity
                key={book.id}
                onPress={() => void handleOpenBook(book)}
                disabled={!canOpen}
                activeOpacity={0.75}
                style={[styles.bookCard, !canOpen && styles.bookCardDisabled]}
              >
                {/* Thumbnail */}
                <View style={styles.thumbWrap}>
                  {thumbnailUrl && !hasBrokenImage ? (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      style={styles.thumb}
                      resizeMode="cover"
                      onError={() =>
                        setBrokenImages((cur) => ({ ...cur, [book.id]: true }))
                      }
                    />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Icon name="book-outline" size={26} color="#94A3B8" />
                    </View>
                  )}
                  {book.contentType === 'pdf' && (
                    <View style={styles.pdfBadge}>
                      <Text style={styles.pdfBadgeText}>PDF</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                  {!!book.description && (
                    <Text style={styles.bookDesc} numberOfLines={2}>{book.description}</Text>
                  )}
                  {levelTheme && !!book.level && (
                    <View style={[styles.levelBadge, { backgroundColor: levelTheme.bg }]}>
                      <Text style={[styles.levelBadgeText, { color: levelTheme.color }]}>
                        {book.level}
                      </Text>
                    </View>
                  )}
                  {!canOpen && (
                    <View style={styles.unavailableBadge}>
                      <Icon name="lock-closed-outline" size={10} color="#94A3B8" />
                      <Text style={styles.unavailableText}>Боломжгүй</Text>
                    </View>
                  )}
                </View>

                <Icon name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
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
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500', paddingVertical: 0 },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  accent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#8B5CF6' },
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
  stateTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  stateDesc:  { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  cardList: { gap: 10 },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bookCardDisabled: { opacity: 0.55 },

  thumbWrap: {
    width: 70,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pdfBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pdfBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  bookInfo: { flex: 1, gap: 5 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  bookDesc:  { fontSize: 12, color: '#64748B', lineHeight: 17 },

  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  levelBadgeText: { fontSize: 10, fontWeight: '700' },

  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  unavailableText: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
});

export default BooksScreen;
