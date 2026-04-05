// src/shared/navigation/DrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
import Header from '../components/organisms/header';
import Footer from '../components/organisms/footer';
import CustomDrawerContent from '../components/organisms/CustomDrawerContent';

// Screens
import HomeScreen from '../../features/home/screens/homescreen';
import VideoScreen from '../../features/lessons/videolessonscreen/videolesson';
import LessonScreen from '../../features/lessons/lessonScreen/lessonScreen';
import ExamScreen from '../../features/exam/examscreen/examscreen';
import DictionaryScreen from '../../features/dictionary/Dictionary';
import Login from '../../features/auth/Login';
import Payment from '../../features/payment/payment';
import About from '../../features/pages/About';
import Contact from '../../features/pages/Contact';
import Signin from '../../features/auth/Signin';
import ForgotPassword from '../../features/auth/Forgotpass';

const Drawer = createDrawerNavigator();

// Wrapper - Header, Footer автоматаар хянагдана
const ScreenWrapper = ({ children }: any) => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        {children}
      </View>
      <Footer />
    </View>
  );
};

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
      {/* Header, Footer-тэй дэлгэцүүд */}
      <Drawer.Screen 
        name="Home" 
        children={(props) => (
          <ScreenWrapper>
            <HomeScreen />
          </ScreenWrapper>
        )}
      />
      
      <Drawer.Screen 
        name="Video" 
        children={(props) => (
          <ScreenWrapper>
            <VideoScreen />
          </ScreenWrapper>
        )}
      />
      
      <Drawer.Screen 
        name="Lesson" 
        children={(props) => (
          <ScreenWrapper>
            <LessonScreen  /> 
          </ScreenWrapper>
        )}
      />
      
      <Drawer.Screen 
        name="Exam" 
        children={(props) => (
          <ScreenWrapper>
            <ExamScreen  />
          </ScreenWrapper>
        )}
      />
      
      <Drawer.Screen 
        name="Dictionary" 
        children={(props) => (
          <ScreenWrapper>
            <DictionaryScreen  />
          </ScreenWrapper>
        )}
      />
      
      {/* Header, Footer-гүй дэлгэцүүд - ScreenWrapper хэрэггүй */}
      <Drawer.Screen name="Login" component={Login} />
      <Drawer.Screen name="Signin" component={Signin} />
      <Drawer.Screen name="ForgotPassword" component={ForgotPassword} />
      <Drawer.Screen name="Payment" component={Payment} />
      <Drawer.Screen name="About" component={About} />
      <Drawer.Screen name="Contact" component={Contact} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});

export default DrawerNavigator;