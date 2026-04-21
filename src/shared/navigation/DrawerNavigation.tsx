// src/shared/navigation/DrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
import { useSharedStore } from '../../store/sharedStore';
import Header from '../components/organisms/header';
import Footer from '../components/organisms/footer';
import CustomDrawerContent from '../components/organisms/CustomDrawerContent';

// Screens
import HomeScreen from '../../features/home/screens/homescreen';
import VideoScreen from '../../features/lessons/videolessonscreen/videolesson';
import LessonScreen from '../../features/lessons/lessonScreen/lessonScreen';
import ExamScreen from '../../features/exam/examscreen/examscreen';
import DictionaryScreen from '../../features/dictionary/Dictionary';
import Login from '../../features/auth/screens/Login';
import Payment from '../../features/payment/payment';
import About from '../../features/pages/About';
import Contact from '../../features/pages/Contact';
import Signin from '../../features/auth/screens/Signin';
import ForgotPassword from '../../features/auth/screens/Forgotpass';
import { Progress } from '../../features/progress/Progress';
import ExamInterface from '../../features/exam/examscreen/examInterface';

const Drawer = createDrawerNavigator();

const ScreenWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>{children}</View>
      <Footer />
    </View>
  );
};

// Screens with Header/Footer
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

const ProgressScreenWrapper = (props: any) => (
  <ScreenWrapper>
    <Progress {...props} />
  </ScreenWrapper>
);

const PaymentScreenWrapper = () => (
  <ScreenWrapper>
    <Payment visible={true} onClose={() => {}} />
  </ScreenWrapper>
);

// ExamInterface - Header/Footer-гүй
const ExamInterfaceWrapper = (props: any) => <ExamInterface {...props} />;

const DrawerNavigator = () => {
  const { isAuthenticated } = useSharedStore();

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
      {/* Main screens - drawer-д харагдана */}
      <Drawer.Screen name="Home" component={HomeScreenWrapper} />
      <Drawer.Screen name="Dictionary" component={DictionaryScreenWrapper} />
      <Drawer.Screen name="About" component={About} />
      <Drawer.Screen name="Contact" component={Contact} />
      <Drawer.Screen name="Video" component={VideoScreenWrapper} />
      <Drawer.Screen name="Lesson" component={LessonScreenWrapper} />
      <Drawer.Screen name="Exam" component={ExamScreenWrapper} />
      <Drawer.Screen name="Progress" component={ProgressScreenWrapper} />
      <Drawer.Screen name="Payment" component={PaymentScreenWrapper} />
      
      {/* ExamInterface - drawer-д харагдахгүй */}
      <Drawer.Screen 
        name="ExamInterface" 
        component={ExamInterfaceWrapper}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      
      {/* Auth screens - зөвхөн authenticated биш үед харагдана */}
      {!isAuthenticated && (
        <>
          <Drawer.Screen name="Login" component={Login} />
          <Drawer.Screen name="Signin" component={Signin} />
          <Drawer.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      )}
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