# Cookie-Based Auth Migration - Test Kontrol Listesi

## Faz 0: HTTPS Kurulumu Kontrolü ✅

- [x] mkcert kurulumu tamamlandı
- [x] Sertifikalar oluşturuldu (`localhost.pem`, `localhost-key.pem`)
- [x] Keystore oluşturuldu (`keystore.p12`)
- [x] Dosyalar doğru konumlara taşındı:
  - [x] `frontend/terra/localhost.pem`
  - [x] `frontend/terra/localhost-key.pem`
  - [x] `backend/terra-crm/src/main/resources/ssl/keystore.p12`
- [x] `.gitignore` güncellendi

## Faz 1: Backend Hazırlık Kontrolü ✅

- [x] `application.yaml` - HTTPS, CORS, cookie secure flag konfigürasyonu
- [x] `CookieUtil.java` - Access token cookie metodları eklendi
- [x] `SecurityConfig.java` - CSRF aktif, CORS origins application.yaml'dan okunuyor
- [x] `AuthController.java` - Login/refresh/logout güncellendi
- [x] `AuthService.java` - `revokeRefreshToken` metodu eklendi
- [x] `JwtAuthenticationFilter.java` - Cookie okuma desteği eklendi

## Faz 2: Backend Test (ŞİMDİ YAPILACAK)

### 2.1. Backend Başlatma ve HTTPS Kontrolü

**Adımlar:**
1. Backend'i başlat:
   ```bash
   cd backend/terra-crm
   ./mvnw spring-boot:run
   # veya
   mvn spring-boot:run
   ```

2. Backend HTTPS kontrolü:
   - [ ] Backend `https://localhost:8443` üzerinde çalışıyor mu?
   - [ ] Tarayıcıda "Güvenli Değil" uyarısı YOK mu? (mkcert sayesinde)
   - [ ] Public endpoint test: `https://localhost:8443/api/v1/auth/discover` çalışıyor mu?

### 2.2. Cookie Ayarları Testi

**Test Senaryoları:**

1. **Login Endpoint Cookie Testi:**
   ```bash
   curl -X POST https://localhost:8443/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -H "X-Tenant-ID: <tenant-id>" \
     -d '{"email":"test@example.com","password":"password"}' \
     -v --cookie-jar cookies.txt
   ```
   
   Kontroller:
   - [ ] Response'da `Set-Cookie: accessToken=...` header'ı var mı?
   - [ ] Response'da `Set-Cookie: refreshToken=...` header'ı var mı?
   - [ ] `accessToken` cookie'si `HttpOnly`, `Secure`, `SameSite=Lax` mi?
   - [ ] `refreshToken` cookie'si `HttpOnly`, `Secure`, `SameSite=Strict` mi?
   - [ ] Response body'de `token` ve `refreshToken` alanları YOK mu?

2. **Refresh Endpoint Cookie Testi:**
   ```bash
   curl -X POST https://localhost:8443/api/v1/auth/refresh \
     --cookie cookies.txt \
     -v
   ```
   
   Kontroller:
   - [ ] Yeni `accessToken` cookie'si gönderiliyor mu?
   - [ ] Token rotation durumunda yeni `refreshToken` cookie'si gönderiliyor mu?
   - [ ] Response body'de token alanları YOK mu?

3. **Logout Endpoint Cookie Testi:**
   ```bash
   curl -X POST https://localhost:8443/api/v1/auth/logout \
     --cookie cookies.txt \
     -v
   ```
   
   Kontroller:
   - [ ] Her iki cookie de `Max-Age=0` ile temizleniyor mu?
   - [ ] Refresh token veritabanında revoke ediliyor mu?

### 2.3. CSRF Token Testi

**Test Senaryoları:**

1. **CSRF Token Cookie Kontrolü:**
   ```bash
   curl -X GET https://localhost:8443/api/v1/auth/discover \
     -H "Content-Type: application/json" \
     -v --cookie-jar csrf-cookies.txt
   ```
   
   Kontroller:
   - [ ] Response'da `Set-Cookie: XSRF-TOKEN=...` header'ı var mı?
   - [ ] CSRF token cookie'si `HttpOnly=false` mi? (Frontend'in okuyabilmesi için)

2. **CSRF Token Header Testi:**
   ```bash
   # CSRF token'ı cookie'den oku
   XSRF_TOKEN=$(grep XSRF-TOKEN csrf-cookies.txt | awk '{print $7}')
   
   curl -X POST https://localhost:8443/api/v1/some-endpoint \
     -H "X-XSRF-TOKEN: $XSRF_TOKEN" \
     --cookie csrf-cookies.txt \
     -v
   ```
   
   Kontroller:
   - [ ] CSRF token header ile istek başarılı mı?
   - [ ] CSRF token header olmadan istek 403 Forbidden mı? (Auth endpoint'leri hariç)

### 2.4. JWT Filter Cookie Okuma Testi

**Test Senaryoları:**

1. **Cookie'den Token Okuma:**
   ```bash
   # Login yap ve cookie'leri al
   curl -X POST https://localhost:8443/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -H "X-Tenant-ID: <tenant-id>" \
     -d '{"email":"test@example.com","password":"password"}' \
     --cookie-jar auth-cookies.txt
   
   # Protected endpoint'e cookie ile istek at
   curl -X GET https://localhost:8443/api/v1/health/leads \
     --cookie auth-cookies.txt \
     -H "X-Tenant-ID: <tenant-id>" \
     -v
   ```
   
   Kontroller:
   - [ ] Cookie'den token okunuyor mu?
   - [ ] İstek başarılı mı? (200 OK)
   - [ ] Log'da "DEPRECATED: Token read from Authorization header" mesajı YOK mu?

2. **Backward Compatibility Testi (Header Fallback):**
   ```bash
   # Header ile istek at (deprecated yöntem)
   curl -X GET https://localhost:8443/api/v1/health/leads \
     -H "Authorization: Bearer <token>" \
     -H "X-Tenant-ID: <tenant-id>" \
     -v
   ```
   
   Kontroller:
   - [ ] İstek hala çalışıyor mu? (Backward compatibility)
   - [ ] Log'da "DEPRECATED: Token read from Authorization header" mesajı VAR mı?

## Faz 3: Frontend Güncelleme Kontrolü ✅

- [x] `vite.config.js` - HTTPS server konfigürasyonu
- [x] `.env.development` - VITE_API_URL güncellendi
- [x] `api.js` - Authorization header kaldırıldı, xsrf ayarları eklendi
- [x] `authStore.js` - Token localStorage işlemleri kaldırıldı, logout güncellendi

## Faz 4: Frontend Test (ŞİMDİ YAPILACAK)

### 4.1. Frontend Başlatma ve HTTPS Kontrolü

**Adımlar:**
1. Frontend'i başlat:
   ```bash
   cd frontend/terra
   npm run dev
   # veya
   yarn dev
   ```

2. Frontend HTTPS kontrolü:
   - [ ] Frontend `https://localhost:5173` üzerinde çalışıyor mu?
   - [ ] Tarayıcıda "Güvenli Değil" uyarısı YOK mu?
   - [ ] Console'da SSL sertifika hatası YOK mu?

### 4.2. Login Akışı Testi

**Test Senaryoları:**

1. **Login ve Cookie Kontrolü:**
   - [ ] Login sayfasına git: `https://localhost:5173/login`
   - [ ] Geçerli credentials ile login yap
   - [ ] Browser DevTools > Application > Cookies kontrolü:
     - [ ] `accessToken` cookie'si oluştu mu?
     - [ ] `refreshToken` cookie'si oluştu mu?
     - [ ] Her ikisi de `HttpOnly`, `Secure` işaretli mi?
     - [ ] `accessToken` `SameSite=Lax` mi?
     - [ ] `refreshToken` `SameSite=Strict` mi?
   - [ ] Browser DevTools > Application > Local Storage kontrolü:
     - [ ] `token` anahtarı YOK mu? (localStorage'dan kaldırıldı)
     - [ ] `tenantId` anahtarı VAR mı? (Hala localStorage'da)

2. **API İstekleri Cookie Kontrolü:**
   - [ ] Login sonrası bir API isteği yap (örn: leads listesi)
   - [ ] Browser DevTools > Network > Request Headers kontrolü:
     - [ ] `Cookie: accessToken=...` header'ı VAR mı?
     - [ ] `Authorization: Bearer ...` header'ı YOK mu?
     - [ ] `X-XSRF-TOKEN` header'ı VAR mı?
   - [ ] İstek başarılı mı? (200 OK)

### 4.3. Token Refresh Akışı Testi

**Test Senaryoları:**

1. **Otomatik Token Refresh:**
   - [ ] Access token'ı manuel olarak expire et (backend'de expiration süresini kısalt veya bekleyerek)
   - [ ] Bir API isteği yap
   - [ ] Browser DevTools > Network kontrolü:
     - [ ] İlk istek 401 Unauthorized mı?
     - [ ] Otomatik `/v1/auth/refresh` isteği yapıldı mı?
     - [ ] Refresh sonrası orijinal istek tekrar denendi mi?
     - [ ] Yeni `accessToken` cookie'si gönderildi mi?
   - [ ] Kullanıcı logout olmadı mı? (Seamless refresh)

2. **Token Refresh Hata Senaryosu:**
   - [ ] Refresh token'ı manuel olarak invalid et (backend'de revoke et)
   - [ ] Bir API isteği yap
   - [ ] Kullanıcı otomatik olarak logout oldu mu?
   - [ ] `/login` sayfasına yönlendirildi mi?

### 4.4. Logout Akışı Testi

**Test Senaryoları:**

1. **Normal Logout:**
   - [ ] Login yap
   - [ ] Logout butonuna tıkla
   - [ ] Browser DevTools > Network kontrolü:
     - [ ] `/v1/auth/logout` endpoint'ine POST isteği yapıldı mı?
     - [ ] Response'da cookie'ler `Max-Age=0` ile temizlendi mi?
   - [ ] Browser DevTools > Application > Cookies kontrolü:
     - [ ] `accessToken` cookie'si silindi mi?
     - [ ] `refreshToken` cookie'si silindi mi?
   - [ ] Browser DevTools > Application > Local Storage kontrolü:
     - [ ] `tenantId` silindi mi?
   - [ ] `/login` sayfasına yönlendirildi mi?

2. **Logout Hata Senaryosu (Network Hatası):**
   - [ ] Login yap
   - [ ] Browser DevTools > Network > Offline modunu aktif et
   - [ ] Logout butonuna tıkla
   - [ ] Kontroller:
     - [ ] Logout endpoint çağrısı başarısız oldu mu?
     - [ ] Yine de cookie'ler ve localStorage temizlendi mi?
     - [ ] `/login` sayfasına yönlendirildi mi? (try-catch-finally garantisi)

### 4.5. CSRF Token Testi

**Test Senaryoları:**

1. **CSRF Token Otomatik Gönderimi:**
   - [ ] Login yap
   - [ ] Bir POST/PUT/DELETE isteği yap
   - [ ] Browser DevTools > Network > Request Headers kontrolü:
     - [ ] `X-XSRF-TOKEN` header'ı otomatik ekleniyor mu?
     - [ ] CSRF token cookie'den okunuyor mu?
   - [ ] İstek başarılı mı? (200 OK)

2. **CSRF Token Eksik Senaryosu:**
   - [ ] CSRF token cookie'sini manuel olarak sil
   - [ ] Bir POST isteği yap
   - [ ] İstek 403 Forbidden mı? (CSRF koruması çalışıyor)

## Faz 5: Production Hazırlık (Sonraki Adım)

- [ ] Production environment variable'ları ayarla
- [ ] Production SSL sertifikaları hazırla
- [ ] Documentation güncelle
- [ ] Rollback planı hazırla

## Kritik Kontrol Noktaları

### Güvenlik Kontrolleri

- [ ] Access token cookie `HttpOnly=true` ✅
- [ ] Refresh token cookie `HttpOnly=true` ✅
- [ ] Access token cookie `Secure=true` ✅
- [ ] Refresh token cookie `Secure=true` ✅
- [ ] Access token cookie `SameSite=Lax` ✅
- [ ] Refresh token cookie `SameSite=Strict` ✅
- [ ] CSRF koruması aktif ✅
- [ ] CORS `allowCredentials=true` ✅
- [ ] Token localStorage'da YOK ✅

### Performans Kontrolleri

- [ ] Cookie path'leri doğru mu?
  - [ ] Access token: `/api/v1` (tüm API isteklerinde gönderiliyor)
  - [ ] Refresh token: `/api/v1/auth/refresh` (sadece refresh endpoint'inde)
- [ ] Token refresh akışı concurrent request'lerde çalışıyor mu?
- [ ] Logout her durumda çalışıyor mu? (try-catch-finally)

## Test Sonuçları

**Test Tarihi:** _______________

**Backend Test Sonucu:**
- [ ] Başarılı
- [ ] Başarısız (Hatalar: _______________)

**Frontend Test Sonucu:**
- [ ] Başarılı
- [ ] Başarısız (Hatalar: _______________)

**Notlar:**
_______________
