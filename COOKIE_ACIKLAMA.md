# Cookie Davranışı Açıklaması

## 🔍 Refresh Token Cookie Neden Görünmüyor?

### Normal ve Beklenen Davranış ✅

Refresh token cookie'nin browser'ın cookie görüntüleme aracında görünmemesi **tamamen normal** ve **güvenlik için tasarlanmış** bir durumdur.

### Teknik Detaylar

#### 1. Path Farkı
- **AccessToken Cookie:**
  - Path: `/api/v1`
  - Tüm API isteklerine gönderilir
  - Browser cookie görüntüleyicisinde görünür ✅

- **RefreshToken Cookie:**
  - Path: `/api/v1/auth/refresh`
  - **Sadece refresh endpoint'ine gönderilir**
  - Browser cookie görüntüleyicisinde görünmeyebilir ⚠️

#### 2. HttpOnly Flag
Her iki cookie de `HttpOnly: true`:
- JavaScript ile erişilemez (`document.cookie` ile okunamaz)
- XSS saldırılarına karşı koruma sağlar
- Bazı browser developer tools'larında görünmeyebilir

#### 3. SameSite Ayarları
- **AccessToken:** `SameSite=Lax` (deep-link desteği için)
- **RefreshToken:** `SameSite=Strict` (daha sıkı CSRF koruması)

### Cookie Görüntüleme

#### Network Tab'de Görünür ✅
Network tab'de `Set-Cookie` header'ında refresh token görünüyor çünkü:
- Response header'ları gösterilir
- Cookie ayarları (Path, HttpOnly, Secure) görülebilir

#### Application/Cookies Tab'de Görünmeyebilir ⚠️
Browser'ın cookie görüntüleme aracında görünmeyebilir çünkü:
- Path kısıtlaması: Cookie sadece `/api/v1/auth/refresh` path'ine gönderilir
- Browser tools genellikle mevcut sayfa path'ine göre cookie'leri gösterir
- Eğer ana sayfada (`/`) veya başka bir path'teyseniz, refresh token cookie görünmez

### Cookie'nin Çalıştığını Doğrulama

#### 1. Network Tab Kontrolü ✅
- Login response'unda `Set-Cookie` header'ında refresh token var
- Cookie ayarları doğru: `Path=/api/v1/auth/refresh`, `HttpOnly`, `Secure`

#### 2. Refresh Endpoint Testi ✅
- `/api/v1/auth/refresh` endpoint'ine istek atıldığında cookie otomatik gönderilir
- Cookie çalışıyorsa refresh başarılı olur

#### 3. Browser Console Testi
```javascript
// HttpOnly cookie'ler JavaScript ile okunamaz (güvenlik için)
console.log(document.cookie); // refreshToken görünmez ✅
```

### Güvenlik Avantajları

1. **Path Kısıtlaması:**
   - Refresh token sadece refresh endpoint'ine gönderilir
   - Her API isteğinde gönderilmez (performans + güvenlik)

2. **HttpOnly:**
   - JavaScript erişimi yok
   - XSS saldırılarına karşı koruma

3. **SameSite=Strict:**
   - CSRF saldırılarına karşı ek koruma
   - Cross-site isteklerde cookie gönderilmez

### Sonuç

**Refresh token cookie'nin görünmemesi bir sorun değil, güvenlik özelliğidir.** ✅

- Cookie browser tarafından saklanır ✅
- Refresh endpoint'ine otomatik gönderilir ✅
- Network tab'de görünür ✅
- JavaScript ile erişilemez (güvenlik) ✅
- Cookie görüntüleyicisinde görünmeyebilir (normal) ⚠️

### Test Etme

Refresh token'ın çalıştığını test etmek için:

1. Login yapın
2. Access token'ın expire olmasını bekleyin (15 dakika)
3. Herhangi bir API isteği yapın
4. Refresh endpoint otomatik çağrılmalı ve yeni access token alınmalı ✅

Eğer refresh çalışıyorsa, cookie doğru çalışıyor demektir! 🎉
