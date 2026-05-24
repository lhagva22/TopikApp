# Database SQL Materials

Энэ хавтас нь app runtime код биш. Supabase/PostgreSQL database-ийг шинээр
бэлтгэх, seed өгөгдөл дахин оруулах, хадгалж сэргээхэд ашиглах SQL материалуудыг
эмхэлж хадгална.

## Structure

```text
sql/
  setup/
    payments_qpay_setup.sql
  seeds/
    mock_tests/
      topik_i/       # TOPIK I mock test seed SQL
      topik_ii/      # TOPIK II mock test seed SQL
      manifests/     # Storage asset upload manifest JSON
```

## Usage

1. Database schema/table/policy бэлэн болсон database дээр `setup/` доторх
   нэмэлт тохиргооны SQL-ийг шаардлагатай үед ажиллуулна.
2. Mock test өгөгдөл дахин оруулах бол `seeds/mock_tests/topik_i/` болон
   `seeds/mock_tests/topik_ii/` доторх сонгосон SQL файлыг Supabase SQL Editor
   эсвэл migration хэрэгслээр ажиллуулна.
3. Media asset дахин upload хийх үед `manifests/` доторх JSON-ийг
   `scripts/upload_topik_96_assets.cjs` script ашиглан уншуулна.

Database-д өгөгдөл аль хэдийн орсон үед эдгээр SQL файлыг app ажиллах болгонд
ажиллуулах шаардлагагүй. Backend нь database дахь хүснэгтээс өгөгдлөө шууд
уншина.
