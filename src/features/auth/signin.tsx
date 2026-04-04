import { Text, View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import SectionTitle from "../../shared/components/atoms/sectionTitle";
import CustomButton from "../../shared/components/molecules/button"
const Signin = () =>{
    return(
            <View style={{flex: 1, padding: 16}}>
                <TouchableOpacity >
                    <Icon name="arrow-back-outline" size={24}></Icon>
                    </TouchableOpacity>
                    <SectionTitle textStyle={{ fontSize:24, fontWeight:'bold'}} viewStyle={{justifyContent:'center', alignItems:'center', marginVertical:48}}>Бүртгүүлэх</SectionTitle>
                    <View style={{gap:24}}>
                        <View>
                            <Text style={styles.textstyle}>Имэйл</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="person-outline" size={20} color="#B1B1B1" />
                            <TextInput style={styles.textinput}  placeholder="Имэйлээ оруулна уу" placeholderTextColor="#B1B1B1" ></TextInput>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.textstyle}>Нэр</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="person-outline" size={20} color="#B1B1B1" />
                            <TextInput style={styles.textinput}  placeholder="Нэрээ оруулна уу" placeholderTextColor="#B1B1B1" ></TextInput>
                            </View>
                        </View>
                        <View>
                            
                            <Text style={styles.textstyle}>Нууц үг</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="lock-closed-outline" size={20} color="#B1B1B1"/>
                            <TextInput style={styles.textinput} placeholder="Нууц үгээ оруулна уу"  placeholderTextColor="#B1B1B1"></TextInput>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.textstyle}>Нууц үг давтах</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="person-outline" size={20} color="#B1B1B1" />
                            <TextInput style={styles.textinput}  placeholder="Нууц үгээ оруулна уу" placeholderTextColor="#B1B1B1" ></TextInput>
                            </View>
                        </View>
                        
                        </View>
                         <CustomButton style={{marginTop:70}} title={'Нэвтрэх'}  onPress={() => { /* TODO: Add navigation or test logic */ }}/>
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

});

export default Signin;