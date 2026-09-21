# Android release readiness audit

Checked on 2026-09-21. This report separates locally testable builds from Google Play readiness. It does not certify a production release. Repeat artifact checks on the actual APK/AAB that will be distributed.

## Verified project state

| Item | Observed value | Evidence |
| --- | --- | --- |
| React Native | 0.76.0 | `package.json` |
| Android Gradle Plugin | 8.6.0 | `node_modules/@react-native/gradle-plugin/gradle/libs.versions.toml` |
| Gradle / Java | 8.11.1 / JDK 17 | `android/gradle/wrapper/gradle-wrapper.properties`, local Java installation |
| Compile / target / minimum API | 35 / 34 / 24 | `android/build.gradle` |
| NDK | 26.1.10909125 | `android/build.gradle` |
| Packaged ABIs | arm64-v8a, x86_64 | Existing `app-debug.apk`, checked with `aapt dump badging` |
| New Architecture / Hermes | Enabled / enabled | `android/gradle.properties` |
| Available local SDKs | Platforms 35, 36, 37.0; NDK 26.1 and 27.1 | Local Android SDK directory |
| Available test device | x86_64 emulator; 4096-byte pages | `adb devices`, `adb shell getconf PAGE_SIZE` |

The existing debug APK at audit time passes APK signature verification and ZIP 16 KB alignment verification. However, **all 17 inspected arm64-v8a ELF libraries use 4 KB LOAD alignment**. They include `libreactnative.so`, `libhermes.so`, `libc++_shared.so`, `libfbjni.so`, `libreanimated.so`, and `libappmodules.so`. Passing ZIP alignment alone does not establish 16 KB compatibility.

These library observations are from the existing debug build under `android/app/build/intermediates/merged_native_libs/debug/mergeDebugNativeLibs/out/lib/arm64-v8a`. Fresh preview/release artifacts must be checked separately.

## Publication blockers and remaining checks

1. **Target API is below the current Play requirement.** New mobile apps and updates must target API 36 or later from August 31, 2026. The project currently targets 34. API 36 officially requires AGP 8.9.1 or later; a target-number-only edit is not the complete upgrade. See [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk) and [Android build tool compatibility](https://developer.android.com/build/releases/about-agp).
2. **Native libraries do not support 16 KB pages in the inspected build.** React Native announced full 16 KB support in 0.77. Updating only this app's NDK or ZIP alignment cannot repair prebuilt React Native/Hermes binaries. Upgrade compatible dependencies and verify every shipped native library, then run on a 16 KB device/emulator. The current Android guide requires 16 KB support for API 35+ apps on Play and lists February 1, 2027 as the update-enforcement date; recheck the guide and Play Console when publishing. See [React Native 0.77 release notes](https://reactnative.dev/blog/2025/01/21/version-0.77) and [Android 16 KB support](https://developer.android.com/guide/practices/page-sizes).
3. **Production backend and signing credentials are not supplied.** Localhost development access is useful for a local preview only. A distributed release needs its configured HTTPS backend and a private upload/signing key. The repository's `android/app/debug.keystore` is a public development key, not a production identity. An unsigned AAB can prove packaging succeeds, but cannot be uploaded as a signed production release or installed directly.
4. **Google Sign-In requires the exact package and signing identity.** `src/features/auth/data/services/googleSignIn.ts` uses a Web client ID. Android OAuth configuration must also contain the package name and certificate SHA-1 for the installed build. A separate `com.topikapp.preview` package needs its own Android OAuth registration even when using the same debug key. Play-distributed builds need the Play app-signing certificate registered. External registrations were not verified. See the library's [configuration guide](https://react-native-google-signin.github.io/docs/setting-up/get-config-file).

The currently installed emulator has 4 KB pages. A successful smoke test there does not validate 16 KB compatibility. Microphone/TTS quality also still needs a real-device check.

## Read-only artifact checks (PowerShell)

Run from `C:\TopikApp`. Replace the APK and library-directory paths below with the actual variant under review. These examples inspect build output without modifying it.

```powershell
$auditSdk = 'C:\Users\lhagv\AppData\Local\Android\Sdk'
$auditApk = 'C:\TopikApp\android\app\build\outputs\apk\preview\app-preview.apk'

# Package, version, SDKs and packaged architectures.
& "$auditSdk\build-tools\35.0.0\aapt.exe" dump badging $auditApk |
  Select-String 'package:|sdkVersion|targetSdkVersion|native-code'

# Check the release/debuggable and cleartext/network-security manifest values.
& "$auditSdk\build-tools\35.0.0\aapt.exe" dump xmltree $auditApk AndroidManifest.xml |
  Select-String 'debuggable|usesCleartextTraffic|networkSecurityConfig|testOnly'

# Certificate verification and SHA-1. Fingerprints are public; never print passwords.
& "$auditSdk\build-tools\35.0.0\apksigner.bat" verify --verbose --print-certs $auditApk

# ZIP alignment. Exit code must be 0, but this does not check ELF alignment.
& "$auditSdk\build-tools\35.0.0\zipalign.exe" -c -P 16 4 $auditApk
$LASTEXITCODE

# ELF LOAD alignment: every segment must be at least 2**14 for 16 KB support.
$auditObjdump = "$auditSdk\ndk\26.1.10909125\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-objdump.exe"
$auditNativeLibs = 'C:\TopikApp\android\app\build\intermediates\merged_native_libs\preview\mergePreviewNativeLibs\out\lib'
Get-ChildItem -LiteralPath $auditNativeLibs -Recurse -Filter *.so | ForEach-Object {
  $_.FullName
  & $auditObjdump -p $_.FullName | Select-String 'LOAD'
}

# Run after selecting/connecting the intended device; 16384 indicates 16 KB pages.
adb shell getconf PAGE_SIZE
```

For a final audit, use Android Studio **Build > Analyze APK** to inspect the actual packaged libraries and their alignment, not only intermediates. The Android guide also specifies checking `GNU_RELRO`: `(VirtAddr + MemSiz) % 0x4000 == 0`, using the NDK's `llvm-readelf.exe -Wl <library.so>` output.

If `bundletool` is installed, inspect the AAB separately (the path to its JAR depends on installation):

```powershell
java -jar <bundletool.jar> validate --bundle=<app.aab>
java -jar <bundletool.jar> dump config --bundle=<app.aab>
java -jar <bundletool.jar> dump manifest --bundle=<app.aab> --module=base
```

The bundle config should request `PAGE_ALIGNMENT_16K`; verify its resulting APKs and native ELF segments too. A valid bundle structure does not establish production backend readiness, correct signing, store-policy compliance, or runtime compatibility.
