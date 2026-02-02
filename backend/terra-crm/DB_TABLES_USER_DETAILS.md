# Kullanıcı Detayları – Hangi Tablolara Bakmalı?

## 1. Kişisel bilgiler (TC, doğum tarihi, adres, acil durum)

Bu veriler **tenant şemasında** tutulur (her tenant’ın kendi şeması).

- **Tablo:** `user_profiles`
- **Şema:** Tenant’a özel. Şema adı `public.tenants` tablosundan gelir.

**Adımlar:**

1. Tenant’ınızın şema adını bulun:
   ```sql
   SELECT id, name, schema_name FROM public.tenants;
   ```
   Örnek: `schema_name` = `tp_a7b2c9d1`

2. O şemadaki profil kayıtlarına bakın (şema adını kendi değerinizle değiştirin):
   ```sql
   SELECT * FROM tp_a7b2c9d1.user_profiles WHERE user_id = 'KULLANICI_UUID';
   ```
   Kolonlar: `id`, `user_id`, `tc_no`, `birth_date`, `address`, `emergency_person`, `emergency_phone`, `created_at`, `updated_at`, `deleted`, ...

**Not:** Kullanıcı oluştururken TC, doğum tarihi, adres, acil kişi/telefon alanlarından **en az biri** doldurulmazsa backend’e profil gönderilmez ve bu tabloda **hiç satır oluşmaz**. Düzenleme ekranında profil güncellemesi henüz yok; sadece oluşturma anında doldurulan profil kaydedilir.

---

## 2. Yetki paketleri (Yetki Paketleri alanı)

Bunlar **public** şemada tutulur.

- **Hangi kullanıcıya hangi paket atanmış:** `public.user_bundles`  
  Kolonlar: `user_id`, `bundle_id`, ...

- **Paket adları (örn. "asd"):** `public.permission_bundles`  
  Kolonlar: `id`, `name`, `description`, `tenant_id`, ...

**Kontrol:**

```sql
-- Kullanıcının atanmış paketleri
SELECT ub.user_id, ub.bundle_id, pb.name AS bundle_name
FROM public.user_bundles ub
JOIN public.permission_bundles pb ON pb.id = ub.bundle_id
WHERE ub.user_id = 'KULLANICI_UUID';
```

---

## 3. İsim, e‑posta, roller (temel bilgiler)

- **Kullanıcı:** `public.users`  
  Kolonlar: `id`, `email`, `first_name`, `last_name`, `tenant_id`, `enabled`, ...
- **Roller:** `public.user_roles` (join), `public.roles`

---

## Özet

| Görünen alan           | Tablo / şema                          |
|------------------------|----------------------------------------|
| İsim, kurumsal e‑posta | `public.users`                         |
| TC, doğum, adres, acil | `{tenant_schema}.user_profiles`        |
| Yetki paketleri       | `public.user_bundles` + `public.permission_bundles` |

Tenant şema adını her zaman `public.tenants.schema_name` ile alın; örnek: `SELECT schema_name FROM public.tenants WHERE id = 'TENANT_UUID';`
