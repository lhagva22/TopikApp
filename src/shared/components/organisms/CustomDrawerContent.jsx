// shared/components/organisms/CustomDrawerContent.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Payment from '../../../features/payment/payment';
import { useAuthStore } from '../../../features/auth/store/authStore';
import { useAppStore } from '../../../app/store';
import { Card } from '../molecules/card';

const menuItems = [
  { name: 'Бидний тухай', icon: 'information-circle-outline', screen: 'About' },
  { name: 'Холбоо барих', icon: 'call-outline', screen: 'Contact' },
  { name: 'Ахиц дэвшил', icon: 'trending-up-outline', screen: 'Progress' },
  { name: 'Төлбөр төлөх', icon: 'card-outline', screen: 'Payment' },
];

const CustomDrawerContent = (props) => {
  const [showPayment, setShowPayment] = useState(false);
  const { isAuthenticated, isPaidUser, user, getDaysRemaining, getSubscriptionProgress } = useAppStore();
  const { logout } = useAuthStore();

  const daysRemaining = getDaysRemaining();
  const progress = getSubscriptionProgress();

  const handleLogout = async () => {
    await logout();
    props.navigation.closeDrawer();
  };

  const handlePress = (item) => {
    if (item.screen === 'Payment') {
      setShowPayment(true);
      return;
    }

    props.navigation.closeDrawer();

    requestAnimationFrame(() => {
      props.navigation.navigate(item.screen);
    });
  };

  const handleLogin = () => {
    props.navigation.closeDrawer();

    requestAnimationFrame(() => {
      props.navigation.getParent()?.navigate('Auth', { screen: 'Login' });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ТОПИК</Text>
      </View>

      <View style={styles.menuItems}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
          >
            <Icon name={item.icon} size={22} color="#333" />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}

        {!isAuthenticated && (
          <TouchableOpacity style={styles.menuItem} onPress={handleLogin}>
            <Icon name="log-in-outline" size={22} color="#155DFC" />
            <Text style={[styles.menuText, styles.loginText]}>Нэвтрэх</Text>
          </TouchableOpacity>
        )}

        {isAuthenticated && (
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Icon name="log-out-outline" size={22} color="#dc2626" />
            <Text style={[styles.menuText, styles.logoutText]}>Гарах</Text>
          </TouchableOpacity>
        )}
      </View>

      <Payment visible={showPayment} onClose={() => setShowPayment(false)} />

      {user && (
        <Card style={styles.userCard}>
          <View style={styles.userCardContent}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name?.charAt(0) || 'G'}</Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name || 'Зочин'}
              </Text>

              {!!user.email && (
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              )}

              <View style={styles.userStatusContainer}>
                <View style={[styles.userStatusBadge, isPaidUser() ? styles.paidBadge : styles.freeBadge]}>
                  <Text style={[styles.userStatusText, isPaidUser() ? styles.paidStatusText : styles.freeStatusText]}>
                    {isPaidUser() ? 'Төлбөртэй хэрэглэгч' : 'Зочин / үнэгүй'}
                  </Text>
                </View>

                {isPaidUser() && daysRemaining > 0 && (
                  <View style={styles.daysRemainingContainer}>
                    <Icon name="calendar-outline" size={12} color="#6b7280" />
                    <Text style={[styles.daysRemainingText, daysRemaining <= 7 && styles.daysRemainingWarning]}>
                      {daysRemaining} өдөр үлдсэн
                    </Text>
                  </View>
                )}
              </View>

              {isPaidUser() && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              )}

              {!isPaidUser() && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => setShowPayment(true)}
                >
                  <Text style={styles.upgradeButtonText}>Багц идэвхжүүлэх</Text>
                </TouchableOpacity>
              )}
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
  loginText: {
    color: '#155DFC',
  },
  logoutText: {
    color: '#dc2626',
  },
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
    flexWrap: 'wrap',
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '500',
  },
  upgradeButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#155DFC',
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CustomDrawerContent;
