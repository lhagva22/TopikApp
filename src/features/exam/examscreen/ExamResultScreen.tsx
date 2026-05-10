import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

type ResultParams = {
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers?: number;
  totalQuestions: number;
  listeningScore: number;
  listeningMaxScore?: number;
  readingScore: number;
  readingMaxScore?: number;
  examTitle: string;
};

const ExamResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params: ResultParams = route.params ?? {};

  const {
    score = 0,
    maxScore = 0,
    percentage = 0,
    correctAnswers,
    totalQuestions = 0,
    listeningScore = 0,
    listeningMaxScore,
    readingScore = 0,
    readingMaxScore,
    examTitle = 'TOPIK Шалгалт',
  } = params;

  const isPassed = percentage >= 50;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{examTitle}</Text>
      <Text style={styles.subtitle}>Шалгалтын дүн</Text>

      <View style={[styles.scoreBadge, isPassed ? styles.scoreBadgePassed : styles.scoreBadgeFailed]}>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={styles.scoreText}>
          {score} / {maxScore}
        </Text>
        <View style={styles.statusRow}>
          <Icon
            name={isPassed ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={isPassed ? '#22C55E' : '#EF4444'}
          />
          <Text style={[styles.statusText, isPassed ? styles.passedText : styles.failedText]}>
            {isPassed ? 'Тэнцсэн' : 'Тэнцээгүй'}
          </Text>
        </View>
      </View>

      {typeof correctAnswers === 'number' && (
        <View style={styles.correctRow}>
          <Icon name="checkmark-done-outline" size={18} color="#155DFC" />
          <Text style={styles.correctText}>
            Зөв хариулт: {correctAnswers} / {totalQuestions}
          </Text>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>Хэсгийн оноо</Text>

        <View style={styles.sectionRow}>
          <View style={styles.sectionIconWrap}>
            <Icon name="volume-high-outline" size={18} color="#155DFC" />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionLabel}>Сонсгол</Text>
            <Text style={styles.sectionScore}>
              {listeningScore}
              {listeningMaxScore !== undefined ? ` / ${listeningMaxScore}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionRow}>
          <View style={styles.sectionIconWrap}>
            <Icon name="book-outline" size={18} color="#800080" />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionLabel}>Уншлага</Text>
            <Text style={styles.sectionScore}>
              {readingScore}
              {readingMaxScore !== undefined ? ` / ${readingMaxScore}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Exam')}>
        <Text style={styles.backButtonText}>Буцах</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 28,
  },
  scoreBadge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
  },
  scoreBadgePassed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  scoreBadgeFailed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  percentageText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111',
  },
  scoreText: {
    fontSize: 16,
    color: '#555',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  passedText: {
    color: '#22C55E',
  },
  failedText: {
    color: '#EF4444',
  },
  correctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  correctText: {
    fontSize: 15,
    color: '#333',
  },
  sectionCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    color: '#333',
  },
  sectionScore: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  backButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#155DFC',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExamResultScreen;
