/**
 * @format
 */
import 'react-native-reanimated';
import { enableFreeze, enableScreens } from 'react-native-screens';
import {AppRegistry} from 'react-native';
import {getMessaging, setBackgroundMessageHandler} from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

enableScreens(true);
enableFreeze(true);

setBackgroundMessageHandler(getMessaging(), async () => undefined);

AppRegistry.registerComponent(appName, () => App);
