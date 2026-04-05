// src/shared/components/organisms/footer.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

type MenuItemType = {
  id: number;
  label: string;
  icon: string;
  screenName: string;
};

const menuItems: MenuItemType[] = [
  { id: 1, label: 'Үндсэн', icon: 'home-outline', screenName: 'Home' },
  { id: 2, label: 'Видео', icon: 'videocam-outline', screenName: 'Video' },
  { id: 3, label: 'Хичээл', icon: 'book-outline', screenName: 'Lesson' },
  { id: 4, label: 'Шалгалт', icon: 'document-text-outline', screenName: 'Exam' },
  { id: 5, label: 'Үгийн сан', icon: 'library-outline', screenName: 'Dictionary' },
];

// Footer харуулах дэлгэцүүд
const SCREENS_WITH_FOOTER = ['Home', 'Video', 'Lesson', 'Exam', 'Dictionary'];

const Footer = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Тухайн дэлгэц дээр Footer харуулах эсэх
  const shouldShowFooter = SCREENS_WITH_FOOTER.includes(route.name);

  if (!shouldShowFooter) {
    return null;
  }

  // ✅ Одоогийн route.name-ээр идэвхтэй ID-г тодорхойлох
  const getActiveId = () => {
    switch (route.name) {
      case 'Home': return 1;
      case 'Video': return 2;
      case 'Lesson': return 3;
      case 'Exam': return 4;
      case 'Dictionary': return 5;
      default: return 1;
    }
  };

  const activeId = getActiveId();

  const handlePress = (item: MenuItemType) => {
    // @ts-ignore
    navigation.navigate(item.screenName);
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        const isActive = activeId === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.activeLine} />}
            <Icon
              name={item.icon}
              size={22}
              color={isActive ? '#007AFF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.menuText,
                { color: isActive ? '#007AFF' : '#9CA3AF' },
              ]}
            >
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
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 70,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  activeLine: {
    position: 'absolute',
    top: -10,
    width: 40,
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});

export default Footer;