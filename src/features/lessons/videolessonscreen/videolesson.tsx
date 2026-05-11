import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Video from 'react-native-video/lib/index';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppStore } from '../../../app/store';
import { PaymentScreen as Payment, usePaymentModal } from '../../../features/payment';
import AppText from '../../../shared/components/atoms/AppText';
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
  if (normalized.includes('topik ii')) return 'Дунд шат';
  if (normalized.includes('grammar') || normalized.includes('дүрэм')) return 'Бүх шат';
  return 'Анхан шат';
};

const getBadgeLabel = (lesson: VideoLesson) => {
  if (lesson.category?.title) return lesson.category.title;
  if ((lesson.level || '').toUpperCase().includes('TOPIK II')) return 'TOPIK II';
  return 'TOPIK I';
};

const Videolesson = () => {
  const navigation = useNavigation<any>();
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

        if (!categoriesResponse.success) throw new Error(categoriesResponse.error || 'Видео ангилал ачаалах боломжгүй байна.');
        if (!lessonsResponse.success) throw new Error(lessonsResponse.error || 'Видео хичээл ачааллах боломжгүй байна.');

        if (isMounted) {
          setCategories(categoriesResponse.categories || []);
          setLessons((lessonsResponse.lessons || []).filter((item) => Boolean(item.contentUrl)));
        }
      } catch (error) {
        if (isMounted) setLoadError(getErrorMessage(error, 'Видео хичээл ачааллах үед алдаа гарлаа.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadVideoData().catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  const filteredLessons = useMemo(() => {
    if (selectedCategorySlug === 'all') return lessons;
    return lessons.filter((lesson) => lesson.category?.slug === selectedCategorySlug);
  }, [lessons, selectedCategorySlug]);

  const groupedLessons = useMemo<VideoLessonGroup[]>(() => {
    const categoryMap = new Map<string, VideoLessonGroup>(
      categories.map((cat) => [cat.id, { category: cat, lessons: [] as VideoLesson[] }]),
    );
    const uncategorized: VideoLesson[] = [];

    filteredLessons.forEach((lesson) => {
      const catId = lesson.category?.id;
      if (catId && categoryMap.has(catId)) { categoryMap.get(catId)?.lessons.push(lesson); return; }
      uncategorized.push(lesson);
    });

    const groups = Array.from(categoryMap.values()).filter((g) => g.lessons.length > 0);
    if (uncategorized.length > 0) groups.push({ category: null, lessons: uncategorized });
    return groups;
  }, [categories, filteredLessons]);

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
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color="#155DFC" />
            <AppText tone="secondary" style={styles.stateText}>Видео хичээл ачаалж байна...</AppText>
          </View>
        ) : null}

        {!isLoading && loadError ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={24} color="#EF4444" />
            <AppText tone="danger" style={styles.stateText}>{loadError}</AppText>
          </View>
        ) : null}

        {!isLoading && !loadError && categories.length > 0 ? (
          <VideoCategoryFilter
            categories={categories}
            selectedSlug={selectedCategorySlug}
            onSelect={setSelectedCategorySlug}
          />
        ) : null}

        {!isLoading && !loadError && filteredLessons.length === 0 ? (
          <View style={styles.stateBox}>
            <Icon name="videocam-off-outline" size={36} color="#CBD5E1" />
            <AppText tone="secondary" style={styles.stateText}>
              {selectedCategorySlug === 'all' ? 'Видео хичээл олдсонгүй' : 'Энэ ангилалд видео хичээл олдсонгүй.'}
            </AppText>
          </View>
        ) : null}

        {!isLoading && !loadError && groupedLessons.map((group) => (
          <View key={group.category?.id || 'uncategorized'} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={styles.groupAccent} />
              <View style={styles.groupHeaderText}>
                <Text style={styles.groupTitle}>{group.category?.title || 'Бусад видео'}</Text>
                {group.category?.description ? (
                  <Text style={styles.groupDesc}>{group.category.description}</Text>
                ) : null}
              </View>
              <View style={styles.groupCount}>
                <Text style={styles.groupCountText}>{group.lessons.length}</Text>
              </View>
            </View>

            {group.lessons.map((video) => (
              <ProtectedTouchable
                key={video.id}
                requiredStatus="paid"
                onPress={() => handleVideoPress(video)}
                onPaymentRequired={openPayment}
                activeOpacity={0.82}
                style={styles.cardWrapper}
              >
                <View style={styles.card}>
                  <View style={styles.thumbnail}>
                    <Video
                      source={{ uri: video.contentUrl }}
                      style={StyleSheet.absoluteFillObject}
                      paused={true}
                      muted={true}
                      resizeMode="cover"
                    />
                    <View style={styles.playOverlay}>
                      <View style={styles.playCircle}>
                        <Icon name="play" size={20} color="#fff" />
                      </View>
                    </View>
                    {!isPaidUser() && (
                      <View style={styles.lockBadge}>
                        <Icon name="lock-closed" size={10} color="#fff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                    {video.description ? (
                      <Text style={styles.videoDesc} numberOfLines={2}>{video.description}</Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <View style={styles.levelChip}>
                        <Icon name="school-outline" size={11} color="#155DFC" />
                        <Text style={styles.levelChipText}>{getLessonLevel(video)}</Text>
                      </View>
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>{getBadgeLabel(video)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ProtectedTouchable>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Video player modal */}
      <Modal animationType="slide" visible={Boolean(selectedVideo)} onRequestClose={closePlayer}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalMeta}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedVideo?.title ?? 'Видео'}
              </Text>
              {selectedVideo?.description ? (
                <Text style={styles.modalSubtitle} numberOfLines={2}>
                  {selectedVideo.description}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closePlayer} activeOpacity={0.7}>
              <Icon name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.playerWrap}>
            {selectedVideo ? (
              <Video
                source={{ uri: selectedVideo.contentUrl }}
                style={styles.player}
                controls={true}
                resizeMode="contain"
                paused={false}
                onError={() => setVideoError('Видео ачааллах үед алдаа гарлаа. Link хугацаа дууссан эсэхийг шалгана уу.')}
              />
            ) : null}
          </View>

          {videoError ? (
            <View style={styles.videoErrorBox}>
              <Icon name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.videoErrorText}>{videoError}</Text>
            </View>
          ) : null}
        </View>
      </Modal>

      <Payment
        visible={showPayment}
        onClose={closePayment}
        onSelectPlan={(item) => {
          navigation.navigate('PaymentCheckout', {
            planId: item.id, planTitle: item.title, planPrice: item.price, planMonths: item.months,
          });
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },

  /* States */
  stateBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  stateText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 12 },

  /* Group */
  group: { marginBottom: 24 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupAccent: { width: 4, height: 36, borderRadius: 2, backgroundColor: '#155DFC' },
  groupHeaderText: { flex: 1 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  groupDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  groupCount: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  groupCountText: { fontSize: 12, fontWeight: '700', color: '#155DFC' },

  /* Video card */
  cardWrapper: {
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnail: {
    width: 110,
    height: 96,
    backgroundColor: '#0F172A',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  videoDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelChipText: { fontSize: 11, fontWeight: '600', color: '#155DFC' },
  badgePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePillText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  /* Modal */
  modal: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  modalMeta: { flex: 1 },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 13, color: '#94A3B8', lineHeight: 18 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerWrap: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  player: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  videoErrorText: { fontSize: 13, color: '#EF4444', flex: 1 },
});

export default Videolesson;
