import { View , ScrollView, Touchable, TouchableOpacity} from "react-native";
import SectionTitle from "../../shared/components/atoms/sectionTitle";
import { CardTitle, Card, CardHeader } from "../../shared/components/molecules/card";
import CardTitleWithIcon from "../../shared/components/molecules/cardtitlewithicon";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
const Contact = () =>
{ const navigation = useNavigation<any>();
    const handleBack = () => {
        navigation.goBack();
    };
    return(

        <ScrollView>

        <View style={{flex:1 ,margin:16, gap:16}}>
                    <TouchableOpacity onPress={handleBack}>
                    <Icon name= "arrow-back" size={24} color="#000000"></Icon>
                    </TouchableOpacity>
            <View style={{}}>
            <SectionTitle textStyle={{textAlign:"center", fontWeight:'500', fontSize:20, padding:10}}>Холбоо барих</SectionTitle>
            <CardTitle style={{ textAlign: "center", marginBottom:10}}>Танд тусламж хэрэгтэй юу? Асуулт байна уу? Бидэнтэй холбогдоход таатай байх болно.</CardTitle>
            </View>
            <Card>
                <CardHeader containerStyle={{marginBottom:20}} style={{fontWeight:'500', fontSize:16}}>Холбоо барих мэдээлэл</CardHeader>
                <CardTitleWithIcon
                icon={<Icon name='mail-outline' size={20} color='#2563EB' ></Icon>}
                title='Имэйл'
                description={'info@topik.mn\nsupport@topik.mn'}
                iconBgColor='#DBEAFE'
                />
                 <CardTitleWithIcon
                icon={<Icon name='call-outline' size={20} color='#16A34A' ></Icon>}
                title='Утас'
                description={'+976 9999-9999\n+976 8888-8888'}
                iconBgColor='#D1FAE5'
                />
                <CardTitleWithIcon
                icon={<Icon name='location-outline' size={20} color='#7C3AED' ></Icon>}
                title='Хаяг'
                description={'Улаанбаатар хот, Сүхбаатар дүүрэг Peace Avenue 17-01'}
                iconBgColor='#E9D5FF'
                />

            </Card>

            <Card>
                <CardHeader style={{fontWeight:'500', fontSize:16}}>Ажлын цаг</CardHeader>
                <View style={{flexDirection:"row", justifyContent:'space-between'}}>
                    <CardTitle >Даваа - Баасан</CardTitle>
                    <CardTitle style={{fontWeight: "bold"}}>09:00 - 18:00</CardTitle>
                </View>
                <View style={{flexDirection:"row", justifyContent:'space-between'}}>
                    <CardTitle >Бямба</CardTitle>
                    <CardTitle style={{fontWeight: "bold"}}>10:00 - 15:00</CardTitle>
                </View>
                <View style={{flexDirection:"row", justifyContent:'space-between'}}>
                    <CardTitle >Ням</CardTitle>
                    <CardTitle style={{fontWeight: "bold"}}>амралттай</CardTitle>
                </View>
            </Card>

            <Card>
                <CardHeader style={{textAlign:"center", fontWeight:'500', fontSize:16}}>
                    Биднийг дагаарай
                </CardHeader>
                <TouchableOpacity style={{flexDirection:"row", justifyContent:'center', marginTop:10}} onPress={() => {
                    // Facebook холбоосыг нээх код
                }                }>
                    <View style={{backgroundColor:'#0165E1', padding:10, borderRadius:5, marginHorizontal:5}}>
                        <Icon name='logo-facebook' size={20} color='#FFFFFF'></Icon>
                    </View>
                </TouchableOpacity>

            </Card>

        </View>
        </ScrollView>

    );
}   

export default Contact;
