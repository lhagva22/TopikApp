import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from "../../features/home/screens/homescreen";
import CustomDrawerContent from "../components/organisms/CustomDrawerContent";
import About from "../../features/pages/About";
import Contact from "../../features/pages/Contact";
import Login from "../../features/auth/Login";  
import Payment from "../../features/payment/payment";

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '80%',
          backgroundColor: '#fff',
        },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Login" component={Login} />
      <Drawer.Screen name="Payment" component={Payment} />
      <Drawer.Screen name="About" component={About} />
      <Drawer.Screen name="Contact" component={Contact} />

    </Drawer.Navigator>
  );
};

export default DrawerNavigator;