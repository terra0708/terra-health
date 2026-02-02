## Zorunlu Şifre Değiştirme (must_change_password) Tasarımı

### 1. Veri Modeli

- **public.users** tablosuna yeni bir kolon eklenir:
  - `must_change_password BOOLEAN NOT NULL DEFAULT FALSE`
- Amaç:
  - Geçici/otomatik üretilen şifrelerle oluşturulan tüm kullanıcılar için bu flag `TRUE` yapılır.
  - Kullanıcı kendi şifresini başarıyla güncellediğinde flag `FALSE` yapılır.

### 2. Backend Akışı

- **Şifre üreterek kullanıcı oluşturulan yerler**:
  - `TenantUserService.createUserForTenant(...)`
  - `SuperAdminService.createTenantWithAdminAndModules(...)`
  - `SuperAdminService.createTenantAdmin(...)`
- Bu metotlarda:
  - Şifre sistem tarafından üretildiyse:
    - `user.setMustChangePassword(true)` (veya benzer bir alan).
  - Şifre Super Admin/tenant admin tarafından manuel verildiyse:
    - Varsayılan davranış: `mustChangePassword` **isteğe bağlı**; ilk fazda `false` bırakılabilir.

- **Login Sonrası Kontrol**:
  - `AuthService.login(...)` veya access/refresh token üreten servis:
    - Authentication başarılı olduktan sonra user.mustChangePassword kontrol edilir.
    - `LoginResponse` içine örneğin `mustChangePassword: true` alanı eklenir.

- **Şifre Değiştirme Endpoint’i**:
  - Örnek: `POST /api/v1/auth/change-password`
  - Body: `{ oldPassword, newPassword }`
  - İşlem:
    - Eski şifre doğrulanır.
    - Yeni şifre bcrypt ile hash’lenir.
    - `user.setPassword(encodedNewPassword)`
    - `user.setMustChangePassword(false)`
    - İlgili refresh token’lar revoke edilir (yeniden login zorunluluğu).

### 3. Frontend Akışı

- **Login Sonrası Yönlendirme**:
  - Auth store, `LoginResponse` içindeki `mustChangePassword` alanını okur.
  - Eğer `true` ise:
    - Kullanıcı normal dashboard’a değil, “Şifre Değiştir” sayfasına yönlendirilir.
    - Örneğin route: `/auth/force-change-password`

- **Zorunlu Şifre Değiştir Sayfası**:
  - Form alanları:
    - Mevcut şifre (opsiyonel; backend tasarımına göre)
    - Yeni şifre
    - Yeni şifre tekrar
  - Başarılı olursa:
    - Kullanıcıya bilgi mesajı gösterilir.
    - Yeniden login akışına yönlendirilebilir veya backend yeni token seti dönecek şekilde tasarlanabilir.

- **Guard/Middleware**:
  - Route guard, auth state içindeki `mustChangePassword` flag’ini kontrol ederek:
    - Bu flag `true` iken diğer uygulama sayfalarına erişimi engeller.
    - Sadece şifre değiştirme sayfasına erişime izin verir.

### 4. Güvenlik Notları

- Geçici şifreler yalnızca bir kez UI’da gösterilir; backend bu şifreleri tekrar döndürmez.
- Şifre değişimi sonrası:
  - Tüm refresh/access token’lar geçersiz kılınır.
  - Yeni token seti ile devam edilir.
- `must_change_password` bilgisi sadece auth katmanında ve frontend yönlendirme mantığında kullanılır; domain verisi ile paylaşılmaz.

