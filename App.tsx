import 'react-native-gesture-handler';
import 'react-native-reanimated'; 
import { NavigationContainer } from "@react-navigation/native";
import DrawerNavigator from "../TopikApp/src/shared/navigation/DrawerNavigation";

import HomeScreen from "./src/features/home/screens/homescreen";
import VideoLesson from "./src/features/lessons/videolessonscreen/videolesson";
import LessonScreen from "./src/features/lessons/lessonScreen/lessonScreen";
import ExamScreen from "./src/features/exam/examscreen/examscreen";

export default function App() {
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
}

