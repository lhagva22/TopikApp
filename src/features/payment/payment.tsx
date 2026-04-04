import { Text, View , ScrollView} from "react-native";
import Modal  from "react-native-modal";
import SectionTitle from "../../shared/components/atoms/sectionTitle";
import { Card, CardHeader, CardTitle } from "../../shared/components/molecules/card";
import CustomButton from "../../shared/components/molecules/button";
import Icon from "react-native-vector-icons/Ionicons";


const paymentItems = [
    {
        id: 1,
        title: "1 сар",
        price: "29,900₮",
        features: ["Бүх видео хичээл", "Mock шалгалтууд", "Толь бичиг", "Хичээлийн материал"]
    },
    {
        id: 2,
        title: "3 сар",
        price: "79,900₮",
        features: ["Бүх видео хичээл", "Mock шалгалтууд", "Толь бичиг", "Хичээлийн материал"]
    },
    {
        id: 3,
        title: "6 сар",
        price: "149,900₮",
        features: ["Бүх видео хичээл", "Mock шалгалтууд", "Толь бичиг", "Хичээлийн материал"]
    },
];

const Payment = () => {
    return (
        <Modal 
        isVisible={true}
        
        >
            <ScrollView style={{backgroundColor: "white", padding: 10, borderRadius: 10}}>
                <SectionTitle textStyle={{textAlign: "center"}}>Багц сонгох</SectionTitle> 
                <CardTitle style={{textAlign: "center", marginVertical: 10}}>Өөрт тохирсон багцаа сонгоно уу</CardTitle> 
                {paymentItems.map(item => (
                <Card key={item.id} style={{marginHorizontal: 10}}>
                    <CardHeader>
                    <View>
                        <Text style={{ 
                        fontFamily: 'YourFont-Bold', 
                        fontSize: 18,
                        fontWeight: '700'
                        }}>
                        {item.title}
                        </Text>
                        <View style={{flexDirection: "row", alignItems: "center"}}>
                        <Text style={{ 
                        fontFamily: 'YourFont-Regular', 
                        fontSize: 24,
                        fontWeight: '600',
                        color: '#007AFF'
                        }}>
                        {item.price}
                        </Text>
                        <Text style={{ 
                        fontFamily: 'YourFont-Light', 
                        fontSize: 12,
                        color: '#666'
                        }}>
                        \{item.title}
                        </Text>
                        </View>
                       
                    </View>                  
                    </CardHeader>
                    <CardTitle>
                             {item.features.map((feature, index) => (
                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Icon name="checkmark" size={12} color="#000000" style={{ marginRight: 8 }} />
                                <Text style={{
                                    fontSize: 12,
                                    color: '#333',
                                    lineHeight: 20,
                                    flex: 1
                                }}>
                                    {feature}
                                </Text>
                                </View>
                            ))}
                        </CardTitle>

                        <CustomButton title="Сонгох" onPress={() => {}} style={{marginTop: 20}} textStyle={{fontWeight: '400', fontSize: 14}} />
                </Card>
                ))}

            </ScrollView>
        </Modal>
    )
}

export default Payment;