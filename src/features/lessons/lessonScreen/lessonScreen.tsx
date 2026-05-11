import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { PaymentScreen as Payment, usePaymentModal } from '../../../features/payment';
import AppText from '../../../shared/components/atoms/AppText';
import { Card, CardHeader, CardTitle } from '../../../shared/components/molecules/card';
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

            return {
              ...item,
              route: meta.route,
              image: meta.image,
            };
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {isLoading ? (
          <Card style={styles.stateCard}>
            <ActivityIndicator size="small" color="#2563eb" />
            <AppText tone="secondary" style={styles.stateText}>
              Хичээлийн ангилал ачаалж байна...
            </AppText>
          </Card>
        ) : null}

        {!isLoading && loadError ? (
          <Card style={styles.stateCard}>
            <AppText tone="danger">{loadError}</AppText>
          </Card>
        ) : null}

        {!isLoading && !loadError && categories.length === 0 ? (
          <Card style={styles.stateCard}>
            <AppText variant="section">Хичээлийн ангилал олдсонгүй</AppText>
          </Card>
        ) : null}

        {categories.map((item) => (
          <ProtectedTouchable
            key={item.slug}
            requiredStatus="paid"
            onPress={() => handleLessonPress(item.route)}
            onPaymentRequired={openPayment}
          >
            <Card style={styles.card}>
              <View style={styles.mediaColumn}>
                <Image source={item.image} style={styles.image} />
                <CardTitle style={styles.level}>{item.level}</CardTitle>
              </View>

              <View style={styles.infoColumn}>
                <CardHeader variant="large">{item.title}</CardHeader>
                <CardTitle style={styles.description}>{item.description}</CardTitle>
              </View>
            </Card>
          </ProtectedTouchable>
        ))}
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  stateCard: {
    marginBottom: 14,
    paddingVertical: 20,
    alignItems: 'center',
  },
  stateText: {
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  mediaColumn: {
    width: '20%',
    alignItems: 'center',
    borderRightColor: '#E5E7EB',
    borderRightWidth: 1,
    paddingRight: 16,
  },
  image: {
    width: 50,
    height: 50,
    marginBottom: 16,
  },
  level: {
    textAlign: 'center',
    fontWeight: '300',
  },
  infoColumn: {
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 10,
    color: '#6B7280',
  },
});

export default LessonScreen;
