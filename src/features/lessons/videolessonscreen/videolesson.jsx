import { Text, View , StyleSheet, ScrollView} from "react-native";
import { Card, CardTitle } from "../../../shared/components/molecules/card";
import  Icon  from "react-native-vector-icons/Ionicons";
import SectionTitle from "../../../shared/components/atoms/sectionTitle";

const videolesson = () => {
  return (
    <ScrollView>
    <View style={styles.container}>
      
        <SectionTitle style={{marginBottom: 16}}>Видео хичээл</SectionTitle>

       <Card style={{ justifyContent: "space-evenly", flexDirection: "row", padding: 16}}> 
        <View style={{ width: '30%', height: 80, marginRight: 8,  backgroundColor: "#eee", borderRadius: 8, justifyContent: "center", alignItems: "center"}}>
        <Icon name="lock-closed-outline" size={16} style={{position: "absolute", top: 5, right: 10}} />
        <View>
          <Icon name="play-outline" size={40} style={styles.icon} />
        </View>
        </View>
        <View style={{ flex: 1, flexDirection: "column" }}>
        <CardTitle  variant="large">Грамматик дүүргэлт - 1-р хэсэг </CardTitle>
        <CardTitle variant="small" icon="time-outline" iconStyle={{ color: "#666" }}  style={{ color: "#666" }}iconSize={16} containerStyle={{ color: "#ff0000" , marginTop: 16}} >   25:00    </CardTitle>
        <CardTitle variant="small" style={{ color: "#155DFC", backgroundColor: "#B0C9FF", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2, marginTop: 16 }}>Beginner</CardTitle>
        </View>
        </Card>
    </View>
    </ScrollView>
  );
}

export default videolesson;

const styles = {
  container: {

    padding:16,

  },
  icon: {
    // marginRight: 8,
    // size: 24,
  },
};