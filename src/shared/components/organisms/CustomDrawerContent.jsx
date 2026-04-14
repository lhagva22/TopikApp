// shared/components/organisms/CustomDrawerContent.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSharedStore } from '../../../store/sharedStore';
import Payment from '../../../features/payment/payment';
import { useAuthStore } from '../../../features/auth/store/authStore';

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const [showPayment, setShowPayment] = useState(false);
  const { isAuthenticated, isPaidUser } = useSharedStore();
   const { logout } = useAuthStore();
  const handleLogout = async () => {
    // Logout logic
    await logout();
    props.navigation.closeDrawer();
  };

  const menuItems = [
    // { name: 'Нүүр', icon: 'home-outline', screen: 'Home' },
    // { name: 'Толь бичиг', icon: 'search-outline', screen: 'Dictionary' },
    { name: 'Бидний тухай', icon: 'information-circle-outline', screen: 'About' },
    { name: 'Холбоо барих', icon: 'call-outline', screen: 'Contact' },
    { name: 'Ахиц дэвшил', icon: 'trending-up-outline', screen: 'Progress' },
    { name: 'Төлбөр төлөх', icon: 'card-outline', screen: 'Payment', isModal: true },
  ];

  // Зөвхөн төлбөртэй хэрэглэгчдэд харагдах хэсэг
  const paidMenuItems = [
    { name: 'Видео хичээл', icon: 'videocam-outline', screen: 'Video' },
    { name: 'Хичээлүүд', icon: 'book-outline', screen: 'Lesson' },
    { name: 'Шалгалт', icon: 'document-text-outline', screen: 'Exam' },
  ];

  const handlePress = (item) => {
    if (item.screen === 'Payment') {
      setShowPayment(true);
    } else if (item.screen === 'Logout') {
      handleLogout();
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
        {/* Бүх хэрэглэгчдэд харагдах menu */}
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

        {/* Нэвтэрсэн хэрэглэгчдэд харагдах menu */}

        {/* Төлбөртэй хэрэглэгчдэд харагдах menu */}
        {isPaidUser() && paidMenuItems.map((item, index) => (
          <TouchableOpacity
            key={`paid-${index}`}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
          >
            <Icon name={item.icon} size={22} color="#333" />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}

        {/* Нэвтрээгүй үед Login харуулах */}
        {!isAuthenticated && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('Login');
              props.navigation.closeDrawer();
            }}
          >
            <Icon name="log-in-outline" size={22} color="#333" />
            <Text style={styles.menuText}>Нэвтрэх</Text>
          </TouchableOpacity>
        )}

        {/* Нэвтэрсэн үед Logout харуулах */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={22} color="#dc2626" />
            <Text style={[styles.menuText, { color: '#dc2626' }]}>Гарах</Text>
          </TouchableOpacity>
        )}
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