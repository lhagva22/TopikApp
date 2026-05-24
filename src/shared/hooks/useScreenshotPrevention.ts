import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

const { ScreenshotPrevent } = NativeModules;

export const useScreenshotPrevention = (enabled: boolean) => {
  useEffect(() => {
    if (!ScreenshotPrevent || Platform.OS === 'ios') {return;}

    if (enabled) {
      ScreenshotPrevent.enable();
    } else {
      ScreenshotPrevent.disable();
    }

    return () => {
      ScreenshotPrevent.disable();
    };
  }, [enabled]);
};
