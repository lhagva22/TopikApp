import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { VideoCategorySummary } from '../../../domain/types';

type VideoCategoryFilterProps = {
  categories: VideoCategorySummary[];
  selectedSlug: string;
  showAll?: boolean;
  onSelect: (slug: string) => void;
};

const VideoCategoryFilter = ({
  categories,
  selectedSlug,
  showAll = true,
  onSelect,
}: VideoCategoryFilterProps) => (
  <View style={styles.wrapper}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {[...(showAll ? [{ id: 'all', slug: 'all', title: 'Бүгд' }] : []), ...categories].map((cat) => {
        const active = selectedSlug === cat.slug;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.slug)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.title}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  content: { gap: 8, paddingRight: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#155DFC',
    borderColor: '#155DFC',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#fff',
  },
});

export default VideoCategoryFilter;
