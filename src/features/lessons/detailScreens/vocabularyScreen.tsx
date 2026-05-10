import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AppText from '../../../shared/components/atoms/AppText';
import { Card } from '../../../shared/components/molecules/card';
import { getErrorMessage } from '../../../shared/lib/errors';
import { lessonApi, type LessonContent } from '../api/lessonApi';

const VocabularyScreen = () => {
  const [query, setQuery] = useState('');
  const [lessons, setLessons] = useState<LessonContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadVocabularyLessons = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await lessonApi.getLessonsByCategory('vocabulary');

        if (!response.success) {
          throw new Error(response.error || 'Үгийн сангийн өгөгдөл ачаалах боломжгүй байна.');
        }

        if (isMounted) {
          setLessons(response.lessons || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, 'Үгийн сангийн өгөгдөл ачаалах үед алдаа гарлаа.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadVocabularyLessons();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLessons = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return lessons;
    }

    return lessons.filter((lesson) =>
      `${lesson.title} ${lesson.description}`.toLowerCase().includes(normalized),
    );
  }, [lessons, query]);

  const handleOpenLesson = async (lesson: LessonContent) => {
    if (!lesson.contentUrl) {
      return;
    }

    const supported = await Linking.canOpenURL(lesson.contentUrl);
    if (supported) {
      await Linking.openURL(lesson.contentUrl);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={22} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Хайх үг"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.headerStrip}>
        <AppText variant="section" style={styles.headerText}>
          Бүх шат - {lessons.length} үг, сэдэв
        </AppText>
      </View>

      <Card style={styles.listCard}>
        {isLoading ? (
          <AppText tone="secondary" style={styles.stateText}>
            Үгийн сан ачаалж байна...
          </AppText>
        ) : null}

        {!isLoading && error ? (
          <AppText tone="danger" style={styles.stateText}>
            {error}
          </AppText>
        ) : null}

        {!isLoading && !error && filteredLessons.length === 0 ? (
          <AppText tone="secondary" style={styles.stateText}>
            Хайлтанд тохирох үгийн сан олдсонгүй.
          </AppText>
        ) : null}

        {!isLoading &&
          !error &&
          filteredLessons.map((lesson) => (
            <Pressable
              key={lesson.id}
              onPress={() => void handleOpenLesson(lesson)}
              style={styles.vocabularyRow}
            >
              <Icon name="book-outline" size={20} color="#cbd5e1" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <AppText style={styles.rowTitle}>{lesson.title}</AppText>
                {lesson.description ? (
                  <AppText tone="secondary" style={styles.rowDescription}>
                    {lesson.description}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          ))}
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
    paddingBottom: 24,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#edf3fb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: '#334155',
    paddingVertical: 0,
  },
  headerStrip: {
    backgroundColor: '#e9eff8',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 4,
  },
  headerText: {
    color: '#111827',
  },
  listCard: {
    marginHorizontal: 0,
    borderRadius: 0,
    backgroundColor: '#ffffff',
    paddingVertical: 0,
  },
  stateText: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  vocabularyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  rowIcon: {
    marginTop: 3,
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 24,
  },
  rowDescription: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
  },
});

export default VocabularyScreen;
