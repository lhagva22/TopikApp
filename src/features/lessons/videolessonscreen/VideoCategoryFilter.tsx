import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../../shared/components/atoms/AppText';
import type { VideoCategorySummary } from '../api/lessonApi';

type VideoCategoryFilterProps = {
  categories: VideoCategorySummary[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
};

const VideoCategoryFilter = ({
  categories,
  selectedSlug,
  onSelect,
}: VideoCategoryFilterProps) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable
          onPress={() => onSelect('all')}
          style={[styles.chip, selectedSlug === 'all' && styles.chipActive]}
        >
          <AppText style={[styles.chipText, selectedSlug === 'all' && styles.chipTextActive]}>
            Бүгд
          </AppText>
        </Pressable>

        {categories.map((category) => {
          const isActive = selectedSlug === category.slug;

          return (
            <Pressable
              key={category.id}
              onPress={() => onSelect(category.slug)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <AppText style={[styles.chipText, isActive && styles.chipTextActive]}>
                {category.title}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  content: {
    paddingRight: 8,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    color: '#334155',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#ffffff',
  },
});

export default VideoCategoryFilter;
