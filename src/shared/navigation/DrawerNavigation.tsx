// shared/navigation/DrawerNavigator.tsx
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
import { Progress } from '../../features/progress/Progress';

const Drawer = createDrawerNavigator();

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

const HomeScreenWrapper = (props: any) => (
  <ScreenWrapper>
    <HomeScreen {...props} />
  </ScreenWrapper>
);

const VideoScreenWrapper = (props: any) => (
  <ScreenWrapper>
    <VideoScreen {...props} />
  </ScreenWrapper>
);

const LessonScreenWrapper = (props: any) => (
  <ScreenWrapper>
    <LessonScreen {...props} />
  </ScreenWrapper>
);

const ExamScreenWrapper = (props: any) => (
  <ScreenWrapper>
    <ExamScreen {...props} />
  </ScreenWrapper>
);

const DictionaryScreenWrapper = (props: any) => (
  <ScreenWrapper>
    <DictionaryScreen {...props} />
  </ScreenWrapper>
);

// Payment-г шууд modal-аар харуулах
const PaymentScreenWrapper = () => {
  return (
    <ScreenWrapper>
      <Payment visible={true} onClose={() => {}} />
    </ScreenWrapper>
  );
};

const DrawerNavigator = () => {
  const screens = [
    <Drawer.Screen key="Home" name="Home" component={HomeScreenWrapper} />,
    <Drawer.Screen key="Video" name="Video" component={VideoScreenWrapper} />,
    <Drawer.Screen key="Lesson" name="Lesson" component={LessonScreenWrapper} />,
    <Drawer.Screen key="Exam" name="Exam" component={ExamScreenWrapper} />,
    <Drawer.Screen key="Dictionary" name="Dictionary" component={DictionaryScreenWrapper} />,
    <Drawer.Screen key="Login" name="Login" component={Login} />,
    <Drawer.Screen key="Signin" name="Signin" component={Signin} />,
    <Drawer.Screen key="ForgotPassword" name="ForgotPassword" component={ForgotPassword} />,
    <Drawer.Screen key="About" name="About" component={About} />,
    <Drawer.Screen key="Contact" name="Contact" component={Contact} />,
    <Drawer.Screen key="Progress" name="Progress" component={Progress} />,
  ];

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
      {screens}
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