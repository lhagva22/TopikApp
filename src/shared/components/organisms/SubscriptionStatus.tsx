import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Card } from "../molecules/card";
import Icon from "react-native-vector-icons/Ionicons";
import { useAppStore } from "../../../app/store";
import type { CustomProgressProps, StatusType } from './types';


export const CustomProgress = ({ value, color, style }: CustomProgressProps) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <View style={[customProgressStyles.container, style]}>
      <View 
        style={[
          customProgressStyles.fill, 
          { width: `${clampedValue}%`, backgroundColor: color }
        ]} 
      />
    </View>
  );
};

const customProgressStyles = StyleSheet.create({
  container: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});

export function SubscriptionStatus() {
  const { user, isPaidUser } = useAppStore();

  // Зөвхөн paid хэрэглэгчдэд харуулах
  if (!isPaidUser() || !user) {
    return null;
  }

  // Subscription мэдээлэл
  const subscriptionEndDate = user.subscription_end_date 
    ? new Date(user.subscription_end_date) 
    : null;
  const subscriptionStartDate = user.subscription_start_date 
    ? new Date(user.subscription_start_date) 
    : null;

  const getDaysRemaining = () => {
    if (!subscriptionEndDate) return 0;
    const now = new Date();
    const diffTime = subscriptionEndDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getTotalDays = () => {
    if (!subscriptionStartDate || !subscriptionEndDate) return 0;
    const diffTime = subscriptionEndDate.getTime() - subscriptionStartDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysUsed = () => {
    if (!subscriptionStartDate) return 0;
    const now = new Date();
    const diffTime = now.getTime() - subscriptionStartDate.getTime();
    const daysUsed = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalDays = getTotalDays();
    return Math.min(daysUsed, totalDays);
  };

  const getSubscriptionProgress = () => {
    const totalDays = getTotalDays();
    const daysUsed = getDaysUsed();
    if (totalDays === 0) return 0;
    return Math.round((daysUsed / totalDays) * 100);
  };

  const daysRemaining = getDaysRemaining();
  const totalDays = getTotalDays();
  const daysUsed = getDaysUsed();
  const progress = getSubscriptionProgress();

  // ✅ formatDate - Date | null төрлийг хүлээн авах
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusType = (): StatusType => {
    if (daysRemaining <= 0) return "danger";
    if (daysRemaining <= 7) return "warning";
    if (daysRemaining <= 14) return "caution";
    return "success";
  };

  const getProgressColor = () => {
    if (progress >= 90) return "#ef4444";
    if (progress >= 75) return "#f97316";
    if (progress >= 50) return "#eab308";
    return "#22c55e";
  };

  const statusType = getStatusType();
  const progressColor = getProgressColor();

  const getStatusStyle = () => {
    switch (statusType) {
      case "success": return styles.cardSuccess;
      case "caution": return styles.cardCaution;
      case "warning": return styles.cardWarning;
      case "danger": return styles.cardDanger;
      default: return styles.cardSuccess;
    }
  };

  if (daysRemaining <= 0) {
    return (
      <Card style={styles.expiredCard}>
        <View style={styles.expiredContent}>
          <Text style={styles.expiredTitle}>⚠️ Багц дууссан байна</Text>
          <Text style={styles.expiredText}>Үргэлжлүүлэхийн тулд шинэ багц авна уу</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, getStatusStyle()]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Багцын хугацаа</Text>
          <Text style={styles.headerValue}>{user.subscription_months || 0} сар</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Явц</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <CustomProgress value={progress} color={progressColor} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Icon name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Нийт өдөр</Text>
          </View>

          <View style={[styles.statItem, styles.statItemBorder]}>
            <Icon name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.statValue}>{daysUsed}</Text>
            <Text style={styles.statLabel}>Ашигласан</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="trending-down-outline" size={14} color="#6b7280" />
            <Text style={[styles.statValue, daysRemaining <= 7 && styles.statValueWarning]}>
              {daysRemaining}
            </Text>
            <Text style={styles.statLabel}>Үлдсэн</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesContainer}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Эхэлсэн:</Text>
            <Text style={styles.dateValue}>{formatDate(subscriptionStartDate)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Дуусах:</Text>
            <Text style={styles.dateValue}>{formatDate(subscriptionEndDate)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
  },
  cardSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  cardCaution: {
    backgroundColor: "#fefce8",
    borderColor: "#fef08a",
  },
  cardWarning: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  cardDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  expiredCard: {
    padding: 16,
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
  },
  expiredContent: {
    alignItems: "center",
  },
  expiredTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: 8,
  },
  expiredText: {
    fontSize: 12,
    color: "#dc2626",
    textAlign: "center",
  },
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  headerValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
  },
  statsGrid: {
    flexDirection: "row",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#e5e7eb",
    borderRightColor: "#e5e7eb",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  statValueWarning: {
    color: "#dc2626",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  datesContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 4,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  dateValue: {
    fontSize: 10,
    fontWeight: "500",
    color: "#4b5563",
  },
});
