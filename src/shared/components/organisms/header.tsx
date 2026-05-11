import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';

import type { HeaderProps } from './types';

const SCREENS_WITH_HEADER = ['Home', 'Video', 'Lesson', 'Exam', 'Dictionary'];

const SCREEN_META: Record<string, { title: string; icon: string }> = {
  Home:       { title: 'Нүүр хуудас',  icon: 'home-outline' },
  Video:      { title: 'Видео хичээл', icon: 'videocam-outline' },
  Lesson:     { title: 'Хичээл',       icon: 'book-outline' },
  Exam:       { title: 'Шалгалт',      icon: 'document-text-outline' },
  Dictionary: { title: 'Үгийн сан',    icon: 'library-outline' },
};

const Header = ({ title, onSearchPress }: HeaderProps) => {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const route = useRoute();

  if (!SCREENS_WITH_HEADER.includes(route.name)) return null;

  const meta = SCREEN_META[route.name];
  const screenTitle = meta?.title ?? title ?? 'TOPIK';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
        style={styles.iconBtn}
        activeOpacity={0.7}
      >
        <Icon name="menu" size={20} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={styles.appName}>TOPIK</Text>
        <Text style={styles.screenTitle}>{screenTitle}</Text>
      </View>

      <TouchableOpacity
        onPress={onSearchPress}
        style={styles.iconBtn}
        activeOpacity={0.7}
      >
        <Icon name="search-outline" size={20} color="#0F172A" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 62,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleWrap: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#155DFC',
    letterSpacing: 2,
  },
  screenTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
});

export default Header;
