# Android APK / AAB

## Одоогийн local backend-тэй туршилт

Төслийн үндсэн хавтсаас:

```powershell
cd C:\TopikApp
npm run android:preview
```

Гарах файлууд:

- `android/app/build/outputs/apk/preview/app-preview.apk` — шууд суулгана.
- `android/app/build/outputs/bundle/preview/app-preview.aab` — багц үүсгэлтийг шалгах зориулалттай; шууд суулгах файл биш.

Энэ нь JavaScript-ээ дотроо агуулсан, Metro шаардахгүй, `debuggable=false` build.
`TopikApp Preview` (`com.topikapp.preview`) нэрээр хөгжүүлэлтийн апптай зэрэгцэн сууна.
Өмнөх аппын хэрэглэгчийн мэдээлэл болон татсан толь руу хандахгүй; тусдаа storage-той.
Нийтийн debug key-ээр гарын үсэг зурсан тул production/Play Store-д зориулсан хувилбар биш.

Backend-ээ тусдаа терминалд асаана:

```powershell
cd C:\TopikApp\backend
npm run dev
```

USB debugging зөвшөөрсөн утас эсвэл emulator холбоод:

```powershell
adb devices
adb reverse tcp:5000 tcp:5000
adb install -r C:\TopikApp\android\app\build\outputs\apk\preview\app-preview.apk
```

Нэгээс олон төхөөрөмж байвал `adb -s DEVICE_SERIAL reverse ...`, `adb -s DEVICE_SERIAL install ...` хэрэглэнэ.
Аппын API URL нь `http://localhost:5000/api`. USB холболт тасарвал local backend хүрэхгүй.
Дахин холбоход `adb reverse tcp:5000 tcp:5000` командыг давтана. HTTP зөвхөн loopback хаягуудад зөвшөөрөгдөнө.

Google login ашиглавал шинэ `com.topikapp.preview` package + debug SHA-1-д Android OAuth client бүртгүүлэх шаардлагатай.
Имэйл нэвтрэлт нь энэ Android OAuth бүртгэлээс хамаарахгүй.

## Production-д шилжүүлэх

`npm run android:release` нь дараах орчны хувьсагчгүй үед build-ийг зогсооно:

- `TOPIK_API_URL`: нийтэд хүрэх HTTPS backend, `/api` төгсгөлтэй. Одоогийн default нь
  `https://topikapp-api.shine-ekhlel-narkhan.workers.dev/api`; өөр backend ашиглах үед л override хийнэ.
- `TOPIK_UPLOAD_STORE_FILE`: Git-ээс гадуур хадгалсан хувийн keystore-ийн зам.
- `TOPIK_UPLOAD_STORE_PASSWORD`, `TOPIK_UPLOAD_KEY_ALIAS`, `TOPIK_UPLOAD_KEY_PASSWORD`: signing тохиргоо.

Нууц үгээ чат, Git, скриптэд бичихгүй. Keystore-оо найдвартай нөөцөлнө.
URL нь апп дотор харагдах нийтэд нээлттэй тохиргоо; түүнд нууц түлхүүр оруулж болохгүй.

HTTPS болон keystore нэмэхээс гадна одоогийн target SDK / native 16 KB нийцлийг шинэчлэх шаардлагатай.
Энэ ажил RN/native dependency upgrade хийгээгүй. Дэлгэрэнгүйг [release audit](ANDROID_RELEASE_AUDIT.md)-аас үзнэ.
