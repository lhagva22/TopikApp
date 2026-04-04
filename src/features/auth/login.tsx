import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image} from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import 'react-native-gesture-handler';
import SectionTitle from "../../shared/components/atoms/sectionTitle";
import { Card, CardTitle } from "../../shared/components/molecules/card";
import CustomButtom from "../../shared/components/molecules/button"
import GoogleIcon from "../../shared/assets/images/googlesvg"
import AppleIcon from "../../shared/assets/images/applesvg";
import React from "react";

const Login = () =>{
    return(
    <View style={{flex: 1, padding: 16}}>
        <TouchableOpacity >
        <Icon name="arrow-back-outline" size={24}></Icon>
        </TouchableOpacity>
        <SectionTitle textStyle={{ fontSize:24, fontWeight:'bold'}} viewStyle={{justifyContent:'center', alignItems:'center', marginVertical:48}}>Нэвтрэх</SectionTitle>
        <View style={{flexDirection:"column", gap: 24 , marginBottom:88}}>
        <Card style={styles.login}>
            <GoogleIcon width={24} height={24}/>
                <CardTitle style={styles.cardtitle}>Google ашиглан нэвтрэх</CardTitle>
        </Card>
         <Card style={styles.login}>
            <AppleIcon width={24} height={24}/>
                <CardTitle style={styles.cardtitle}>Apple id ашиглан нэвтрэх</CardTitle>
        </Card>
        </View>
        <View style={{gap:24}}>
        <View>
            <Text style={styles.textstyle}>Имэйл</Text>
            <View style={styles.inputWrapper}>
                <Icon name="person-outline" size={20} color="#B1B1B1" />
            <TextInput style={styles.textinput}  placeholder="Имэйлээ оруулна уу" placeholderTextColor="#B1B1B1" ></TextInput>
            </View>
        </View>
        <View>
            
            <Text style={styles.textstyle}>Нууц үг</Text>
            <View style={styles.inputWrapper}>
                <Icon name="lock-closed-outline" size={20} color="#B1B1B1"/>
            <TextInput style={styles.textinput} placeholder="Нууц үгээ оруулна уу"  placeholderTextColor="#B1B1B1"></TextInput>
            </View>
        </View>
        </View>

       <TouchableOpacity style={{marginTop: 13, alignItems:'flex-end', marginBottom:24}}>
     
            <Text style={{  color: '#818ED5', fontWeight:'bold' }}>
                Нууц үг мартсан
            </Text>

        </TouchableOpacity>
        <CustomButtom title={'Нэвтрэх'}  onPress={() => { /* TODO: Add navigation or test logic */ }}/>

        <TouchableOpacity style={{marginTop:48, alignItems:'center'}}>
            <Text style={{  color: '#818ED5', fontWeight:'bold' }}>
                Бүртгүүлэх
            </Text>
        </TouchableOpacity>
    </View>
    );
}

const styles = StyleSheet.create({
    login:{
        flexDirection: 'row', alignItems: 'center', justifyContent:'center'
    }, 
    cardtitle:{
        marginLeft: 10,
        fontSize: 16,
    },

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
export default Login;