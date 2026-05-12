import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { getErrorMessage } from '../../../shared/lib/errors';
import { lessonApi, type LessonContent } from '../api/lessonApi';

const GrammarScreen = () => {
  const [query, setQuery] = useState('');
  const [lessons, setLessons] = useState<LessonContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await lessonApi.getLessonsByCategory('grammar');
        if (!response.success) throw new Error(response.error || 'Дүрмийн өгөгдөл ачаалах боломжгүй байна.');
        if (isMounted) setLessons(response.lessons || []);
      } catch (e) {
        if (isMounted) setError(getErrorMessage(e, 'Дүрмийн өгөгдөл ачаалах үед алдаа гарлаа.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((l) => `${l.title} ${l.description}`.toLowerCase().includes(q));
  }, [lessons, query]);

  const handleOpen = async (lesson: LessonContent) => {
    if (!lesson.contentUrl) return;
    const supported = await Linking.canOpenURL(lesson.contentUrl);
    if (supported) await Linking.openURL(lesson.contentUrl);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Icon name="document-text-outline" size={28} color="#60A5FA" />
        </View>
        <Text style={styles.heroTitle}>Дүрэм</Text>
        <Text style={styles.heroDesc}>Солонгос хэлний дүрмийн хичээлүүд</Text>
      </View>

      {/* Search */}
      <View style={styles.searchCard}>
        <View style={styles.searchIconBox}>
          <Icon name="search-outline" size={18} color="#155DFC" />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Дүрэм хайх..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <Icon name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      {!isLoading && !error && (
        <View style={styles.countRow}>
          <View style={styles.accent} />
          <Text style={styles.countText}>
            {query.trim() ? `"${query}" — ${filteredLessons.length} дүрэм` : `Нийт ${lessons.length} дүрэм`}
          </Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="hourglass-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Ачааллаж байна...</Text>
          <Text style={styles.stateDesc}>Дүрмийн хичээлүүд татаж байна.</Text>
        </View>
      )}

      {/* Error */}
      {!isLoading && error && (
        <View style={styles.stateCard}>
          <View style={[styles.stateIconBox, { backgroundColor: '#FEF2F2' }]}>
            <Icon name="alert-circle-outline" size={26} color="#EF4444" />
          </View>
          <Text style={[styles.stateTitle, { color: '#EF4444' }]}>Алдаа гарлаа</Text>
          <Text style={styles.stateDesc}>{error}</Text>
        </View>
      )}

      {/* Empty */}
      {!isLoading && !error && filteredLessons.length === 0 && (
        <View style={styles.stateCard}>
          <View style={styles.stateIconBox}>
            <Icon name="search-outline" size={26} color="#94A3B8" />
          </View>
          <Text style={styles.stateTitle}>Дүрэм олдсонгүй</Text>
          <Text style={styles.stateDesc}>
            {query.trim() ? `"${query}" дүрэм олдсонгүй.` : 'Дүрмийн мэдээлэл байхгүй байна.'}
          </Text>
        </View>
      )}

      {/* List */}
      {!isLoading && !error && filteredLessons.length > 0 && (
        <View style={styles.listCard}>
          {filteredLessons.map((lesson, idx) => (
            <TouchableOpacity
              key={lesson.id}
              onPress={() => void handleOpen(lesson)}
              activeOpacity={0.7}
              style={[styles.row, idx < filteredLessons.length - 1 && styles.rowBorder]}
            >
              <View style={styles.rowIconBox}>
                <Icon name="document-text-outline" size={16} color="#155DFC" />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{lesson.title}</Text>
                {!!lesson.description && (
                  <Text style={styles.rowDesc}>{lesson.description}</Text>
                )}
              </View>
              {!!lesson.contentUrl && (
                <Icon name="open-outline" size={15} color="#CBD5E1" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

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
  heroDesc:  { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500', paddingVertical: 0 },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  accent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#155DFC' },
  countText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  stateCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  stateIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  stateDesc:  { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  listCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  rowDesc:  { fontSize: 12, color: '#64748B', lineHeight: 18 },
});

export default GrammarScreen;
