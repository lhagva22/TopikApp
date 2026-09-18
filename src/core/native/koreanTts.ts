import { NativeModules, Platform } from 'react-native';

type KoreanTtsNativeModule = {
  speak(text: string, rate: number): Promise<void>;
  stop(): Promise<void>;
};

const nativeTts = NativeModules.KoreanTts as KoreanTtsNativeModule | undefined;

export const koreanTts = {
  isSupported: Platform.OS === 'android' && nativeTts != null,

  async speak(text: string, rate = 0.8): Promise<void> {
    if (Platform.OS !== 'android' || nativeTts == null) {
      throw new Error('Korean speech is currently available only on Android.');
    }

    await nativeTts.speak(text, rate);
  },

  async stop(): Promise<void> {
    if (Platform.OS === 'android' && nativeTts != null) {
      await nativeTts.stop();
    }
  },
};
