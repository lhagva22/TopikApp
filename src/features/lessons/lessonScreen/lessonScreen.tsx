import { Image, ScrollView, Text, View } from "react-native"
import { Card, CardHeader, CardTitle } from "../../../shared/components/molecules/card"

const lessonScreen = () => {
    return (
        <ScrollView>
        <View style={{padding: 16}}>
            
            <Card style={{ flexDirection: "row"}}>
                <View style={{flexDirection:"column", alignItems:"center", width:"20%", borderRightColor:"#E5E7EB", borderRightWidth: 1, paddingRight: 16}}>
                <Image source={require("../../../shared/assets/images/letter-removebg-preview.png")} style={{width: 50, height: 50, marginBottom: 16}} />
                <CardTitle style={{ textAlign: "center", fontWeight:"300" }}>Анхан шат</CardTitle>

                </View>
                <View style={{flexDirection:"column", alignItems:"center", width:"80%", justifyContent:"center"}}>
                    <CardHeader variant="large">Үсэг & Тоо</CardHeader>
                    <CardTitle style={{fontSize: 10, color: "#6B7280"}}>Хангыл, Солонгос тоо, Ханз тоо</CardTitle>
                </View>
            </Card>
           
        </View>
         </ScrollView>
    )
}

export default lessonScreen