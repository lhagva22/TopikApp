import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { PaymentScreen as Payment, usePaymentModal } from '../../../features/payment';
import AppText from '../../../shared/components/atoms/AppText';
import { ProtectedTouchable } from '../../../shared/components/molecules/protectedTouchable';
import { getErrorMessage } from '../../../shared/lib/errors';
import { lessonApi, type LessonCategorySummary } from '../api/lessonApi';
import {
  lessonCategorySlugMap,
  type LessonCategoryRoute,
  type LessonCategorySlug,
} from '../lessonCategories';

type DisplayLessonCategory = LessonCategorySummary & {
  route: LessonCategoryRoute;
  image: any;
};

const CATEGORY_COLORS: Record<string, string> = {
  'alphabet-numbers': '#8B5CF6',
  grammar: '#155DFC',
  vocabulary: '#059669',
  books: '#EA580C',
};

const CATEGORY_BG: Record<string, string> = {
  'alphabet-numbers': '#F5F3FF',
  grammar: '#EFF6FF',
  vocabulary: '#ECFDF5',
  books: '#FFF7ED',
};

const LessonScreen = () => {
  const navigation = useNavigation<any>();
  const { showPayment, openPayment, closePayment } = usePaymentModal();
  const [categories, setCategories] = useState<DisplayLessonCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await lessonApi.getLessonCategories();

        if (!response.success) {
          throw new Error(response.error || 'Хичээлийн ангилал ачаалах боломжгүй байна.');
        }

        const mapped = (response.categories || [])
          .map((item) => {
            const meta = lessonCategorySlugMap[item.slug as LessonCategorySlug];
            if (!meta) {
              return null;
            }

            return { ...item, route: meta.route, image: meta.image };
          })
          .filter((item): item is DisplayLessonCategory => Boolean(item));

        if (isMounted) {
          setCategories(mapped);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Хичээлийн ангиллуудыг ачаалах үед алдаа гарлаа.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCategories().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLessonPress = (route: LessonCategoryRoute) => {
    navigation.navigate(route);
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="section" style={styles.pageTitle}>
          Хичээлийн ангилал
        </AppText>
        <AppText tone="secondary" style={styles.pageSubtitle}>
          Суралцах хэсгээ сонгоно уу
        </AppText>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color="#155DFC" />
            <AppText tone="secondary" style={styles.stateText}>
              Ачаалж байна...
            </AppText>
          </View>
        ) : null}

        {!isLoading && loadError ? (
          <View style={styles.stateBox}>
            <Icon name="alert-circle-outline" size={28} color="#EF4444" />
            <AppText tone="danger" style={styles.stateText}>
              {loadError}
            </AppText>
          </View>
        ) : null}

        {!isLoading && !loadError && categories.length === 0 ? (
          <View style={styles.stateBox}>
            <Icon name="book-outline" size={28} color="#9CA3AF" />
            <AppText tone="secondary" style={styles.stateText}>
              Хичээлийн ангилал олдсонгүй
            </AppText>
          </View>
        ) : null}

        {categories.map((item) => {
          const accentColor = CATEGORY_COLORS[item.slug] ?? '#155DFC';
          const cardBg = CATEGORY_BG[item.slug] ?? '#EFF6FF';

          return (
            <ProtectedTouchable
              key={item.slug}
              requiredStatus="paid"
              onPress={() => handleLessonPress(item.route)}
              onPaymentRequired={openPayment}
              activeOpacity={0.82}
              style={styles.cardWrapper}
            >
              <View style={[styles.card, { borderLeftColor: accentColor }]}>
                <View style={[styles.imageBox, { backgroundColor: cardBg }]}>
                  <Image source={item.image} style={styles.image} resizeMode="contain" />
                </View>

                <View style={styles.info}>
                  <AppText style={styles.cardTitle}>{item.title}</AppText>
                  <AppText style={styles.cardDesc}>{item.description}</AppText>
                  <View style={[styles.levelBadge, { backgroundColor: cardBg }]}>
                    <View style={[styles.levelDot, { backgroundColor: accentColor }]} />
                    <AppText style={[styles.levelText, { color: accentColor }]}>
                      {item.level}
                    </AppText>
                  </View>
                </View>

                <View style={styles.arrowBox}>
                  <Icon name="chevron-forward" size={18} color={accentColor} />
                </View>
              </View>
            </ProtectedTouchable>
          );
        })}
      </ScrollView>

      <Payment
        visible={showPayment}
        onClose={closePayment}
        onSelectPlan={(item) => {
          navigation.navigate('PaymentCheckout', {
            planId: item.id,
            planTitle: item.title,
            planPrice: item.price,
            planMonths: item.months,
          });
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
    marginTop: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  stateBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  imageBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  image: {
    width: 44,
    height: 44,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
    gap: 5,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  arrowBox: {
    paddingLeft: 8,
  },
});

export default LessonScreen;
