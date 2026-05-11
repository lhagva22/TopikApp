import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const CONTACT_ITEMS = [
  {
    icon: 'mail-outline',
    color: '#155DFC',
    bg: '#EFF6FF',
    label: 'Имэйл',
    lines: ['info@topik.mn', 'support@topik.mn'],
  },
  {
    icon: 'call-outline',
    color: '#059669',
    bg: '#ECFDF5',
    label: 'Утас',
    lines: ['+976 9999-9999', '+976 8888-8888'],
  },
  {
    icon: 'location-outline',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    label: 'Хаяг',
    lines: ['Улаанбаатар хот, Сүхбаатар дүүрэг', 'Peace Avenue 17-01'],
  },
];

const HOURS = [
  { day: 'Даваа — Баасан', time: '09:00 — 18:00', closed: false },
  { day: 'Бямба',          time: '10:00 — 15:00', closed: false },
  { day: 'Ням',            time: 'Амралттай',     closed: true  },
];

const Contact = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-back" size={20} color="#0F172A" />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Icon name="chatbubbles-outline" size={28} color="#60A5FA" />
        </View>
        <Text style={styles.heroTitle}>Холбоо барих</Text>
        <Text style={styles.heroDesc}>
          Танд тусламж хэрэгтэй юу? Бидэнтэй холбогдоход таатай байх болно.
        </Text>
      </View>

      {/* Contact info */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Холбоо барих мэдээлэл</Text>
        </View>

        {CONTACT_ITEMS.map((item, idx) => (
          <View key={item.label} style={[styles.contactRow, idx < CONTACT_ITEMS.length - 1 && styles.contactRowBorder]}>
            <View style={[styles.contactIconBox, { backgroundColor: item.bg }]}>
              <Icon name={item.icon} size={18} color={item.color} />
            </View>
            <View style={styles.contactBody}>
              <Text style={styles.contactLabel}>{item.label}</Text>
              {item.lines.map((line) => (
                <Text key={line} style={styles.contactLine}>{line}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Hours */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccent, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.sectionTitle}>Ажлын цаг</Text>
        </View>

        {HOURS.map((h, idx) => (
          <View key={h.day} style={[styles.hoursRow, idx < HOURS.length - 1 && styles.hoursRowBorder]}>
            <View style={styles.hoursDayWrap}>
              <View style={[styles.hoursDot, h.closed && styles.hoursDotClosed]} />
              <Text style={styles.hoursDay}>{h.day}</Text>
            </View>
            <Text style={[styles.hoursTime, h.closed && styles.hoursTimeClosed]}>{h.time}</Text>
          </View>
        ))}
      </View>

      {/* Social */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccent, { backgroundColor: '#EC4899' }]} />
          <Text style={styles.sectionTitle}>Биднийг дагаарай</Text>
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} activeOpacity={0.8}>
            <Icon name="logo-facebook" size={20} color="#fff" />
            <Text style={styles.socialBtnText}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E1306C' }]} activeOpacity={0.8}>
            <Icon name="logo-instagram" size={20} color="#fff" />
            <Text style={styles.socialBtnText}>Instagram</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },

  /* Hero */
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  heroIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.3 },
  heroDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },

  /* Contact */
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  contactRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  contactIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactBody: { flex: 1, gap: 3 },
  contactLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  contactLine: { fontSize: 13, color: '#64748B' },

  /* Hours */
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  hoursRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  hoursDayWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  hoursDotClosed: { backgroundColor: '#EF4444' },
  hoursDay: { fontSize: 13, fontWeight: '600', color: '#374151' },
  hoursTime: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  hoursTimeClosed: { color: '#EF4444' },

  /* Social */
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  socialBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default Contact;
