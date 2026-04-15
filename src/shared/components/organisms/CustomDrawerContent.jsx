// shared/components/organisms/CustomDrawerContent.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSharedStore } from '../../../store/sharedStore';
import Payment from '../../../features/payment/payment';
import { useAuthStore } from '../../../features/auth/store/authStore';
import { Card } from '../molecules/card';

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const [showPayment, setShowPayment] = useState(false);
  const { isAuthenticated, isPaidUser, user } = useSharedStore();
  const { logout } = useAuthStore();

  // Subscription үлдсэн өдрийг тооцоолох
  const getDaysRemaining = () => {
    if (!user?.subscription_end_date) return 0;
    const now = new Date();
    const endDate = new Date(user.subscription_end_date);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();

  const handleLogout = async () => {
    await logout();
    props.navigation.closeDrawer();
  };

  const menuItems = [
    { name: 'Бидний тухай', icon: 'information-circle-outline', screen: 'About' },
    { name: 'Холбоо барих', icon: 'call-outline', screen: 'Contact' },
    { name: 'Ахиц дэвшил', icon: 'trending-up-outline', screen: 'Progress' },
    { name: 'Төлбөр төлөх', icon: 'card-outline', screen: 'Payment', isModal: true },
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
       {/* Хэрэглэгчийн мэдээллийн карт */}
        {isAuthenticated && (
          <Card style={styles.userCard}>
            <View style={styles.userCardContent}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user?.name?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Хэрэглэгч'}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
                <View style={styles.userStatusContainer}>
                  <View style={[
                    styles.userStatusBadge,
                    isPaidUser() ? styles.paidBadge : styles.freeBadge
                  ]}>
                    <Text style={[
                      styles.userStatusText,
                      isPaidUser() ? styles.paidStatusText : styles.freeStatusText
                    ]}>
                      {isPaidUser() ? "Төлбөртэй хэрэглэгч" : "Үнэгүй хэрэглэгч"}
                    </Text>
                  </View>
                  
                  {isPaidUser() && daysRemaining > 0 && (
                    <View style={styles.daysRemainingContainer}>
                      <Icon name="calendar-outline" size={12} color="#6b7280" />
                      <Text style={[
                        styles.daysRemainingText,
                        daysRemaining <= 7 && styles.daysRemainingWarning
                      ]}>
                        {daysRemaining} өдөр үлдсэн
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Card>
        )}
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
  // Хэрэглэгчийн карт стиль
  userCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e3edfb',
    borderRadius: 12,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadge: {
    backgroundColor: '#dcfce7',
  },
  freeBadge: {
    backgroundColor: '#f3f4f6',
  },
  userStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  paidStatusText: {
    color: '#166534',
  },
  freeStatusText: {
    color: '#4b5563',
  },
  daysRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daysRemainingText: {
    fontSize: 10,
    color: '#4b5563',
  },
  daysRemainingWarning: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;