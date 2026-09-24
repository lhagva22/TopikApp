# Supabase backup and restore

Энэ backup нь нэг SQL файл биш. Дараах хэсгүүдийг нэг timestamp-тай хавтаст хадгална:

- `roles.sql`, `schema.sql`, `data.sql` — database schema/data, `auth.users`, identities, password hash, Storage metadata.
- `objects/*.blob`, `storage-manifest.json` — Storage bucket доторх бодит зураг, аудио, видео, файл болон SHA-256 checksum.
- `backup-manifest.json` — эх project, файл бүрийн хэмжээ/checksum.

`auth.users`-ийн password hash хадгалагдах тул хэрэглэгч password-аа дахин тохируулахгүйгээр шинэ project руу шилжиж болно. Гэхдээ шинэ project өөр JWT/signing key-тэй бол өмнөх access/refresh token хүчингүй болж хэрэглэгч дахин нэвтэрнэ.

Auth provider secret, SMTP password, redirect URL, custom domain, Edge Function secret, webhook, Realtime publication зэрэг platform тохиргоо database dump-д бүрэн ордоггүй. Restore хийсний дараа Dashboard дээр дахин тохируулна. Supabase Management API-аас авсан config дотор provider secret-үүд HMAC/далд хэлбэртэй ирдэг тул түүнийг жинхэнэ secret-ийн backup гэж үзэж болохгүй.

## 1. Backup авах

Repo өмнө нь `supabase link` хийгдсэн бол шууд ажиллуулна:

```powershell
cd C:\TopikApp
npm run backup:supabase
```

Link хийгдээгүй үед Session pooler connection string-ээ Dashboard → **Connect → Session pooler** хэсгээс авч, тухайн PowerShell session-д оноогоод ажиллуулна:

```powershell
$env:SUPABASE_DB_URL = Read-Host 'Session pooler connection string'
cd C:\TopikApp
npm run backup:supabase
```

Үр дүн `C:\TopikApp\backups\supabase-YYYYMMDDTHHMMSSZ` дотор гарна. `backups/` Git-д орохгүй. Backup хавтсаа төслийн компьютероос тусдаа encrypted drive/cloud storage-д хуулна. Database URL болон service key manifest-д бичигдэхгүй.

Backup зөвхөн бүх алхам амжилттай дуусч `Backup complete` гэж гарсан үед хүчинтэй. Storage-ийн том файлуудын хэмжээнээс шалтгаалан удаж болно. Supabase Storage S3 object versioning дэмждэггүй учраас устсан object-ийг зөвхөн ийм тусдаа backup-аас сэргээнэ.

## 2. Restore турших

Эх project дээр шууд restore хийхийг скрипт зориуд хориглоно. Эхлээд шинэ Supabase project үүсгэж, шаардлагатай extension-үүдээ идэвхжүүлнэ. Шинэ project-ийн URL болон service role key-г Git-ээс гадуур жишээ нь `C:\secure\topik-restore.env` файлд хадгална:

```dotenv
SUPABASE_URL=https://NEW_PROJECT_REF.supabase.co
SUPABASE_SERVICE_KEY=target-service-role-key
```

Target Session pooler URL-г session-д оноогоод эхлээд dry-run хийнэ:

```powershell
$env:SUPABASE_DB_URL = Read-Host 'TARGET Session pooler connection string'
cd C:\TopikApp
.\scripts\supabase-backup\restore-supabase.ps1 `
  -BackupDirectory 'C:\TopikApp\backups\supabase-YYYYMMDDTHHMMSSZ' `
  -ConfirmTargetProjectRef 'NEW_PROJECT_REF' `
  -TargetEnvFile 'C:\secure\topik-restore.env'
```

Dry-run checksum болон target project-ийг шалгана. Шинэ/хоосон target гэдгийг дахин баталгаажуулсны дараа яг ижил команд дээр `-Execute` нэмнэ. Storage object аль хэдийн байвал default-оор дарж бичихгүй; зориуд солих шаардлагатай үед л `-OverwriteStorage` нэмнэ.

## Restore дараах зайлшгүй шалгалт

1. Auth email/provider, SMTP, redirect URLs, JWT/signing key болон email templates.
2. Database extensions, webhooks, cron jobs, Realtime publications.
3. Storage bucket public/private төлөв, policies, object count ба хэд хэдэн том файлын playback.
4. Хэрэглэгч login, profile, төлбөр, dictionary, grammar, TOPIK exam/history/progress.
5. Cloudflare Worker-ийн Supabase URL/key-г зөвхөн бүх шалгалт дууссаны дараа шинэ project руу солино.

Source project-ээ устгахаас өмнө шинэ project дээр бүрэн restore rehearsal хийж баталгаажуулах нь backup байгаа эсэхээс илүү чухал.

## Албан ёсны эх сурвалж

- [Supabase CLI backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Storage objects download and metadata](https://supabase.com/docs/guides/storage/management/download-objects)
- [Auth users and password hash migration](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects)
- [Storage S3 compatibility and versioning limitation](https://supabase.com/docs/guides/storage/s3/compatibility)
