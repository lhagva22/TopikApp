import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AppText from '../../../shared/components/atoms/AppText';
import { Card, CardTitle } from '../../../shared/components/molecules/card';
import type { LessonContent } from '../api/lessonApi';

type LessonDetailTemplateProps = {
  title: string;
  subtitle: string;
  level: string;
  image: any;
  points: string[];
  lessons: LessonContent[];
  isLoading: boolean;
  error: string | null;
};

const getTypeLabel = (contentType: string) => {
  switch (contentType) {
    case 'article':
      return 'Article';
    case 'book':
      return 'Book';
    case 'pdf':
      return 'PDF';
    case 'quiz':
      return 'Quiz';
    default:
      return contentType;
  }
};

const LessonDetailTemplate = ({
  title,
  subtitle,
  level,
  image,
  points,
  lessons,
  isLoading,
  error,
}: LessonDetailTemplateProps) => {
  const handleOpenContent = async (url: string) => {
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
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroTextWrap}>
            <AppText variant="section" style={styles.title}>
              {title}
            </AppText>
            <AppText tone="secondary" style={styles.subtitle}>
              {subtitle}
            </AppText>
            <View style={styles.levelBadge}>
              <CardTitle variant="small" style={styles.levelText}>
                {level}
              </CardTitle>
            </View>
          </View>

          <Image source={image} style={styles.heroImage} resizeMode="contain" />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <AppText variant="section" style={styles.sectionTitle}>
          Энэ хэсэгт үзэх зүйлс
        </AppText>
        {points.map((point) => (
          <View key={point} style={styles.pointRow}>
            <View style={styles.pointDot} />
            <AppText style={styles.pointText}>{point}</AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <AppText variant="section" style={styles.sectionTitle}>
          Хичээлийн агуулга
        </AppText>

        {isLoading ? (
          <AppText tone="secondary">Хичээлүүд ачаалж байна...</AppText>
        ) : null}

        {!isLoading && error ? <AppText tone="danger">{error}</AppText> : null}

        {!isLoading && !error && lessons.length === 0 ? (
          <AppText tone="secondary">Энэ ангилалд хичээлийн өгөгдөл алга байна.</AppText>
        ) : null}

        {!isLoading &&
          !error &&
          lessons.map((lesson) => (
            <Pressable
              key={lesson.id}
              onPress={() => void handleOpenContent(lesson.contentUrl)}
              disabled={!lesson.contentUrl}
              style={[styles.lessonItem, !lesson.contentUrl && styles.lessonItemDisabled]}
            >
              <View style={styles.lessonHeader}>
                <AppText style={styles.lessonTitle}>{lesson.title}</AppText>
                <View style={styles.lessonBadge}>
                  <CardTitle variant="small" style={styles.lessonBadgeText}>
                    {getTypeLabel(lesson.contentType)}
                  </CardTitle>
                </View>
              </View>

              {lesson.description ? (
                <AppText tone="secondary" style={styles.lessonDescription}>
                  {lesson.description}
                </AppText>
              ) : null}

              <View style={styles.lessonMetaRow}>
                <AppText tone="secondary" style={styles.lessonMeta}>
                  {lesson.level || level}
                </AppText>
                {lesson.contentUrl ? (
                  <View style={styles.openRow}>
                    <AppText style={styles.openText}>Нээх</AppText>
                    <Icon name="open-outline" size={14} color="#2563eb" />
                  </View>
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    marginBottom: 16,
    backgroundColor: '#eff6ff',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },
  levelText: {
    color: '#1d4ed8',
  },
  heroImage: {
    width: 84,
    height: 84,
  },
  sectionCard: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    color: '#0f172a',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 7,
    marginRight: 10,
  },
  pointText: {
    flex: 1,
    lineHeight: 22,
    color: '#334155',
  },
  lessonItem: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    paddingBottom: 10,
  },
  lessonItemDisabled: {
    opacity: 0.8,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  lessonTitle: {
    flex: 1,
    color: '#0f172a',
  },
  lessonBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lessonBadgeText: {
    color: '#1d4ed8',
  },
  lessonDescription: {
    marginTop: 6,
    lineHeight: 20,
  },
  lessonMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonMeta: {
    color: '#64748b',
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    color: '#2563eb',
  },
});

export default LessonDetailTemplate;
