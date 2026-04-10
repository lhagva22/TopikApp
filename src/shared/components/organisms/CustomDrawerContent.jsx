// shared/components/organisms/CustomDrawerContent.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Payment from '../../../features/payment/payment';

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const [showPayment, setShowPayment] = useState(false);

  const menuItems = [
    // { name: 'Нүүр', icon: 'home-outline', screen: 'Home' },
    { name: 'Нэвтрэх', icon: 'log-in-outline', screen: 'Login' },
    // { name: 'Видео хичээл', icon: 'videocam-outline', screen: 'Video' },
    // { name: 'Хичээлүүд', icon: 'book-outline', screen: 'Lesson' },
    // { name: 'Шалгалт', icon: 'document-text-outline', screen: 'Exam' },
    // { name: 'Толь бичиг', icon: 'search-outline', screen: 'Dictionary' },
    { name: 'Төлбөр төлөх', icon: 'card-outline', screen: 'Payment', isModal: true },
    { name: 'Ахиц дэвшил', icon: 'trending-up-outline', screen: 'Progress' },
    { name: 'Бидний тухай', icon: 'information-circle-outline', screen: 'About' },
    { name: 'Холбоо барих', icon: 'call-outline', screen: 'Contact' },
    // { name: 'Гарах', icon: 'log-out-outline', screen: 'Logout' },
  ];

  const handlePress = (item) => {
    if (item.screen === 'Payment') {
      setShowPayment(true);
    } else if (item.screen === 'Logout') {
      // Logout logic
    } else {
      navigation.navigate(item.screen);
      props.navigation.closeDrawer();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ТОПИК</Text>
      </View>
      
      <View style={styles.menuItems}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
          >
            <Icon name={item.icon} size={22} color="#333" />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Payment 
        visible={showPayment} 
        onClose={() => setShowPayment(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
});

export default CustomDrawerContent;