import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import type { MenuItemType } from './types';

const menuItems: MenuItemType[] = [
  { id: 1, label: 'Үндсэн',   icon: 'home-outline',          screenName: 'Home' },
  { id: 2, label: 'Видео',    icon: 'videocam-outline',       screenName: 'Video' },
  { id: 3, label: 'Хичээл',   icon: 'book-outline',           screenName: 'Lesson' },
  { id: 4, label: 'Шалгалт',  icon: 'document-text-outline',  screenName: 'Exam' },
  { id: 5, label: 'Үгийн сан', icon: 'library-outline',       screenName: 'Dictionary' },
];

const SCREENS_WITH_FOOTER = ['Home', 'Video', 'Lesson', 'Exam', 'Dictionary'];

const ACTIVE_ICONS: Record<string, string> = {
  'home-outline':          'home',
  'videocam-outline':      'videocam',
  'book-outline':          'book',
  'document-text-outline': 'document-text',
  'library-outline':       'library',
};

const Footer = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  if (!SCREENS_WITH_FOOTER.includes(route.name)) return null;

  const activeId = menuItems.find((m) => m.screenName === route.name)?.id ?? 1;

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        const isActive = activeId === item.id;
        const iconName = isActive ? (ACTIVE_ICONS[item.icon] ?? item.icon) : item.icon;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.tab}
            onPress={() => navigation.navigate(item.screenName)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon
                name={iconName}
                size={20}
                color={isActive ? '#155DFC' : '#94A3B8'}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#EFF6FF',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  labelActive: {
    color: '#155DFC',
    fontWeight: '700',
  },
});

export default Footer;
