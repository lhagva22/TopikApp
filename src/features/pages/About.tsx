import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Image,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { Card, CardHeader, CardTitle } from "../../shared/components/molecules/card";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import CustomButton from "../../shared/components/molecules/button"
import CardTitleWithIcon from "../../shared/components/molecules/cardtitlewithicon";

const StatsGrid = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 3 : 2;

  return (
    <View style={styles.grid}>
      <View style={[styles.gridItem, { width: `${100 / numColumns}%` }]}>
        <Card style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
            <Icon name="people-outline" size={24} color="#16A34A" />
          </View>
          <CardHeader>500+</CardHeader>
          <CardTitle>Суралцагчид</CardTitle>
        </Card>
      </View>

      <View style={[styles.gridItem, { width: `${100 / numColumns}%` }]}>
        <Card style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: "#DBEAFE" }]}>
            <Icon name="bookmark-outline" size={24} color="#2563EB" />
          </View>
          <CardHeader>95%</CardHeader>
          <CardTitle>Амжилтын хувь</CardTitle>
        </Card>
      </View>

      <View
        style={[
          styles.gridItem,
          { width: isTablet ? `${100 / numColumns}%` : "100%" },
        ]}
      >
        <Card style={[styles.card, { marginBottom: 20 }]}>
          <View style={[styles.iconCircle, { backgroundColor: "#F3E8FF" }]}>
            <Icon name="book-outline" size={24} color="#9333EA" />
          </View>
          <CardHeader>1000+</CardHeader>
          <CardTitle>Хичээл, дасгал</CardTitle>
        </Card>
      </View>
    </View>
  );
};

const About = () => {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <View style={styles.schoolCard}>
          <View style={styles.schoolRow}>
            <LinearGradient
              colors={["#ae00ff", "#0047FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.schoolIconWrapper}
            >
              <Icon name="school-outline" size={40} color="#fff" />
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <CardHeader style={{ textAlign: "center" }}>
                Шинэ эхлэл нархан сургууль
              </CardHeader>
              <CardTitle
                style={{
                  textAlign: "center",
                  fontWeight: "400",
                  marginTop: 10,
                }}
              >
                Шинэ эхлэл нархан сургууль нь ахлах ангидаа Солонгос улсад
                шилжин суралцах боломжтой Монгол улсын цорын ганц сургууль юм.
              </CardTitle>
            </View>
          </View>

          <Card style={{ marginTop: 20, marginBottom: 20}}>
            
            <CardTitleWithIcon
              image={require("../../shared/assets/images/images-removebg-preview.png")}
              title="Бидний зорилго"
              iconBgColor="#95caff"
              description="Монгол хүн бүрт Солонгос хэл суралцах, TOPIK шалгалтад амжилттай тэнцэх боломжийг бүрдүүлэх."
            />
          </Card>

          <StatsGrid />
        </View>
          <Card>
            <CardHeader style={{marginBottom:20}}>Юугаараа онцлог вэ?</CardHeader>
            <CardTitleWithIcon
              icon={<Icon name="videocam-outline" size={20} color='#2563EB'></Icon>}
              title="Мэргэжлийн багш нарын видео хичээл"
              iconBgColor="#95caff"
              description="TOPIK-д амжилттай тэнцсэн, олон жилийн туршлагатай багш нарын дэлгэрэнгүй тайлбар бүхий видео хичээл"
            />
              <CardTitleWithIcon
              icon={<Icon name="document-text-outline" size={20} color='#16A34A'></Icon>}
              title="Бодит шалгалтын орчин"
              iconBgColor="#DCFCE7"
              description="TOPIK шалгалттай адилхан хугацаа, бүтэцтэй мок шалгалтууд, өөрийгөө турших боломж"
            />
              <CardTitleWithIcon
              icon={<Icon name="trending-up" size={20} color='#9333EA'></Icon>}
              title="Ахиц дэвшил хянах систем"
              iconBgColor="#F3E8FF"
              description="Таны ахиц дэвшлийг график, диаграммаар харуулж, сайжруулах хэсгүүдийг илрүүлэх"
            />
            <CardTitleWithIcon
              icon={<Icon name="book-outline" size={20} color='#FACC15'></Icon>}
              title="Өргөн хүрээний контент"
              iconBgColor="#FEF9C3"
              description="Үсэг, дүрэм, өгүүлбэр, уншлага, сонсгол - бүх хэсгийг хамарсан системтэй хичээлүүд"
            />
          </Card>

          <LinearGradient
            colors={["#2563EB", "#9333EA"]} // from-blue-600 to-purple-600
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardB}
            >
            <CardHeader style={{color:'#ffffff'}}>Өнөөдөр эхлээрэй!</CardHeader>
            <CardTitle style={{color:'#ffffff', marginBottom:10}}>
                TOPIK-д бэлтгэх аяллаа эхлүүлж, зорилгодоо хүрээрэй
            </CardTitle>

            <View style={{flexDirection:'row'}}>
               <CustomButton style={{marginRight:10, backgroundColor:'#ffffff'}} textStyle={{fontWeight:400, color:'#000000', fontSize:12}}title="Эхлэх" onPress={() => {}} />
                <CustomButton style={{backgroundColor:'#ffffff'}}textStyle={{fontWeight:400, color:'#000000', fontSize:12}} title="Холбоо барих" onPress={() => {}} />
            </View>
            </LinearGradient>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  schoolCard: {
    width: "100%",
    marginTop: 16,
  },
  schoolRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  schoolIconWrapper: {
    borderRadius: 8,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: -6,
  
  },
  gridItem: {
    paddingHorizontal: 6,
  },
  card: {
    alignItems: "center",
    paddingVertical: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
   cardB: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
  },

  subtext: {
    fontSize: 14,
    color: "#BFDBFE", // text-blue-100
    marginBottom: 16,
    textAlign: "center",
  },

});


export default About;