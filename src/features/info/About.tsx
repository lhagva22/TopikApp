import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import CustomButton from '../../shared/components/molecules/button';

const STATS = [
  { value: '500+',  label: 'Суралцагчид',   icon: 'people-outline',   color: '#059669', bg: '#ECFDF5' },
  { value: '95%',   label: 'Амжилтын хувь', icon: 'trophy-outline',   color: '#F59E0B', bg: '#FFFBEB' },
  { value: '1000+', label: 'Хичээл, дасгал', icon: 'book-outline',    color: '#8B5CF6', bg: '#F5F3FF' },
];

const FEATURES = [
  {
    icon: 'videocam-outline',
    color: '#155DFC',
    bg: '#EFF6FF',
    title: 'Мэргэжлийн багш нарын видео хичээл',
    desc: 'TOPIK-д амжилттай тэнцсэн, олон жилийн туршлагатай багш нарын дэлгэрэнгүй тайлбар бүхий видео хичээл.',
  },
  {
    icon: 'document-text-outline',
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Бодит шалгалтын орчин',
    desc: 'TOPIK шалгалттай адилхан хугацаа, бүтэцтэй мок шалгалтууд, өөрийгөө турших боломж.',
  },
  {
    icon: 'trending-up-outline',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'Ахиц дэвшил хянах систем',
    desc: 'Таны ахиц дэвшлийг график, диаграммаар харуулж, сайжруулах хэсгүүдийг илрүүлэх.',
  },
  {
    icon: 'layers-outline',
    color: '#EA580C',
    bg: '#FFF7ED',
    title: 'Өргөн хүрээний контент',
    desc: 'Үсэг, дүрэм, өгүүлбэр, уншлага, сонсгол — бүх хэсгийг хамарсан системтэй хичээлүүд.',
  },
];

const About = () => {
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
          <Icon name="school-outline" size={32} color="#60A5FA" />
        </View>
        <Text style={styles.heroTitle}>Шинэ эхлэл нархан сургууль</Text>
        <Text style={styles.heroDesc}>
          Ахлах ангидаа Солонгос улсад шилжин суралцах боломжтой Монгол улсын цорын ганц сургууль юм.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
              <Icon name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Goal */}
      <View style={styles.goalCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Бидний зорилго</Text>
        </View>
        <Text style={styles.goalText}>
          Монгол хүн бүрт Солонгос хэл суралцах, TOPIK шалгалтад амжилттай тэнцэх боломжийг бүрдүүлэх.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Юугаараа онцлог вэ?</Text>
        </View>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
              <Icon name={f.icon} size={18} color={f.color} />
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <LinearGradient
        colors={['#155DFC', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaCard}
      >
        <Icon name="rocket-outline" size={28} color="rgba(255,255,255,0.7)" style={styles.ctaIcon} />
        <Text style={styles.ctaTitle}>Өнөөдөр эхлээрэй!</Text>
        <Text style={styles.ctaDesc}>TOPIK-д бэлтгэх аяллаа эхлүүлж, зорилгодоо хүрээрэй.</Text>
        <View style={styles.ctaBtns}>
          <CustomButton
            style={styles.ctaBtn}
            textStyle={styles.ctaBtnText}
            title="Эхлэх"
            onPress={() => navigation.navigate('Home')}
          />
          <CustomButton
            style={[styles.ctaBtn, styles.ctaBtnOutline]}
            textStyle={[styles.ctaBtnText, styles.ctaBtnOutlineText]}
            title="Холбоо барих"
            onPress={() => navigation.navigate('Contact')}
          />
        </View>
      </LinearGradient>
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
    gap: 12,
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },

  /* Section card */
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  goalText: { fontSize: 14, color: '#475569', lineHeight: 22 },

  /* Features */
  featureRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  featureIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  featureBody: { flex: 1 },
  featureTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 4, letterSpacing: -0.1 },
  featureDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  /* CTA */
  ctaCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  ctaIcon: { marginBottom: 4 },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  ctaDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  ctaBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  ctaBtn: { flex: 1, backgroundColor: '#fff' },
  ctaBtnText: { color: '#155DFC', fontWeight: '700', fontSize: 14 },
  ctaBtnOutline: { backgroundColor: 'rgba(255,255,255,0.15)' },
  ctaBtnOutlineText: { color: '#fff' },
});

export default About;
