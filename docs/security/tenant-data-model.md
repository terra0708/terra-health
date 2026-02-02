## Tenant Veri Modeli ve İzolasyon (Auth vs Tenant Şemaları)

### 1. Kimlik ve Yetkilendirme (public şeması)

- **Tablo**: `public.users`
  - Alanlar (özet):
    - `email` (login kimliği)
    - `password` (BCrypt hash)
    - `first_name`, `last_name`
    - `tenant_id` (kullanıcının ait olduğu tenant)
    - `enabled`, `deleted` benzeri durum alanları
  - İlişkiler:
    - `user_roles` tablosu üzerinden roller (`ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_AGENT`, vb.)
- **Yetkilendirme Tabloları** (public):
  - `permissions`, `permission_bundles`, `user_permissions`, `tenant_modules` vb.
  - Tüm bu tablolar tenant bazlı izolasyon için `tenant_id` ile işaretlenir.
- **Amaç**:
  - Login ve global yetkilendirme mantığının merkezileştirilmesi.
  - Kullanıcı arama, Super Admin operasyonları gibi çok-tenant’lı işlemler için ortak bir kimlik katmanı sunmak.

### 2. Tenant’a Özel Profil ve Domain Verisi (tenant şemaları)

- Her tenant’ın kendi şeması vardır (ör. `tenant_xxx`).
- **Örnek Tablo**: `user_profiles`
  - Alanlar (özet):
    - `user_id` (FK → `public.users.id`)
    - `tc_no`
    - `birth_date`
    - `address`
    - `emergency_person`
    - `emergency_phone`
    - `created_at`, `updated_at`, `deleted`, vb.
- **Amaç**:
  - Kişisel, hassas veya domain’e özel verilerin her tenant’ın kendi şeması içinde tutulması.
  - Böylece:
    - Bir tenant’ın profil verisi diğerinden fiziksel olarak ayrılır.
    - Google/Meta gibi denetimlerde “sensitive data tenant bazında izole edildi” argümanı güçlenir.

### 3. Erişim Modeli ve Güvenlik Katmanı

- **Multi-tenancy**:
  - `TenantContext` ve `MultiTenantConnectionProvider` üzerinden her request için doğru tenant şemasına `search_path` ayarlanır.
  - Auth ve discovery akışları `public` şeması üzerinde çalışır.
- **Tenant Güvenliği**:
  - `TenantSecurityService`:
    - JWT içinden `tenantId` ve kullanıcı kimliğini çıkarır.
    - `validateUserActiveAndBelongsToTenant(userId)` gibi metotlarla, istenen kaynağın ilgili tenant’a ait olduğunu doğrular.
- **Controller Katmanı**:
  - Tenant admin endpoint’leri (`/api/v1/tenant-admin/**`):
    - `@PreAuthorize` ile rol/yetki kontrolü (örn. `SETTINGS_USERS`).
    - Controller içinde `TenantSecurityService` çağrıları ile ek izolasyon kontrolleri.

### 4. Örnek Akışlar

- **Login**:
  - Frontend sadece `email + password` gönderir.
  - Backend, `public.users` ve tenant bilgisi üzerinden kullanıcıyı doğrular.
  - JWT içine `tenantId`, roller ve izinler yazılır.
- **Tenant Kullanıcısı Profil Güncelleme**:
  - Endpoint: `PUT /api/v1/tenant-admin/users/{userId}/profile`
  - Akış:
    - `TenantSecurityService.validateUserActiveAndBelongsToTenant(userId)`
    - Doğru tenant şemasındaki `user_profiles` tablosunda insert/update.

### 5. Denetim (Google/Meta vb.) İçin Özet

- Kimlik ve login bilgileri (`email`, şifre hash’i, temel isim alanları) **sadece** `public.users` tablosunda tutulur.
- Hassas kişisel veriler (TC kimlik, adres, doğum tarihi, acil durum kişisi/telefonu, sağlık/CRM kayıtları vb.):
  - Her tenant’ın **kendi** şemasındaki tablolarda saklanır.
- Tüm erişimler:
  - JWT içindeki `tenantId`,
  - `TenantSecurityService` kontrolleri
  - ve permission/bundle yapısı ile tenant bazlı olarak sınırlandırılır.

