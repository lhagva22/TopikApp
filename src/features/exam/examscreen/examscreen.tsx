import { Text, View, Image, ScrollView, StyleSheet } from "react-native"
import { Card, CardHeader, CardTitle } from "../../../shared/components/molecules/card"
import  Icon  from "react-native-vector-icons/Ionicons";
import SectionTitle from "../../../shared/components/atoms/sectionTitle";
import CustomButton from '../../../shared/components/molecules/button';

const items = [
    {
        id: 1,
        title: "Өгсөн",
        value: 0,
        image: require("../../../shared/assets/images/images-removebg-preview.png") 
    },
    {   
        id: 2,
        title: "Дундаж оноо",
        value: 0,
        image: require("../../../shared/assets/images/stock-removebg-preview.png") 
    },
    {
        id: 3,
        title: "Нийт",
        value: 0,
        image: require("../../../shared/assets/images/stock-removebg-preview.png") 
    }
 ]
 
const ExamScreen = () => {
    return ( 
        <ScrollView>
        <View style={{flex: 1, backgroundColor: '#fff' ,padding: 16}}>
            
  
        <View style={{ justifyContent: 'space-between', flexDirection: 'row'}}>
            {items.map((item) => (
            <Card key={item.id} style={{flexDirection: 'column', width: '30%', alignItems: 'center', justifyContent: 'center'}}>
                <View style={{alignItems:'center', justifyContent: 'flex-start', paddingBottom: 20}}>
                    {item.id === 3 ? (
                        <Icon name="document-text-outline" size={15} color="#800080" />
                    ) : (
                        <Image style={{ width: 15, height: 15 }} source={item.image} />
                    )}
                </View>
                <View style={{alignItems:'center', justifyContent: 'center' , paddingBottom: 20 }}>
                    <Text style ={{fontSize: 16, fontWeight: '600'}}>
                        {item.value}
                    </Text>
                </View>
                <CardTitle style={{ color: '#a9a9a9', fontWeight: '300'}}  >
                    {item.title}
                </CardTitle>
            </Card>))}
            
        </View>
        <SectionTitle style={{ marginTop: 20, marginBottom: 10, fontSize: 18, fontWeight: '600' }}>
                Шалгалтуудын жагсаалт
            </SectionTitle>

            <Card style={{ flexDirection: "column"}}>
                    <CardHeader containerStyle={{ flexDirection: 'row-reverse', justifyContent: 'flex-end', alignItems: 'center'}} style={{ fontSize: 16, fontWeight: '600'}} icon="lock-closed-outline" iconSize={15}>
                        TOPIK I - 67-р шалгалт
                    </CardHeader>
                    <CardTitle style={{ color: '#008000', fontWeight: '300', borderRadius: 10, padding: 2, backgroundColor:'#B0FFB0', marginTop: 10}}>
                        TOPIK I
                    </CardTitle>
                    <View>
                    <CardTitle containerStyle={{flexDirection: 'row', marginTop: 20}} icon="time-outline" iconStyle={{marginRight:5, color:'#a2a2a2'}} style={{color:'#a2a2a2'}}>
                        100 минут • 70 асуулт
                    </CardTitle>

                    <View style={{flexDirection:'row', marginTop: 10}}>
                    <CardTitle containerStyle={{ padding:2, borderRadius: 5, backgroundColor: '#d0d0d0', marginRight:10}} style={{fontWeight:300}}>
                        Сонсгол (30) 
                    </CardTitle>
                    <CardTitle containerStyle={{padding:2, borderRadius: 5, backgroundColor: '#d0d0d0'}} style={{fontWeight:300}}>
                        Уншлага (40) 
                    </CardTitle>

                    </View>
                    <CustomButton title='Шалгалт эхлүүлэх' textStyle={{color:'#ffffff'}} style={{marginTop:30}}onPress={() => {}}>

                    </CustomButton>
                    </View>

            </Card>
           
        </View>
         </ScrollView>

            
    )
};


export default ExamScreen