import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AppText from '../../../shared/components/atoms/AppText';
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

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  article: { label: 'Нийтлэл', icon: 'document-text-outline', color: '#155DFC', bg: '#EFF6FF' },
  book:    { label: 'Ном',     icon: 'book-outline',          color: '#059669', bg: '#ECFDF5' },
  pdf:     { label: 'PDF',     icon: 'document-outline',      color: '#EA580C', bg: '#FFF7ED' },
  quiz:    { label: 'Quiz',    icon: 'help-circle-outline',   color: '#8B5CF6', bg: '#F5F3FF' },
};

const getTypeMeta = (contentType: string) =>
  TYPE_META[contentType] ?? { label: contentType, icon: 'ellipse-outline', color: '#6B7280', bg: '#F3F4F6' };

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <View style={styles.levelPill}>
            <View style={styles.levelDot} />
            <AppText style={styles.levelLabel}>{level}</AppText>
          </View>
          <AppText style={styles.heroTitle}>{title}</AppText>
          <AppText style={styles.heroSubtitle}>{subtitle}</AppText>
        </View>
        <Image source={image} style={styles.heroImage} resizeMode="contain" />
      </View>

      {/* Points */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <AppText style={styles.sectionTitle}>Энэ хэсэгт үзэх зүйлс</AppText>
        </View>
        {points.map((point, index) => (
          <View key={point} style={styles.pointRow}>
            <View style={styles.pointNum}>
              <AppText style={styles.pointNumText}>{index + 1}</AppText>
            </View>
            <AppText style={styles.pointText}>{point}</AppText>
          </View>
        ))}
      </View>

      {/* Lessons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <AppText style={styles.sectionTitle}>Хичээлийн агуулга</AppText>
        </View>

        {isLoading ? (
          <View style={styles.stateRow}>
            <Icon name="hourglass-outline" size={20} color="#94A3B8" />
            <AppText tone="secondary" style={styles.stateText}>
              Хичээлүүд ачаалж байна...
            </AppText>
          </View>
        ) : null}

        {!isLoading && error ? (
          <View style={styles.stateRow}>
            <Icon name="alert-circle-outline" size={20} color="#EF4444" />
            <AppText tone="danger" style={styles.stateText}>
              {error}
            </AppText>
          </View>
        ) : null}

        {!isLoading && !error && lessons.length === 0 ? (
          <View style={styles.stateRow}>
            <Icon name="folder-open-outline" size={20} color="#94A3B8" />
            <AppText tone="secondary" style={styles.stateText}>
              Энэ ангилалд хичээлийн өгөгдөл алга байна.
            </AppText>
          </View>
        ) : null}

        {!isLoading &&
          !error &&
          lessons.map((lesson, index) => {
            const meta = getTypeMeta(lesson.contentType);
            const canOpen = !!lesson.contentUrl;

            return (
              <Pressable
                key={lesson.id}
                onPress={() => void handleOpenContent(lesson.contentUrl)}
                disabled={!canOpen}
                style={({ pressed }) => [
                  styles.lessonCard,
                  !canOpen && styles.lessonCardDisabled,
                  pressed && canOpen && styles.lessonCardPressed,
                ]}
              >
                <View style={styles.lessonNum}>
                  <AppText style={styles.lessonNumText}>{index + 1}</AppText>
                </View>

                <View style={styles.lessonBody}>
                  <AppText style={styles.lessonTitle}>{lesson.title}</AppText>
                  {lesson.description ? (
                    <AppText tone="secondary" style={styles.lessonDesc}>
                      {lesson.description}
                    </AppText>
                  ) : null}
                  <View style={styles.lessonMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                      <Icon name={meta.icon} size={11} color={meta.color} />
                      <AppText style={[styles.typeText, { color: meta.color }]}>
                        {meta.label}
                      </AppText>
                    </View>
                    <AppText style={styles.lessonLevel}>{lesson.level || level}</AppText>
                  </View>
                </View>

                {canOpen ? (
                  <View style={styles.openBtn}>
                    <Icon name="arrow-forward" size={16} color="#155DFC" />
                  </View>
                ) : (
                  <Icon name="lock-closed-outline" size={16} color="#CBD5E1" style={styles.lockIcon} />
                )}
              </Pressable>
            );
          })}
      </View>
    </ScrollView>
  );
};

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
    overflow: 'hidden',
  },
  heroText: {
    flex: 1,
    paddingRight: 12,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  heroImage: {
    width: 88,
    height: 88,
  },

  /* Section */
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#155DFC',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  /* Points */
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  pointNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#155DFC',
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 22,
  },

  /* State */
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  stateText: {
    fontSize: 13,
    color: '#94A3B8',
  },

  /* Lesson cards */
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lessonCardDisabled: {
    opacity: 0.6,
  },
  lessonCardPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  lessonNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#155DFC',
  },
  lessonBody: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  lessonDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lessonLevel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  openBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    marginRight: 6,
  },
});

export default LessonDetailTemplate;
