# TOPIK MATE push notification тохиргоо

## 1. Database migration

`psql`-ийн `postgres=>` цонхонд:

```sql
\i 'C:/TopikApp/backend/sql/migrations/20260924_push_notifications.sql'
```

## 2. Firebase server credential

Firebase Console → Project settings → Service accounts → Generate new private key.
Татсан JSON-ийг Git-д хийж болохгүй. Дараах утгуудыг Cloudflare secret болгоно:

```powershell
cd C:\TopikApp\backend
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put FIREBASE_CLIENT_EMAIL
npx wrangler secret put FIREBASE_PRIVATE_KEY
npx wrangler secret put PUSH_WEBHOOK_SECRET
```

- `FIREBASE_PROJECT_ID`: JSON-ийн `project_id`
- `FIREBASE_CLIENT_EMAIL`: JSON-ийн `client_email`
- `FIREBASE_PRIVATE_KEY`: JSON-ийн `private_key` утгыг бүтнээр нь
- `PUSH_WEBHOOK_SECRET`: өөрөө үүсгэсэн урт, санамсаргүй secret

Дараа нь `npm run cloudflare:deploy`.

## 3. Supabase Database Webhooks

Supabase Dashboard → Database → Webhooks хэсэгт хоёр webhook үүсгэнэ.

Хоёуланд нь:

- Event: `INSERT`
- Method: `POST`
- URL: `https://topikapp-api.shine-ekhlel-narkhan.workers.dev/api/notifications/content-created`
- HTTP header: `x-webhook-secret` = Cloudflare-ийн `PUSH_WEBHOOK_SECRET`-тэй яг ижил утга

Эхний webhook table: `learning_contents`.

Хоёр дахь webhook table: `mock_test_bank`.

`korean_grammar_lessons_v2` болон dictionary хүснэгтүүдэд webhook үүсгэхгүй.

## 4. Туршилт

1. Шинэ APK build хийж утсанд суулгана.
2. Хүчинтэй premium хэрэглэгчээр нэвтэрнэ.
3. Notification permission-ийг зөвшөөрнө.
4. Supabase-д нэг шинэ идэвхтэй хичээл эсвэл шалгалт нэмнэ.
5. Background/хаалттай үед Android notification, foreground үед app alert ирнэ.
