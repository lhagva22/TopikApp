#import "ScreenshotPrevent.h"

@implementation ScreenshotPrevent

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(enable) {
  // iOS does not support blocking screenshots via public APIs.
}

RCT_EXPORT_METHOD(disable) {
  // iOS does not support blocking screenshots via public APIs.
}

@end
