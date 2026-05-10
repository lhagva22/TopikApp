import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Video from 'react-native-video/lib/index';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppStore } from '../../../app/store';
import { PaymentScreen as Payment, usePaymentModal } from '../../../features/payment';
import AppText from '../../../shared/components/atoms/AppText';
import { Card, CardTitle } from '../../../shared/components/molecules/card';
import { ProtectedTouchable } from '../../../shared/components/molecules/protectedTouchable';
import { getErrorMessage } from '../../../shared/lib/errors';
import { lessonApi, type VideoCategorySummary, type VideoLesson } from '../api/lessonApi';
import VideoCategoryFilter from './VideoCategoryFilter';

type VideoLessonGroup = {
  category: VideoCategorySummary | null;
  lessons: VideoLesson[];
};

const getLessonLevel = (lesson: VideoLesson) => {
  const normalized = `${lesson.level || ''} ${lesson.title} ${lesson.description}`.toLowerCase();

  if (normalized.includes('topik ii')) {
    return 'Дунд шат';
  }

  if (normalized.includes('grammar') || normalized.includes('дүрэм')) {
    return 'Бүх шат';
  }

  return 'Анхан шат';
};

const getBadgeLabel = (lesson: VideoLesson) => {
  if (lesson.category?.title) {
    return lesson.category.title;
  }

  if ((lesson.level || '').toUpperCase().includes('TOPIK II')) {
    return 'TOPIK II';
  }

  return 'TOPIK I';
};

const Videolesson = () => {
  const { isPaidUser } = useAppStore();
  const { showPayment, openPayment, closePayment } = usePaymentModal();
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [categories, setCategories] = useState<VideoCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadVideoData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [categoriesResponse, lessonsResponse] = await Promise.all([
          lessonApi.getVideoCategories(),
          lessonApi.getVideoLessons(),
        ]);

        if (!categoriesResponse.success) {
          throw new Error(categoriesResponse.error || 'Видео ангилал ачаалах боломжгүй байна.');
        }

        if (!lessonsResponse.success) {
          throw new Error(lessonsResponse.error || 'Видео хичээл ачааллах боломжгүй байна.');
        }

        if (isMounted) {
          setCategories(categoriesResponse.categories || []);
          setLessons((lessonsResponse.lessons || []).filter((item) => Boolean(item.contentUrl)));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Видео хичээл ачааллах үед алдаа гарлаа.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadVideoData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLessons = useMemo(() => {
    if (selectedCategorySlug === 'all') {
      return lessons;
    }

    return lessons.filter((lesson) => lesson.category?.slug === selectedCategorySlug);
  }, [lessons, selectedCategorySlug]);

  const groupedLessons = useMemo<VideoLessonGroup[]>(() => {
    const categoryMap = new Map<string, VideoLessonGroup>(
      categories.map((category) => [category.id, { category, lessons: [] as VideoLesson[] }]),
    );
    const uncategorized: VideoLesson[] = [];

    filteredLessons.forEach((lesson) => {
      const categoryId = lesson.category?.id;
      if (categoryId && categoryMap.has(categoryId)) {
        categoryMap.get(categoryId)?.lessons.push(lesson);
        return;
      }

      uncategorized.push(lesson);
    });

    const groups: VideoLessonGroup[] = Array.from(categoryMap.values()).filter(
      (group) => group.lessons.length > 0,
    );

    if (uncategorized.length > 0) {
      groups.push({
        category: null,
        lessons: uncategorized,
      });
    }

    return groups;
  }, [categories, filteredLessons]);

  const hasVideos = useMemo(() => filteredLessons.length > 0, [filteredLessons]);

  const handleVideoPress = (video: VideoLesson) => {
    setVideoError(null);
    setSelectedVideo(video);
  };

  const closePlayer = () => {
    setSelectedVideo(null);
    setVideoError(null);
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <Card style={styles.stateCard}>
            <ActivityIndicator size="small" color="#2563eb" />
            <AppText tone="secondary" style={styles.stateText}>
              Видео хичээл ачаалж байна...
            </AppText>
          </Card>
        ) : null}

        {!isLoading && loadError ? (
          <Card style={styles.errorCard}>
            <AppText tone="danger">{loadError}</AppText>
          </Card>
        ) : null}

        {!isLoading && !loadError && categories.length > 0 ? (
          <VideoCategoryFilter
            categories={categories}
            selectedSlug={selectedCategorySlug}
            onSelect={setSelectedCategorySlug}
          />
        ) : null}

        {!isLoading && !loadError && !hasVideos ? (
          <Card style={styles.emptyCard}>
            <AppText variant="section">Видео хичээл олдсонгүй</AppText>
            <AppText tone="secondary" style={styles.emptyText}>
              {selectedCategorySlug === 'all'
                ? '`video_lessons` болон `video_categories` хүснэгтэд өгөгдөл нэмсний дараа энд харагдана.'
                : 'Энэ ангилалд видео хичээл олдсонгүй.'}
            </AppText>
          </Card>
        ) : null}

        {!isLoading &&
          !loadError &&
          groupedLessons.map((group) => (
            <View key={group.category?.id || 'uncategorized'} style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <AppText variant="section" style={styles.groupTitle}>
                  {group.category?.title || 'Бусад видео'}
                </AppText>
                {group.category?.description ? (
                  <AppText tone="secondary" style={styles.groupDescription}>
                    {group.category.description}
                  </AppText>
                ) : null}
              </View>

              {group.lessons.map((video) => (
                <ProtectedTouchable
                  key={video.id}
                  requiredStatus="paid"
                  onPress={() => handleVideoPress(video)}
                  onPaymentRequired={openPayment}
                >
                  <Card style={styles.card}>
                    <View style={styles.cardContent}>
                      <View style={styles.thumbnail}>
                        <Video
                          source={{ uri: video.contentUrl }}
                          style={styles.thumbnailVideo}
                          paused={true}
                          muted={true}
                          resizeMode="cover"
                        />
                        {(!isPaidUser() || video.isPremium) && (
                          <Icon
                            name="lock-closed-outline"
                            size={16}
                            color="#0f172a"
                            style={styles.lockIcon}
                          />
                        )}
                        <View style={styles.playOverlay}>
                          <View style={styles.playCircle}>
                            <Icon name="play" size={30} color="#fff" />
                          </View>
                        </View>
                      </View>

                      <View style={styles.infoContainer}>
                        <CardTitle variant="large" style={styles.videoTitle}>
                          {video.title}
                        </CardTitle>
                        <AppText tone="secondary" style={styles.videoDescription}>
                          {video.description}
                        </AppText>

                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Icon name="school-outline" size={16} color="#2563eb" />
                            <CardTitle variant="small" style={styles.metaText}>
                              {' '}
                              {getLessonLevel(video)}
                            </CardTitle>
                          </View>
                          <View style={styles.levelBadge}>
                            <CardTitle variant="small" style={styles.levelText}>
                              {getBadgeLabel(video)}
                            </CardTitle>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Card>
                </ProtectedTouchable>
              ))}
            </View>
          ))}
      </ScrollView>

      <Modal animationType="slide" visible={Boolean(selectedVideo)} onRequestClose={closePlayer}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <AppText variant="section" style={styles.modalTitle}>
                {selectedVideo?.title ?? 'Видео'}
              </AppText>
              {selectedVideo?.description ? (
                <AppText tone="secondary" style={styles.modalSubtitle}>
                  {selectedVideo.description}
                </AppText>
              ) : null}
            </View>

            <Pressable onPress={closePlayer} style={styles.closeButton}>
              <Icon name="close" size={24} color="#0f172a" />
            </Pressable>
          </View>

          <View style={styles.playerCard}>
            {selectedVideo ? (
              <Video
                source={{ uri: selectedVideo.contentUrl }}
                style={styles.videoPlayer}
                controls={true}
                resizeMode="contain"
                paused={false}
                onError={() => {
                  setVideoError('Видео ачааллах үед алдаа гарлаа. Link хугацаа дууссан эсэхийг шалгана уу.');
                }}
              />
            ) : null}
          </View>

          {videoError ? (
            <Card style={styles.errorCard}>
              <AppText tone="danger">{videoError}</AppText>
            </Card>
          ) : null}
        </View>
      </Modal>

      <Payment visible={showPayment} onClose={closePayment} />
    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  groupSection: {
    marginBottom: 22,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupTitle: {
    color: '#0f172a',
  },
  groupDescription: {
    marginTop: 4,
  },
  emptyCard: {
    paddingVertical: 24,
  },
  stateCard: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  stateText: {
    marginTop: 10,
  },
  emptyText: {
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    marginBottom: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 108,
    height: 92,
    borderRadius: 18,
    marginRight: 14,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  lockIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  infoContainer: {
    flex: 1,
  },
  videoTitle: {
    color: '#0f172a',
  },
  videoDescription: {
    marginTop: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#2563eb',
  },
  levelBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelText: {
    color: '#1d4ed8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 22,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  modalTitle: {
    color: '#0f172a',
  },
  modalSubtitle: {
    marginTop: 4,
    lineHeight: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCard: {
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  errorCard: {
    marginTop: 16,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
});

export default Videolesson;
