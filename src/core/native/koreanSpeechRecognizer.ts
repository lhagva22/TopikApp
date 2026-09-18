import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type KoreanSpeechRecognizerNativeModule = {
  isAvailable(): Promise<boolean>;
  start(): Promise<string[]>;
  cancel(): Promise<void>;
};

const nativeRecognizer = NativeModules.KoreanSpeechRecognizer as
  | KoreanSpeechRecognizerNativeModule
  | undefined;

const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Микрофоны зөвшөөрөл',
    message: 'Солонгос үгийн дуудлагыг танихын тулд микрофон ашиглана.',
    buttonPositive: 'Зөвшөөрөх',
    buttonNegative: 'Болих',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const koreanSpeechRecognizer = {
  isSupported: Platform.OS === 'android' && nativeRecognizer != null,

  async start(): Promise<string[]> {
    if (Platform.OS !== 'android' || nativeRecognizer == null) {
      throw new Error('Korean speech recognition is currently available only on Android.');
    }

    if (!(await requestMicrophonePermission())) {
      throw new Error('MICROPHONE_PERMISSION_DENIED');
    }

    if (!(await nativeRecognizer.isAvailable())) {
      throw new Error('SPEECH_RECOGNITION_UNAVAILABLE');
    }

    return nativeRecognizer.start();
  },

  async cancel(): Promise<void> {
    if (Platform.OS === 'android' && nativeRecognizer != null) {
      await nativeRecognizer.cancel();
    }
  },
};
