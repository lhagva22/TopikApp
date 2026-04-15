import { Text, View, Image, ScrollView, StyleSheet } from "react-native"
import { Card, CardHeader, CardTitle } from "../../../shared/components/molecules/card"
import Icon from "react-native-vector-icons/Ionicons";
import SectionTitle from "../../../shared/components/atoms/sectionTitle";
import CustomButton from '../../../shared/components/molecules/button';
import { useNavigation } from "@react-navigation/native";
import React, { useState } from 'react';
import { ExamInterface } from '../MockTestExam/MockTestExam';
import Payment from '../../../features/payment/payment';

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
    const [showPayment, setShowPayment] = useState(false);
    const navigation = useNavigation<any>();
    
    const handlePaymentRequired = () => {
        setShowPayment(true);
    };

    // ExamScreen.tsx
        const handleStartExam = () => {
        navigation.navigate('ExamInterface', {
            examTitle: "TOPIK I - 1-р түвшин",
            examType: "TOPIK I",
            duration: 100,
            onComplete: () => {
            console.log('Exam completed');
            }
        });
        };

    return ( 
        <ScrollView style={{flex: 1, backgroundColor: "#fff"}}>
            <View style={{padding: 16}}>
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
                                <Text style={{fontSize: 16, fontWeight: '600'}}>
                                    {item.value}
                                </Text>
                            </View>
                            <CardTitle style={{ color: '#a9a9a9', fontWeight: '300'}}>
                                {item.title}
                            </CardTitle>
                        </Card>
                    ))}
                </View>
                
                <SectionTitle viewStyle={{ marginTop: 20, marginBottom: 10}}>
                    Шалгалтуудын жагсаалт
                </SectionTitle>

                <Card style={{ flexDirection: "column"}}>
                    <CardHeader>
                        TOPIK I - 1-р түвшин
                    </CardHeader>
                    <View style={{ alignSelf: 'flex-start' }}>
                        <CardTitle containerStyle={{borderRadius: 10, padding: 2, backgroundColor:'#B0FFB0', marginBottom: 10, alignSelf: 'flex-start'}} style={{ color: '#008000', fontWeight: '300'}}>
                            TOPIK I
                        </CardTitle>
                    </View>
                    <View>
                        <View style={{flexDirection:'row', alignItems:'center', marginTop: 10}}>
                            <Icon name="time-outline" size={16} color="#a2a2a2" />
                            <CardTitle style={{color:'#a2a2a2'}}>
                                100 минут 70 асуулт
                            </CardTitle>
                        </View>
                        <View style={{flexDirection:'row', marginTop: 10}}>
                            <CardTitle containerStyle={{ padding:2, borderRadius: 5, backgroundColor: '#d0d0d0', marginRight:10}} style={{fontWeight:300}}>
                                Сонсгол (30) 
                            </CardTitle>
                            <CardTitle containerStyle={{padding:2, borderRadius: 5, backgroundColor: '#d0d0d0'}} style={{fontWeight:300}}>
                                Уншлага (40) 
                            </CardTitle>
                        </View>
                        <CustomButton 
                            title='Шалгалт эхлүүлэх' 
                            textStyle={{color:'#ffffff'}} 
                            style={{marginTop:20}}
                            onPress={handleStartExam}
                            requiredStatus="paid"
                            onPaymentRequired={handlePaymentRequired}
                        />
                    </View>
                </Card>
            </View>
            
            <Payment 
                visible={showPayment} 
                onClose={() => setShowPayment(false)} 
            />
        </ScrollView>
    )
};

export default ExamScreen;