// src/shared/components/organisms/header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import type { HeaderProps } from './types';

// Header харуулах дэлгэцүүд
const SCREENS_WITH_HEADER = ['Home', 'Video', 'Lesson', 'Exam', 'Dictionary'];

const Header = ({ title, onMenuPress, onSearchPress }: HeaderProps) => {
    const navigation = useNavigation<DrawerNavigationProp<any>>();

  const route = useRoute();


  // Тухайн дэлгэц дээр Header харуулах эсэх
  const shouldShowHeader = SCREENS_WITH_HEADER.includes(route.name);

  if (!shouldShowHeader) {
    return null; // Header харуулахгүй
  }

  const getTitle = () => {
    switch (route.name) {
      case 'Home': return 'Нүүр';
      case 'Video': return 'Видео хичээл';
      case 'Lesson': return 'Хичээл';
      case 'Exam': return 'Шалгалт';
      case 'Dictionary': return 'Үгийн сан';
      default: return title || 'TopikApp';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.iconButton}>
        <Icon name="menu" size={24} color="#333" />
      </TouchableOpacity>
      
      <Text style={styles.title}>{getTitle()}</Text>
      
      <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
        <Icon name="search" size={22} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 4,
  },
});

export default Header;
