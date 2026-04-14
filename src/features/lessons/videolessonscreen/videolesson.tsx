// videolesson.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, CardTitle } from "../../../shared/components/molecules/card";
import Icon from "react-native-vector-icons/Ionicons";
import { ProtectedTouchable } from "../../../shared/components/molecules/protectedTouchable";
import { useSharedStore } from "../../../store/sharedStore";
import Payment from "../../../features/payment/payment";

const Videolesson = () => {
  const { isPaidUser } = useSharedStore();
  const [showPayment, setShowPayment] = useState(false);

  const videoData = [
    { id: 1, title: "Грамматик дүүргэлт - 1-р хэсэг", duration: "25:00", level: "Beginner" },
    { id: 2, title: "Грамматик дүүргэлт - 2-р хэсэг", duration: "30:00", level: "Intermediate" },
    { id: 3, title: "Грамматик дүүргэлт - 3-р хэсэг", duration: "35:00", level: "Advanced" },
  ];

  const handleVideoPress = (videoId: number) => {
    console.log('Видео тоглож байна:', videoId);
  };

  const handlePaymentRequired = () => {
    setShowPayment(true);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        {videoData.map((video) => (
          <ProtectedTouchable 
            key={video.id}
            requiredStatus="paid"   
            onPress={() => handleVideoPress(video.id)}
            onPaymentRequired={handlePaymentRequired}  // ✅ Нэмэх
          >
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                  {!isPaidUser() && (
                    <Icon name="lock-closed-outline" size={16} style={styles.lockIcon} />
                  )}
                  <Icon name="play-outline" size={40} />
                </View>
                <View style={styles.infoContainer}>
                  <CardTitle variant="large">{video.title}</CardTitle>
                  <View style={styles.durationContainer}>
                    <Icon name="time-outline" size={16} />
                    <CardTitle variant="small"> {video.duration} </CardTitle>
                  </View>
                  <View style={styles.levelBadge}>
                    <CardTitle variant="small" style={styles.levelText}>{video.level}</CardTitle>
                  </View>
                </View>
              </View>
            </Card>
          </ProtectedTouchable>
        ))}
      </View>
      
      <Payment 
        visible={showPayment} 
        onClose={() => setShowPayment(false)} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 16, marginBottom: 12 },
  cardContent: { flexDirection: "row", flex: 1 },
  imageContainer: {
    width: '30%', height: 80, marginRight: 8, backgroundColor: "#eee",
    borderRadius: 8, justifyContent: "center", alignItems: "center", position: "relative",
  },
  lockIcon: { position: "absolute", top: 5, right: 10, zIndex: 1 },
  infoContainer: { flex: 1, flexDirection: "column" },
  durationContainer: { flexDirection: "row", marginTop: 16, alignItems: "center" },
  levelBadge: { backgroundColor: "#B0C9FF", borderRadius: 10, paddingHorizontal: 12, marginTop: 16, alignSelf: 'flex-start' },
  levelText: { color: "#155DFC" },
});

export default Videolesson;