import React from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet} from "react-native";
import Icon from "react-native-vector-icons/Ionicons"
import SectionTitle from "../../shared/components/atoms/sectionTitle";
import CustomButton from "../../shared/components/molecules/button"
const forgotpass = () =>{
    return(
        <View style={{flex: 1, padding: 16}}>
                <TouchableOpacity >
                    <Icon name="arrow-back-outline" size={24}></Icon>
                    </TouchableOpacity>
                    <SectionTitle textStyle={{ fontSize:24, fontWeight:'bold'}} viewStyle={{justifyContent:'center', alignItems:'center', marginVertical:48}}>Нууц үгээ мартсан уу</SectionTitle>
                    <View style={{gap:24}}>
                        <View>
                            <Text style={styles.textstyle}>Имэйл</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="person-outline" size={20} color="#B1B1B1" />
                            <TextInput style={styles.textinput}  placeholder="Имэйлээ оруулна уу" placeholderTextColor="#B1B1B1" ></TextInput>
                            </View>
                        </View>
                        
                        
                        </View>
                        <CustomButton style={{marginTop:70}} title={'Нууц үг шинэчлэх'}  onPress={() => { /* TODO: Add navigation or test logic */ }}/>
                        <CustomButton style={{marginTop:20, backgroundColor:'#ffffff', borderColor:'#666666', borderWidth:1}} textStyle={{ color:'#000000'}} title={'Нэвтрэх рүү буцах'} icon="arrow-back-outline"  onPress={() => { /* TODO: Add navigation or test logic */ }}/>
                        <TouchableOpacity style={{marginTop:48, alignItems:"center"}}>
                            <Text style={{color:'#D1D1D1'}}>Бүртгүүлэх</Text>
                        </TouchableOpacity>
            </View>
    );
} 

const styles = StyleSheet.create({
    textstyle:{
        color:'#B1B1B1',
        marginBottom:8, 
        fontWeight:'500'
    }, 
    textinput:{
        paddingLeft: 10,
        color:'#B1B1B1',
    }, 
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: "#D1D1D1",
        },
})

export default forgotpass;