import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuthStore } from '../../../features/auth/store/authStore';
import { useAppStore } from '../../../app/store';
import { PaymentScreen as Payment, usePaymentModal } from '../../../features/payment';

const MENU_ITEMS = [
  { name: 'Бидний тухай', icon: 'information-circle-outline', screen: 'About' },
  { name: 'Холбоо барих',  icon: 'call-outline',               screen: 'Contact' },
  { name: 'Ахиц дэвшил',  icon: 'trending-up-outline',        screen: 'Progress' },
  { name: 'Төлбөр төлөх', icon: 'card-outline',               screen: 'Payment' },
];

const CustomDrawerContent = (props) => {
  const { showPayment, openPayment, closePayment } = usePaymentModal();
  const { isAuthenticated, isPaidUser, user, getDaysRemaining, getSubscriptionProgress } = useAppStore();
  const { logout } = useAuthStore();

  const daysRemaining = getDaysRemaining();
  const progress = getSubscriptionProgress();
  const isPaid = isPaidUser();

  const handlePress = (item) => {
    if (item.screen === 'Payment') { openPayment(); return; }
    props.navigation.closeDrawer();
    requestAnimationFrame(() => props.navigation.navigate(item.screen));
  };

  const handleLogout = async () => {
    await logout();
    props.navigation.closeDrawer();
  };

  const handleLogin = () => {
    props.navigation.closeDrawer();
    requestAnimationFrame(() => props.navigation.getParent()?.navigate('Auth', { screen: 'Login' }));
  };

  return (
    <View style={styles.container}>
      {/* Dark header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoBox}>
            <Icon name="book-outline" size={20} color="#60A5FA" />
          </View>
          <View>
            <Text style={styles.logoText}>TOPIK</Text>
            <Text style={styles.logoSub}>Солонгос хэлний бэлтгэл</Text>
          </View>
        </View>

        {/* User section */}
        {user ? (
          <View style={styles.userSection}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || 'T'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user.name || 'Хэрэглэгч'}</Text>
              {!!user.email && (
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              )}
              <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.freeBadge]}>
                <Icon name={isPaid ? 'star' : 'person-outline'} size={10} color={isPaid ? '#F59E0B' : '#94A3B8'} />
                <Text style={[styles.statusText, isPaid ? styles.paidText : styles.freeText]}>
                  {isPaid ? 'Premium' : 'Үнэгүй'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.guestSection}>
            <Icon name="person-circle-outline" size={36} color="#475569" />
            <Text style={styles.guestText}>Нэвтрээгүй байна</Text>
          </View>
        )}

        {/* Subscription bar */}
        {isPaid && daysRemaining > 0 && (
          <View style={styles.subBar}>
            <View style={styles.subBarTrack}>
              <View style={[styles.subBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={[styles.subDays, daysRemaining <= 7 && styles.subDaysWarn]}>
              {daysRemaining} өдөр үлдсэн
            </Text>
          </View>
        )}

        {!isPaid && user && (
          <TouchableOpacity style={styles.upgradeBtn} onPress={openPayment} activeOpacity={0.85}>
            <Icon name="star-outline" size={14} color="#155DFC" />
            <Text style={styles.upgradeBtnText}>Premium идэвхжүүлэх</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <Text style={styles.menuLabel}>Цэс</Text>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Icon name={item.icon} size={18} color="#475569" />
            </View>
            <Text style={styles.menuText}>{item.name}</Text>
            <Icon name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Auth actions */}
      <View style={styles.authSection}>
        {!isAuthenticated ? (
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
            <Icon name="log-in-outline" size={18} color="#155DFC" />
            <Text style={styles.loginBtnText}>Нэвтрэх</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Icon name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Гарах</Text>
          </TouchableOpacity>
        )}
      </View>

      <Payment
        visible={showPayment}
        onClose={closePayment}
        onSelectPlan={(item) => {
          closePayment();
          props.navigation.closeDrawer();
          requestAnimationFrame(() => {
            props.navigation.navigate('PaymentCheckout', {
              planId: item.id, planTitle: item.title, planPrice: item.price, planMonths: item.months,
            });
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  /* Header */
  header: {
    backgroundColor: '#0F172A',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '900', color: '#F8FAFC', letterSpacing: 2 },
  logoSub: { fontSize: 10, color: '#64748B', marginTop: 1 },

  /* User */
  userSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#155DFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  userEmail: { fontSize: 11, color: '#64748B' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  paidBadge: { backgroundColor: '#1C1507' },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.06)' },
  statusText: { fontSize: 11, fontWeight: '700' },
  paidText: { color: '#F59E0B' },
  freeText: { color: '#64748B' },

  guestSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  guestText: { fontSize: 14, color: '#64748B' },

  /* Subscription bar */
  subBar: { marginBottom: 10 },
  subBarTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  subBarFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 2 },
  subDays: { fontSize: 11, color: '#64748B' },
  subDaysWarn: { color: '#EF4444', fontWeight: '700' },

  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
  },
  upgradeBtnText: { fontSize: 13, fontWeight: '700', color: '#155DFC' },

  /* Menu */
  menu: { flex: 1, paddingTop: 20, paddingHorizontal: 16 },
  menuLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },

  /* Auth */
  authSection: { padding: 16 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  loginBtnText: { fontSize: 14, fontWeight: '700', color: '#155DFC' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});

export default CustomDrawerContent;
