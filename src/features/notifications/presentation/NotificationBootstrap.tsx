import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppStore } from '../../../app/store';
import { isPaidStatus } from '../../../app/store/accessControl';
import { logError } from '../../../shared/lib/errors';
import { notificationUseCases } from './dependencies';

const PROMPTED_KEY = 'pushNotificationPermissionPrompted';

type ForegroundNotification = {
  title: string;
  body: string;
  type?: string;
};

const requestNotificationAccess = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) return true;
    const alreadyPrompted = await AsyncStorage.getItem(PROMPTED_KEY);
    if (alreadyPrompted) return false;

    await AsyncStorage.setItem(PROMPTED_KEY, 'true');
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, {
      title: 'TOPIK MATE мэдэгдэл',
      message: 'Шинэ хичээл болон шалгалт нэмэгдэхэд мэдэгдэл авахын тулд зөвшөөрнө үү.',
      buttonPositive: 'Зөвшөөрөх',
      buttonNegative: 'Одоо биш',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === 'ios') {
    const status = await requestPermission(getMessaging());
    return status === 1 || status === 2;
  }

  return true;
};

type NotificationBootstrapProps = {
  suppressBanner?: boolean;
};

export function NotificationBootstrap({ suppressBanner = false }: NotificationBootstrapProps) {
  const user = useAppStore(state => state.user);
  const token = useAppStore(state => state.token);
  const insets = useSafeAreaInsets();
  const [notification, setNotification] = useState<ForegroundNotification | null>(null);
  const translateY = useRef(new Animated.Value(-140)).current;

  useEffect(() => {
    if (!token || !isPaidStatus(user)) return;

    const messaging = getMessaging();
    let unsubscribeRefresh: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      const granted = await requestNotificationAccess();
      if (!granted || cancelled) return;

      await registerDeviceForRemoteMessages(messaging);
      const fcmToken = await getToken(messaging);
      await notificationUseCases.registerToken(fcmToken, Platform.OS === 'ios' ? 'ios' : 'android');

      unsubscribeRefresh = onTokenRefresh(messaging, nextToken => {
        notificationUseCases.registerToken(nextToken, Platform.OS === 'ios' ? 'ios' : 'android')
          .catch(error => logError('Push token refresh error', error));
      });
    };

    setup().catch(error => logError('Push notification setup error', error));
    return () => {
      cancelled = true;
      unsubscribeRefresh?.();
    };
  }, [token, user]);

  useEffect(() => onMessage(getMessaging(), message => {
    const title = message.notification?.title || 'TOPIK MATE';
    const body = message.notification?.body;
    if (body) {
      const messageType = typeof message.data?.type === 'string' ? message.data.type : undefined;
      setNotification({ title, body, type: messageType });
    }
  }), []);

  useEffect(() => {
    if (!notification || suppressBanner) return;

    translateY.setValue(-140);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -140,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setNotification(null));
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification, suppressBanner, translateY]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -140,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setNotification(null));
  };

  if (!notification || suppressBanner) return null;

  const isLesson = notification.type === 'lesson';
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + 10, transform: [{ translateY }] }]}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Icon name={isLesson ? 'book-outline' : 'document-text-outline'} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textBlock}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>TOPIK MATE</Text>
            <View style={styles.dot} />
            <Text style={styles.now}>Одоо</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Мэдэгдэл хаах"
          hitSlop={10}
          onPress={dismiss}
          style={styles.closeButton}
        >
          <Icon name="close" size={20} color="#64748B" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 10000,
    elevation: 10000,
  },
  card: {
    minHeight: 92,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE7FF',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#123C8C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#2563EB',
  },
  textBlock: {
    flex: 1,
    paddingRight: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  brand: {
    color: '#2563EB',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 6,
    backgroundColor: '#94A3B8',
  },
  now: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    marginBottom: 2,
  },
  body: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
  },
});
