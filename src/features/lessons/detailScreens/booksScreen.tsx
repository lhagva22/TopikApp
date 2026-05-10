import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AppText from '../../../shared/components/atoms/AppText';
import { getErrorMessage } from '../../../shared/lib/errors';
import { lessonApi, type LessonContent } from '../api/lessonApi';

const sanitizeUrl = (url?: string | null) => {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const BooksScreen = () => {
  const [books, setBooks] = useState<LessonContent[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await lessonApi.getLessonsByCategory('books');

        if (!response.success) {
          throw new Error(response.error || 'Номын жагсаалт ачаалах боломжгүй байна.');
        }

        if (!isMounted) {
          return;
        }

        const nextBooks = (response.lessons || []).filter(
          item => item.contentType === 'book' || item.contentType === 'pdf' || Boolean(item.contentUrl),
        );

        setBooks(nextBooks);
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, 'Номын жагсаалт ачаалах үед алдаа гарлаа.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBooks();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return books;
    }

    return books.filter(book => {
      const title = book.title.toLowerCase();
      const description = book.description.toLowerCase();
      const level = (book.level || '').toLowerCase();

      return (
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        level.includes(normalizedQuery)
      );
    });
  }, [books, searchQuery]);

  const handleOpenBook = async (book: LessonContent) => {
    const url = sanitizeUrl(book.contentUrl);
    if (!url) {
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.searchRow}>
        <Icon name="search-outline" size={22} color="#6b7280" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Хайх ном"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />
      </View>

      {isLoading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color="#2563eb" />
          <AppText tone="secondary" style={styles.stateText}>
            Номын жагсаалт ачаалж байна...
          </AppText>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.stateWrap}>
          <AppText tone="danger">{error}</AppText>
        </View>
      ) : null}

      {!isLoading && !error && filteredBooks.length === 0 ? (
        <View style={styles.stateWrap}>
          <AppText tone="secondary">
            {searchQuery ? 'Хайлтад тохирох ном олдсонгүй.' : 'Номын мэдээлэл алга байна.'}
          </AppText>
        </View>
      ) : null}

      {!isLoading &&
        !error &&
        filteredBooks.map(book => {
          const thumbnailUrl = sanitizeUrl(book.thumbnailUrl);
          const hasBrokenImage = brokenImages[book.id];
          const canOpen = Boolean(sanitizeUrl(book.contentUrl));

          return (
            <View key={book.id} style={styles.bookCard}>
              <Pressable
                onPress={() => void handleOpenBook(book)}
                disabled={!canOpen}
                style={[styles.bookHeader, !canOpen && styles.bookHeaderDisabled]}
              >
                <View style={styles.thumbnailWrap}>
                  {thumbnailUrl && !hasBrokenImage ? (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                      onError={() =>
                        setBrokenImages(current => ({
                          ...current,
                          [book.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <View style={styles.thumbnailFallback}>
                      <Icon name="book-outline" size={28} color="#9ca3af" />
                    </View>
                  )}
                </View>

                <View style={styles.bookInfo}>
                  <AppText variant="section" style={styles.bookTitle}>
                    {book.title}
                  </AppText>
                  {book.description ? (
                    <AppText tone="secondary" style={styles.bookDescription}>
                      {book.description}
                    </AppText>
                  ) : null}
                  {book.level ? (
                    <AppText tone="secondary" style={styles.bookLevel}>
                      {book.level}
                    </AppText>
                  ) : null}
                </View>

                <Icon name="chevron-forward-outline" size={22} color="#9ca3af" />
              </Pressable>
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2f7',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 18,
    minHeight: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 18,
    color: '#111827',
    paddingVertical: 0,
  },
  stateWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  stateText: {
    marginTop: 10,
  },
  bookCard: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 14,
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookHeaderDisabled: {
    opacity: 0.65,
  },
  thumbnailWrap: {
    width: 78,
    height: 110,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  bookInfo: {
    flex: 1,
    paddingRight: 12,
  },
  bookTitle: {
    color: '#111827',
    marginBottom: 6,
  },
  bookDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
  },
  bookLevel: {
    marginTop: 8,
    color: '#94a3b8',
  },
});

export default BooksScreen;
