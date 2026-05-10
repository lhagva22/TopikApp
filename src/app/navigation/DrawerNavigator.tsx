import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StyleSheet, View } from 'react-native';

import { DictionaryScreen } from '../../features/dictionary';
import { ExamInterfaceScreen, ExamResultScreen, ExamScreen } from '../../features/exam';
import { HomeScreen } from '../../features/home';
import { AboutScreen, ContactScreen } from '../../features/info';
import {
  AlphabetNumbersScreen,
  BooksScreen,
  GrammarScreen,
  LessonScreen,
  VideoLessonScreen,
  VocabularyScreen,
} from '../../features/lessons';
import { PaymentScreen } from '../../features/payment';
import { Progress } from '../../features/progress';
import Footer from '../../shared/components/organisms/footer';
import Header from '../../shared/components/organisms/header';
import CustomDrawerContent from '../../shared/components/organisms/CustomDrawerContent';

import type { RootDrawerParamList } from './types';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

const ScreenWrapper = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.container}>
    <Header />
    <View style={styles.content}>{children}</View>
    <Footer />
  </View>
);

const withShell = <P extends object>(Component: React.ComponentType<P>) =>
  function WrappedScreen(props: P) {
    return (
      <ScreenWrapper>
        <Component {...props} />
      </ScreenWrapper>
    );
  };

const HomeScreenWrapper = withShell(HomeScreen);
const VideoScreenWrapper = withShell(VideoLessonScreen);
const LessonScreenWrapper = withShell(LessonScreen);
const AlphabetNumbersScreenWrapper = withShell(AlphabetNumbersScreen);
const GrammarScreenWrapper = withShell(GrammarScreen);
const VocabularyScreenWrapper = withShell(VocabularyScreen);
const BooksScreenWrapper = withShell(BooksScreen);
const ExamScreenWrapper = withShell(ExamScreen);
const DictionaryScreenWrapper = withShell(DictionaryScreen);
const ProgressScreenWrapper = withShell(Progress);

const PaymentScreenWrapper = () => (
  <ScreenWrapper>
    <PaymentScreen visible={true} onClose={() => undefined} />
  </ScreenWrapper>
);

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      detachInactiveScreens={true}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        drawerType: 'front',
        drawerStyle: {
          width: '80%',
          backgroundColor: '#fff',
        },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreenWrapper} />
      <Drawer.Screen name="Dictionary" component={DictionaryScreenWrapper} />
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Contact" component={ContactScreen} />
      <Drawer.Screen name="Video" component={VideoScreenWrapper} />
      <Drawer.Screen name="Lesson" component={LessonScreenWrapper} />
      <Drawer.Screen
        name="LessonAlphabetNumbers"
        component={AlphabetNumbersScreenWrapper}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="LessonGrammar"
        component={GrammarScreenWrapper}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="LessonVocabulary"
        component={VocabularyScreenWrapper}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="LessonBooks"
        component={BooksScreenWrapper}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen name="Exam" component={ExamScreenWrapper} />
      <Drawer.Screen name="Progress" component={ProgressScreenWrapper} />
      <Drawer.Screen name="Payment" component={PaymentScreenWrapper} />
      <Drawer.Screen
        name="ExamInterface"
        component={ExamInterfaceScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="ExamResultScreen"
        component={ExamResultScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});
