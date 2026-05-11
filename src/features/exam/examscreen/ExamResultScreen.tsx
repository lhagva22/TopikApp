import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { LEVELS } from '../../home/constants/levels';

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
  isLevelTest?: boolean;
  level?: number;
  levelName?: string;
  currentExamType?: 'TOPIK_I' | 'TOPIK_II';
  nextLevelTest?: {
    session: { id: string; started_at: string };
    test: {
      id: string;
      title: string;
      exam_type: 'TOPIK_I' | 'TOPIK_II';
      duration: number;
      total_questions: number;
      listening_questions: number;
      reading_questions: number;
    };
    questions: any[];
  } | null;
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
    isLevelTest = false,
    level,
    levelName,
    currentExamType,
    nextLevelTest,
  } = params;

  const isPassed = percentage >= 50;
  const passColor   = '#22C55E';
  const failColor   = '#EF4444';
  const accentColor = isPassed ? passColor : failColor;
  const accentBg    = isPassed ? '#DCFCE7' : '#FEE2E2';
  const levelMeta = level ? LEVELS.find((item) => item.levelValue === level) : undefined;

  const handleContinueTopikII = () => {
    if (!nextLevelTest) {
      navigation.navigate('Home');
      return;
    }

    navigation.navigate('ExamInterface', {
      examId: nextLevelTest.test.id,
      examTitle: nextLevelTest.test.title,
      examType: nextLevelTest.test.exam_type,
      duration: nextLevelTest.test.duration,
      totalQuestions: nextLevelTest.test.total_questions,
      listeningQuestions: nextLevelTest.test.listening_questions,
      readingQuestions: nextLevelTest.test.reading_questions,
      sessionId: nextLevelTest.session.id,
      questions: nextLevelTest.questions,
      isLevelTest: true,
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroExamTitle} numberOfLines={2}>{examTitle}</Text>

        <View style={styles.scoreCircle}>
          <View style={[styles.scoreCircleInner, { borderColor: accentColor }]}>
            <Text style={[styles.percentText, { color: accentColor }]}>{percentage}%</Text>
            <Text style={styles.scoreRatio}>{score} / {maxScore}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: accentBg }]}>
          <Icon
            name={isPassed ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={accentColor}
          />
          <Text style={[styles.statusText, { color: accentColor }]}>
            {isPassed ? 'Тэнцсэн' : 'Тэнцээгүй'}
          </Text>
        </View>
      </View>

      {/* Correct answers */}
      {typeof correctAnswers === 'number' && (
        <View style={styles.correctCard}>
          <View style={styles.correctIconBox}>
            <Icon name="checkmark-done-outline" size={20} color="#155DFC" />
          </View>
          <View style={styles.correctBody}>
            <Text style={styles.correctLabel}>Зөв хариулт</Text>
            <Text style={styles.correctValue}>{correctAnswers} / {totalQuestions}</Text>
          </View>
          <View style={styles.correctBar}>
            <View
              style={[
                styles.correctBarFill,
                { width: `${Math.round((correctAnswers / totalQuestions) * 100)}%` as any },
              ]}
            />
          </View>
        </View>
      )}

      {/* Section scores */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Хэсгийн оноо</Text>
        </View>

        <View style={styles.sectionRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="volume-high-outline" size={18} color="#155DFC" />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionLabel}>Сонсгол</Text>
            {listeningMaxScore !== undefined && (
              <View style={styles.sectionBarWrap}>
                <View style={styles.sectionBar}>
                  <View
                    style={[
                      styles.sectionBarFill,
                      { width: `${Math.round((listeningScore / listeningMaxScore) * 100)}%` as any, backgroundColor: '#155DFC' },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
          <Text style={styles.sectionScore}>
            {listeningScore}{listeningMaxScore !== undefined ? ` / ${listeningMaxScore}` : ''}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#F5F3FF' }]}>
            <Icon name="book-outline" size={18} color="#8B5CF6" />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionLabel}>Уншлага</Text>
            {readingMaxScore !== undefined && (
              <View style={styles.sectionBarWrap}>
                <View style={styles.sectionBar}>
                  <View
                    style={[
                      styles.sectionBarFill,
                      { width: `${Math.round((readingScore / readingMaxScore) * 100)}%` as any, backgroundColor: '#8B5CF6' },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
          <Text style={styles.sectionScore}>
            {readingScore}{readingMaxScore !== undefined ? ` / ${readingMaxScore}` : ''}
          </Text>
        </View>
      </View>

      {isLevelTest ? (
        <View style={styles.levelTestCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Түвшин тогтоох үр дүн</Text>
          </View>

          <Text style={styles.levelTestTitle}>
            {levelName || levelMeta?.title || 'Таны түвшин шинэчлэгдлээ'}
          </Text>
          {levelMeta?.subtitle ? (
            <Text style={styles.levelTestSubtitle}>{levelMeta.subtitle}</Text>
          ) : null}

          {nextLevelTest ? (
            <Text style={styles.levelTestDescription}>
              Та TOPIK II шат өгөх эрхтэй боллоо. Энэ шатны дараа 3-6-р түвшний аль хэсэгт байгаагаа тодорхойлно.
            </Text>
          ) : (
            <Text style={styles.levelTestDescription}>
              Таны түвшин Home дээрх "Түвшнүүд" хэсэгт идэвхтэй харагдана.
            </Text>
          )}

          {currentExamType === 'TOPIK_I' && nextLevelTest ? (
            <View style={styles.levelTestNotice}>
              <Icon name="trending-up-outline" size={18} color="#155DFC" />
              <Text style={styles.levelTestNoticeText}>140-аас дээш оноо авсан тул TOPIK II үргэлжлүүлж өгч болно.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {isLevelTest ? (
        <>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={nextLevelTest ? handleContinueTopikII : () => navigation.navigate('Home')}
          >
            <Icon name={nextLevelTest ? 'play-outline' : 'home-outline'} size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {nextLevelTest ? 'TOPIK II эхлүүлэх' : 'Home руу буцах'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="layers-outline" size={18} color="#155DFC" />
            <Text style={styles.secondaryBtnText}>Түвшнүүд харах</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {!isLevelTest ? (
      <>
      {/* Actions */}
      <TouchableOpacity
        style={styles.primaryBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Exam')}
      >
        <Icon name="list-outline" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Жагсаалт руу буцах</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        activeOpacity={0.85}
        onPress={() => navigation.goBack()}
      >
        <Icon name="refresh-outline" size={18} color="#155DFC" />
        <Text style={styles.secondaryBtnText}>Дахин өгөх</Text>
      </TouchableOpacity>
      </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },

  /* Hero */
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 14,
    gap: 20,
  },
  heroExamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  scoreCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
  },
  scoreRatio: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Correct */
  correctCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  correctIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  correctBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  correctLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  correctValue: { fontSize: 16, fontWeight: '800', color: '#155DFC' },
  correctBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  correctBarFill: {
    height: '100%',
    backgroundColor: '#155DFC',
    borderRadius: 3,
  },

  /* Section scores */
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#155DFC',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  sectionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: { flex: 1 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  sectionBarWrap: {},
  sectionBar: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sectionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 52,
    textAlign: 'right',
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
  levelTestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  levelTestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  levelTestSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#155DFC',
    marginBottom: 10,
  },
  levelTestDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  levelTestNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  levelTestNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  /* Buttons */
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#155DFC',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryBtnText: { color: '#155DFC', fontSize: 16, fontWeight: '700' },
});

export default ExamResultScreen;
