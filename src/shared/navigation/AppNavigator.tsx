// src/shared/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


// Хэрэглэгчийн төлөв авах
// import { useAuthStore } from '../../store/authStore';

// Нэвтрэх эрхгүй (Public) дэлгэцүүд
import  HomeScreen  from '../../features/home/screens/homescreen';
// import { LoginScreen } from '../../features/auth/screens/LoginScreen';
// import { RegisterScreen } from '../../features/auth/screens/RegisterScreen';
// import { ForgotPasswordScreen } from '../../features/auth/screens/ForgotPasswordScreen';

// // Төлбөр төлсөн хэрэглэгчийн дэлгэцүүд
// import { LessonListScreen } from '../../features/lessons/screens/LessonListScreen';
// import { VideoLessonScreen } from '../../features/lessons/screens/VideoLessonScreen';
// import { PracticeScreen } from '../../features/lessons/screens/PracticeScreen';
// import { LevelTestScreen } from '../../features/exam/screens/LevelTestScreen';
// import { MockTestScreen } from '../../features/exam/screens/MockTestScreen';
// import { TestResultScreen } from '../../features/exam/screens/TestResultScreen';
// import { DashboardScreen } from '../../features/progress/screens/DashboardScreen';
// import { DictionaryScreen } from '../../features/dictionary/screens/DictionaryScreen';
// import { PaymentScreen } from '../../features/payment/screens/PaymentScreen';

// Navigation төрлүүд (TypeScript)
export type RootStackParamList = {
  // Public
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Төлбөр төлсөн хэрэглэгчийн main tab
  MainTabs: undefined;
  
  // Бусад
  Payment: undefined;
  VideoLesson: { lessonId: string };
  TestResult: { testId: string };
};

export type MainTabParamList = {
  Lessons: undefined;
  Exam: undefined;
  Progress: undefined;
  Dictionary: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
// const Tab = createBottomTabNavigator<MainTabParamList>();

// Төлбөр төлсөн хэрэглэгчийн Tab Navigator
// const MainTabNavigator = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarActiveTintColor: '#4A90E2',
//         tabBarInactiveTintColor: '#95A5A6',
//         tabBarStyle: {
//           height: 60,
//           paddingBottom: 8,
//           paddingTop: 8,
//         },
//       }}
//     >
//       <Tab.Screen 
//         name="Lessons" 
//         component={LessonListScreen} 
//         options={{ 
//           title: 'Хичээлүүд',
//           tabBarIcon: ({ color }) => ( <Text style={{ color }}>📚</Text> ), // Эсвэл Icon component
//         }}
//       />
//       <Tab.Screen 
//         name="Exam" 
//         component={ExamStackNavigator} 
//         options={{ 
//           title: 'Шалгалт',
//           tabBarIcon: ({ color }) => ( <Text style={{ color }}>📝</Text> ),
//         }}
//       />
//       <Tab.Screen 
//         name="Progress" 
//         component={DashboardScreen} 
//         options={{ 
//           title: 'Ахиц',
//           tabBarIcon: ({ color }) => ( <Text style={{ color }}>📊</Text> ),
//         }}
//       />
//       <Tab.Screen 
//         name="Dictionary" 
//         component={DictionaryScreen} 
//         options={{ 
//           title: 'Толь бичиг',
//           tabBarIcon: ({ color }) => ( <Text style={{ color }}>📖</Text> ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// Шалгалтын Stack Navigator (үндсэн tab дотор)
const ExamStack = createStackNavigator();
// const ExamStackNavigator = () => {
//   return (
//     <ExamStack.Navigator>
//       <ExamStack.Screen name="ExamList" component={ExamListScreen} options={{ title: 'Шалгалт сонгох' }} />
//       <ExamStack.Screen name="LevelTest" component={LevelTestScreen} options={{ title: 'Түвшин тогтоох' }} />
//       <ExamStack.Screen name="MockTest" component={MockTestScreen} options={{ title: 'Mock шалгалт' }} />
//       <ExamStack.Screen name="TestResult" component={TestResultScreen} options={{ title: 'Шалгалтын дүн' }} />
//     </ExamStack.Navigator>
//   );
// };

// ҮНДСЭН НАВИГАТОР
export const AppNavigator = () => {
  // const { isAuthenticated, role } = useAuthStore();
  // const isPaid = role === 'paid';

  return (
    <NavigationContainer>
      {/* <Stack.Navigator screenOptions={{ headerShown: false }}> */}
        {/* {!isAuthenticated ? ( */}
          // 🔓 БҮРТГЭЛГҮЙ / НЭВТРЭЭГҮЙ ХЭРЭГЛЭГЧ
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            {/* <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
          </>
        {/* ) : !isPaid ? (
          // 🔐 БҮРТГЭЛТЭЙ, ТӨЛБӨРГҮЙ ХЭРЭГЛЭГЧ
          <> */}
            <Stack.Screen name="Home" component={HomeScreen} />
            {/* <Stack.Screen name="Payment" component={PaymentScreen} /> */}
          {/* </> */}
        {/* ) : (
          // 💰 ТӨЛБӨР ТӨЛСӨН ХЭРЭГЛЭГЧ (бүх эрхтэй) */}
          <>
            {/* <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen 
              name="VideoLesson" 
              component={VideoLessonScreen} 
              options={{ headerShown: true, title: 'Видео хичээл' }}
            />
            <Stack.Screen 
              name="TestResult" 
              component={TestResultScreen} 
              options={{ headerShown: true, title: 'Шалгалтын дүн' }} */}
            {/* /> */}
          </>
        {/* )} */}
      {/* </Stack.Navigator> */}
    </NavigationContainer>
  );
};

// Туслах компонент (Icon харуулах энгийн жишээ)
import { Text } from 'react-native';