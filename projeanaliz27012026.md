# Terra Health CRM - Proje Analizi ve Durum Raporu
**Tarih:** 27.01.2026
**Hazırlayan:** Antigravity (AI Assistant)

## 1. Proje Genel Bakış
Terra Health, Sağlık Turizmi sektörüne yönelik geliştirilen, ölçeklenebilir, çok kiracılı (multi-tenant) bir CRM (Müşteri İlişkileri Yönetimi) platformudur. Proje, farklı sağlık turizmi acentelerinin (tenant) kendi müşterilerini, randevularını ve operasyonlarını izole edilmiş bir ortamda yönetmelerine olanak tanır.

Merkezi bir "Süper Admin" paneli üzerinden tenant yönetimi yapılmakta, her yeni müşteri için saniyeler içinde yeni bir veritabanı şeması (schema) tahsis edilebilmektedir.

## 2. Teknoloji Yığını

### Backend
*   **Framework:** Java Spring Boot 3.x
*   **Veritabanı:** PostgreSQL
*   **ORM:** Hibernate / JPA
*   **Migrasyon:** Flyway (Dinamik şema migrasyonları için)
*   **Güvenlik:** Spring Security + JWT
*   **Build Tool:** Maven

### Frontend
*   **Framework:** React v18
*   **Build Tool:** Vite
*   **Dil:** JavaScript (ES6+)
*   **UI Kütüphanesi:** Material UI (MUI) + Tailwind CSS
*   **Durum Yönetimi:** Zustand (Auth ve genel state yönetimi için)
*   **Form Yönetimi:** React Hook Form + Zod (Validasyon)
*   **İletişim:** Axios (Interceptor yapısı ile)

## 3. Mimari ve Altyapı Detayları

### 3.1. Multi-Tenancy (Çok Kiracılılık) Yapısı
Proje, veri izolasyonunu sağlamak için **"Schema-per-Tenant"** (Her kiracıya ayrı şema) stratejisini kullanmaktadır.
*   **Public Schema:** Ortak verilerin tutulduğu alan. `users` (tüm kullanıcılar), `tenants` (kiracı bilgileri), `roles`, `permissions` tabloları burada bulunur.
*   **Tenant Schemas:** Her müşteri için oluşturulan dinamik şemalar (örn: `tenant_acme_123`). Müşteriye özel veriler (hastalar, randevular vb.) burada tutulur.

### 3.2. Schema Pool (Şema Havuzu) Sistemi
Tenant oluşturma sürecini hızlandırmak için gelişmiş bir **Schema Pool** mekanizması geliştirilmiştir.
*   Sistem arka planda (async) boş ve hazır şemalar oluşturur (`READY` statüsü).
*   Yeni bir tenant talep edildiğinde, havuzdaki en eski hazır şema anında atanır (`ASSIGNED`).
*   Bu sayede tenant oluşturma işlemi veritabanı migrasyonlarını beklemek zorunda kalmaz, milisaniyeler sürer.

### 3.3. Kimlik Doğrulama ve Güvenlik
*   **JWT Tabanlı Auth:** Access Token (15dk) ve Refresh Token (7 gün - HttpOnly Cookie) yapısı.
*   **Tenant Context:** İsteklerde `X-Tenant-ID` başlığı kullanılarak hangi tenant üzerinde işlem yapıldığı belirlenir.
*   **Interceptor:** `TenantInterceptor` gelen istekleri yakalar ve doğru veritabanı şemasını `TenantContext` üzerinden set eder.
*   **Login Akışı:**
    1.  E-posta kontrolü (Tenant Discovery).
    2.  Kullanıcının hangi tenantlara üye olduğu belirlenir.
    3.  Şifre ve seçilen Tenant ID ile giriş yapılır.

## 4. Son Yapılan Kritik Düzeltmeler (27.01.2026)

Bugün yapılan oturumda, özellikle Tenant Admin oluşturma ve giriş süreçlerindeki kritik hatalar giderilmiştir.

### 4.1. Email Case-Sensitivity (Büyük/Küçük Harf) Sorunu
**Sorun:** Kullanıcı oluşturulurken "Admin@Terra.com" gibi büyük harfli giriş yapıldığında, veritabanına bu şekilde kaydediliyor ancak giriş yaparken veya sorgularken "admin@terra.com" kullanıldığında eşleşme sağlanamıyordu. Bu durum "User already exists" hatası alırken aynı maille login olamama paradoksuna yol açıyordu.

**Çözüm:**
1.  **Normalizasyon:** `AuthService` ve `SuperAdminService` katmanlarında tüm e-posta girişleri işlenmeden önce `.toLowerCase().trim()` fonksiyonları ile normalize edildi. Artık tüm mailler küçük harfle kaydediliyor.
2.  **Sorgu Güncellemesi:** `UserRepository` içindeki JPQL sorguları `LOWER(u.email) = LOWER(:email)` şeklinde revize edildi. Bu sayede veritabanında eski (büyük harfli) kayıtlar kalsa bile giriş yapılabilmesi sağlandı.

### 4.2. Tenant Admin Oluşturma Akışı
**Yapılan İşlem:** `SuperAdminService.createTenantWithAdminAndModules` metodu güncellendi.
*   Admin kullanıcısı oluşturulurken email artık kesinlikle normalize ediliyor.
*   Transaction yönetimi dead-lock oluşmayacak şekilde (önce okuma, sonra yazma) düzenlendi.

### 4.3. Giriş (Login) Esnekliği
**Yapılan İşlem:** `AuthService.login` metodunda sıkı `X-Tenant-ID` kontrolü esnetildi.
*   Normal kullanıcılar için header gönderilmese bile, kullanıcının kayıtlı olduğu tenant otomatik olarak varsayılıyor.
*   Bu sayede Super Admin olmayan kullanıcılar frontend tarafında header karmaşası yaşamadan giriş yapabiliyor.

## 5. Mevcut Modül Durumları

| Modül | Durum | Notlar |
| :--- | :--- | :--- |
| **Auth** | ✅ Stabil | Login, Register, Refresh Token, Tenant Discovery çalışıyor. |
| **Super Admin** | ✅ Stabil | Tenant oluşturma (modül seçimi ile), Admin atama, Havuz istatistikleri çalışıyor. |
| **Tenant Yönetimi** | ✅ Stabil | Tenant suspend/active işlemleri, modül yetkilendirmesi çalışıyor. |
| **Kullanıcı İşlemleri**| ✅ Stabil | E-posta güncelleme, şifre sıfırlama (normalizasyon eklendi). |
| **Frontend UI** | ⚠️ Geliştiriliyor | Temel akışlar çalışıyor, validasyon mesajları iyileştirildi. |

## 6. Önerilen Gelecek Adımlar

1.  **Eski Veri Temizliği:** Veritabanında şu an "Mixed Case" (büyük/küçük harf karışık) duran email adresleri için bir defalık SQL script çalıştırılarak hepsi küçük harfe çevrilmeli.
    *   *Örnek:* `UPDATE users SET email = LOWER(email);`
2.  **Validasyon Katmanı:** Frontend tarafında e-posta inputlarına `autoCapitalize="none"` eklenmesi ve Zod şemalarında `.toLowerCase()` transformasyonu uygulanması UX açısından faydalı olacaktır.
3.  **Log İzleme:** Yeni tenant oluşturma süreçlerindeki loglar önümüzdeki birkaç gün takip edilmeli.
4.  **Test Otomasyonu:** "Tenant Creation" akışı için uçtan uca (E2E) bir test yazılması, bu kritik akışın bozulmamasını garantiler.

## 7. Dosya Değişiklik Özeti (Bugün)
*   `UserRepository.java`: Case-insensitive sorgular eklendi.
*   `SuperAdminService.java`: Tenant ve Admin oluştururken email normalizasyonu eklendi.
*   `AuthService.java`: Login ve Register işlemlerinde email normalizasyonu eklendi.
