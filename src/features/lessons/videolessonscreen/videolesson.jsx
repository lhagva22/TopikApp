import { Text, View , StyleSheet, ScrollView} from "react-native";
import { Card, CardTitle } from "../../../shared/components/molecules/card";
import  Icon  from "react-native-vector-icons/Ionicons";
import SectionTitle from "../../../shared/components/atoms/sectionTitle";

const Videolesson = () => {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
    <View style={styles.container}>
      
       <Card style={{ justifyContent: "space-evenly", flexDirection: "row", padding: 16}}> 
        <View style={{ width: '30%', height: 80, marginRight: 8,  backgroundColor: "#eee", borderRadius: 8, justifyContent: "center", alignItems: "center"}}>
        <Icon name="lock-closed-outline" size={16} style={{position: "absolute", top: 5, right: 10}} />
        <View>
          <Icon name="play-outline" size={40} style={styles.icon} />
        </View>
        </View>
        <View style={{ flex: 1, flexDirection: "column" }}>
        <CardTitle  variant="large">Грамматик дүүргэлт - 1-р хэсэг </CardTitle>
        <View style={{ flexDirection: "row", marginTop: 16}}>
          <Icon name="time-outline" size={16} style={{ color: "#666", marginRight: 4 }} />
          <CardTitle variant="small"> 25:00 </CardTitle>
          </View>
        <View style={{  color: "#155DFC", 
                  backgroundColor: "#B0C9FF", 
                  borderRadius: 10, 
                  paddingHorizontal: 12, 
                  marginTop: 16,
                  alignSelf: 'flex-start'}}>
          <CardTitle variant="small" style={{color: "#155DFC"}}>Beginner</CardTitle>
        </View>
        </View>
        </Card>
    </View>
    </ScrollView>
  );
}

export default Videolesson;

const styles = {
  container: {
    padding:16
  },
  icon: {
    // marginRight: 8,
    // size: 24,
  },
};