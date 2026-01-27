# Terra Health CRM - Authentication Mekanizması Eksiksiz Raporu

**Tarih:** 27 Ocak 2026  
**Versiyon:** 2.0  
**Durum:** Mevcut Implementasyon - Cookie Tabanlı JWT Authentication

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari Genel Bakış](#mimari-genel-bakış)
3. [Token Yapısı ve Özellikleri](#token-yapısı-ve-özellikleri)
4. [Backend Authentication Mekanizması](#backend-authentication-mekanizması)
5. [Frontend Authentication Mekanizması](#frontend-authentication-mekanizması)
6. [Güvenlik Katmanları](#güvenlik-katmanları)
7. [Token Akış Diyagramları](#token-akış-diyagramları)
8. [Multi-Tenant Entegrasyonu](#multi-tenant-entegrasyonu)
9. [Hata Yönetimi ve Edge Case'ler](#hata-yönetimi-ve-edge-caseler)
10. [Güvenlik Özellikleri](#güvenlik-özellikleri)
11. [Performans Optimizasyonları](#performans-optimizasyonları)

---

## 🎯 Genel Bakış

Terra Health CRM, **JWT (JSON Web Token) tabanlı, cookie-based authentication** sistemi kullanmaktadır. Sistem, modern güvenlik standartlarına uygun olarak tasarlanmış ve multi-tenant mimariye tam entegre edilmiştir.

### Temel Özellikler

- ✅ **Çift Token Sistemi**: Access Token (15 dakika) + Refresh Token (7 gün)
- ✅ **HttpOnly Cookie**: XSS saldırılarına karşı koruma
- ✅ **Token Rotation**: Refresh token kullanıldığında otomatik yenilenir
- ✅ **Grace Period**: Race condition'ları önlemek için 30 saniyelik grace period
- ✅ **Multi-Tenant Güvenlik**: Cross-tenant erişim koruması
- ✅ **Permission-Based Authorization**: Granüler izin kontrolü
- ✅ **Super Admin Desteği**: Özel Super Admin authentication akışı

---

## 🏗️ Mimari Genel Bakış

### Sistem Bileşenleri

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  authStore   │  │    api.js     │  │   Components │    │
│  │  (Zustand)  │  │  (Axios)     │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │             │
│         └─────────────────┼─────────────────┘             │
│                           │                               │
│                    HTTP Request                           │
│              (withCredentials: true)                       │
│                    Cookie: accessToken                    │
│                    Header: X-Tenant-ID                    │
└───────────────────────────┼───────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Spring Boot)                   │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Security Filter Chain                      │   │
│  │  1. JwtAuthenticationFilter                        │   │
│  │  2. MaintenanceModeFilter                         │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │         AuthController                             │   │
│  │  - /api/v1/auth/login                              │   │
│  │  - /api/v1/auth/refresh                           │   │
│  │  - /api/v1/auth/logout                            │   │
│  │  - /api/v1/auth/discover                          │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │         AuthService                                │   │
│  │  - Login Logic                                     │   │
│  │  - Token Refresh Logic                            │   │
│  │  - Token Rotation                                 │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │         JwtService                                 │   │
│  │  - Token Generation                                │   │
│  │  - Token Validation                               │   │
│  │  - Claims Extraction                              │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Token Yapısı ve Özellikleri

### Access Token

**Ömür:** 15 dakika (900.000 ms)  
**Saklama:** HttpOnly Cookie (`accessToken`)  
**Path:** `/api/v1` (tüm API isteklerine gönderilir)  
**SameSite:** `Lax` (deep-link desteği için)

#### Token İçeriği (Claims)

```json
{
  "sub": "user@example.com",           // Subject (email)
  "tenantId": "uuid-tenant-id",         // Tenant UUID
  "schema_name": "tp_abc12345",        // Database schema name
  "roles": ["ROLE_ADMIN", "ROLE_USER"], // User roles
  "permissions": ["compressed_perms"], // Compressed permissions
  "type": "access",                    // Token type
  "iat": 1706342400,                   // Issued at
  "exp": 1706343300                    // Expiration (15 min)
}
```

**Önemli Özellikler:**
- ✅ Permissions compression: JWT boyutunu küçültmek için permissions sıkıştırılır
- ✅ Tüm authorization bilgileri token içinde (veritabanı sorgusu gerektirmez)
- ✅ Stateless authentication (session yok)

### Refresh Token

**Ömür:** 7 gün (604.800.000 ms)  
**Saklama:** HttpOnly Cookie (`refreshToken`)  
**Path:** `/api/v1/auth/refresh` (sadece refresh endpoint'ine gönderilir)  
**SameSite:** `Strict` (CSRF koruması için)

#### Token İçeriği (Claims)

```json
{
  "sub": "user@example.com",    // Subject (email)
  "tokenId": "uuid-token-id",   // Unique token ID (rotation için)
  "type": "refresh",            // Token type
  "iat": 1706342400,            // Issued at
  "exp": 1706342400             // Expiration (7 days)
}
```

**Önemli Özellikler:**
- ✅ Minimal içerik (sadece identity ve tokenId)
- ✅ Veritabanında saklanır (revoke edilebilir)
- ✅ Token rotation için tokenId kullanılır

---

## 🔧 Backend Authentication Mekanizması

### 1. Login Akışı (`/api/v1/auth/login`)

#### Adım Adım Akış

1. **Request Validation**
   ```java
   // X-Tenant-ID header kontrolü
   String tenantId = httpRequest.getHeader("X-Tenant-ID");
   if (tenantId == null || tenantId.isBlank()) {
       return ResponseEntity.status(HttpStatus.BAD_REQUEST)
           .body(ApiResponse.error("BAD_REQUEST", "X-Tenant-ID header is required"));
   }
   ```

2. **Email Normalizasyonu**
   ```java
   String email = request.getEmail().toLowerCase().trim();
   ```

3. **Kullanıcı Doğrulama**
   - Email ile kullanıcı bulunur (public schema'da)
   - BCrypt ile şifre doğrulanır
   - Kullanıcı enabled kontrolü
   - Tenant status kontrolü (ACTIVE olmalı)

4. **Super Admin Özel İşleme**
   ```java
   if (isSuperAdmin) {
       // Super Admin SYSTEM tenant'ını kullanır
       // Schema: public
       schemaName = "public";
   }
   ```

5. **Permission Yükleme**
   ```java
   List<String> permissions = permissionService.getUserPermissions(user.getId());
   ```

6. **Token Üretimi**
   ```java
   // Access Token (15 dakika)
   String accessToken = jwtService.generateAccessToken(
       user.getEmail(), tenantId, schemaName, roles, permissions
   );
   
   // Refresh Token (7 gün) - Token rotation için UUID
   String tokenId = UUID.randomUUID().toString();
   String refreshToken = jwtService.generateRefreshToken(user.getEmail(), tokenId);
   ```

7. **Refresh Token Veritabanına Kaydetme**
   ```java
   RefreshToken refreshTokenEntity = RefreshToken.builder()
       .user(user)
       .token(refreshTokenString)
       .expiresAt(LocalDateTime.now().plusDays(7))
       .revoked(false)
       .build();
   refreshTokenRepository.save(refreshTokenEntity);
   ```

8. **Cookie Oluşturma ve Response**
   ```java
   // Access token cookie
   ResponseCookie accessTokenCookie = cookieUtil.createAccessTokenCookie(accessToken);
   
   // Refresh token cookie
   ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(refreshToken);
   
   // Response body'den token'ları çıkar (güvenlik için)
   LoginResponse responseWithoutTokens = LoginResponse.builder()
       .user(userDto)
       .expiresIn(900000L)
       .build();
   
   return ResponseEntity.ok()
       .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
       .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
       .body(ApiResponse.success(responseWithoutTokens, "Login successful"));
   ```

#### Cookie Ayarları

**Access Token Cookie:**
- `HttpOnly: true` - JavaScript erişimi yok
- `Secure: true` - HTTPS zorunlu
- `SameSite: Lax` - Deep-link desteği
- `Path: /api/v1` - Tüm API isteklerine gönderilir
- `MaxAge: 900` saniye (15 dakika)

**Refresh Token Cookie:**
- `HttpOnly: true` - JavaScript erişimi yok
- `Secure: true` - HTTPS zorunlu
- `SameSite: Strict` - CSRF koruması
- `Path: /api/v1/auth/refresh` - Sadece refresh endpoint'ine gönderilir
- `MaxAge: 604800` saniye (7 gün)

### 2. Token Refresh Akışı (`/api/v1/auth/refresh`)

#### Adım Adım Akış

1. **Cookie'den Refresh Token Okuma**
   ```java
   @CookieValue(name = "refreshToken", required = false) String refreshToken
   ```

2. **Token Validasyonu**
   ```java
   // JWT format ve expiration kontrolü
   if (!jwtService.validateRefreshToken(refreshTokenString)) {
       throw new BadCredentialsException("Invalid or expired refresh token");
   }
   ```

3. **Veritabanı Kontrolü**
   ```java
   RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
       .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
   ```

4. **Expiration Kontrolü**
   ```java
   if (refreshToken.isExpired()) {
       throw new BadCredentialsException("Refresh token is expired");
   }
   ```

5. **Revoked Kontrolü (Grace Period)**
   ```java
   if (refreshToken.getRevoked()) {
       long secondsSinceRevocation = Duration.between(
           refreshToken.getRevokedAt(), LocalDateTime.now()
       ).getSeconds();
       
       if (secondsSinceRevocation < 30) {
           // Grace period: Token döndür ama rotation yapma
           return createAuthResponse(user, false);
       } else {
           // Token reuse attack
           throw new BadCredentialsException("Refresh token has been revoked");
       }
   }
   ```

6. **Token Rotation**
   ```java
   // Eski token'ı revoke et
   refreshToken.revoke();
   refreshTokenRepository.save(refreshToken);
   
   // Yeni token'lar üret
   return createAuthResponse(user, true); // includeRefreshToken = true
   ```

7. **Yeni Cookie'ler Oluşturma**
   ```java
   // Yeni access token cookie
   ResponseCookie accessTokenCookie = cookieUtil.createAccessTokenCookie(newAccessToken);
   
   // Token rotation varsa yeni refresh token cookie
   if (response.getRefreshToken() != null) {
       ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(newRefreshToken);
       responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
   }
   ```

#### Grace Period Mekanizması

**Amaç:** Race condition'ları önlemek

**Senaryo:**
1. Kullanıcı logout yapar → Refresh token revoke edilir
2. Aynı anda başka bir tab'de refresh isteği gönderilir
3. Grace period (30 saniye) içinde ise token kabul edilir ama rotation yapılmaz
4. Grace period dışında ise token reuse attack olarak algılanır

### 3. Logout Akışı (`/api/v1/auth/logout`)

#### Adım Adım Akış

1. **Refresh Token Revoke**
   ```java
   if (refreshToken != null && !refreshToken.isBlank()) {
       authService.revokeRefreshToken(refreshToken);
   }
   ```

2. **Cookie Temizleme**
   ```java
   ResponseCookie clearAccessCookie = cookieUtil.clearAccessTokenCookie();
   ResponseCookie clearRefreshCookie = cookieUtil.clearRefreshTokenCookie();
   
   return ResponseEntity.ok()
       .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
       .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
       .body(ApiResponse.success(null, "Logout successful"));
   ```

**Önemli:** Logout endpoint public'tir (authentication gerektirmez). Çünkü access token expire olmuş olsa bile kullanıcı logout yapabilmelidir.

### 4. JWT Authentication Filter

#### Filter Sırası

```
Request → JwtAuthenticationFilter → MaintenanceModeFilter → Controller
```

#### Filter Akışı

1. **Token Extraction**
   ```java
   private String extractTokenFromRequest(HttpServletRequest request) {
       // 1. Önce cookie'den oku (PRIMARY METHOD)
       Cookie[] cookies = request.getCookies();
       if (cookies != null) {
           for (Cookie cookie : cookies) {
               if ("accessToken".equals(cookie.getName())) {
                   return cookie.getValue();
               }
           }
       }
       
       // 2. DEPRECATED: Authorization header'dan oku (backward compatibility)
       String bearerToken = request.getHeader("Authorization");
       if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
           return bearerToken.substring(7);
       }
       
       return null;
   }
   ```

2. **Token Validasyonu**
   ```java
   if (!jwtService.validateToken(token)) {
       filterChain.doFilter(request, response);
       return; // Public endpoint'lere izin ver
   }
   ```

3. **Tenant ID Cross-Check (KRİTİK)**
   ```java
   String headerTenantId = request.getHeader("X-Tenant-ID");
   String jwtTenantId = jwtService.extractTenantId(token);
   
   if (!jwtTenantId.equals(headerTenantId)) {
       throw new AccessDeniedException("Tenant ID mismatch between JWT and header");
   }
   ```

4. **Tenant Status Kontrolü**
   ```java
   Tenant tenant = tenantRepository.findById(tenantUuid).orElse(null);
   if (!tenant.canAcceptRequests()) {
       // SUSPENDED tenant'lar reddedilir
       response.setStatus(HttpServletResponse.SC_FORBIDDEN);
       return;
   }
   ```

5. **TenantContext Set Etme**
   ```java
   TenantContext.setCurrentTenant(jwtTenantId, schemaName);
   ```

6. **SecurityContext Set Etme**
   ```java
   UserDetails userDetails = userDetailsService.loadUserByUsername(email);
   UsernamePasswordAuthenticationToken authentication = 
       new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
   
   // Permissions için özel details
   JwtAuthenticationDetails jwtDetails = 
       new JwtAuthenticationDetails(permissions, token);
   authentication.setDetails(jwtDetails);
   
   SecurityContextHolder.getContext().setAuthentication(authentication);
   ```

7. **Filter Chain Devam ve Cleanup**
   ```java
   try {
       filterChain.doFilter(request, response);
   } finally {
       // Memory leak önleme
       TenantContext.clear();
   }
   ```

### 5. JWT Service

#### Token Üretimi

**Access Token:**
```java
public String generateAccessToken(String email, String tenantId, String schemaName, 
                                  List<String> roles, List<String> permissions) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration); // 15 dakika
    
    // Permissions compression
    List<String> compressedPermissions = PermissionMapper.compressPermissions(permissions);
    
    return Jwts.builder()
        .subject(email)
        .claim("tenantId", tenantId)
        .claim("schema_name", schemaName)
        .claim("roles", roles)
        .claim("permissions", compressedPermissions)
        .claim("type", "access")
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(getSigningKey()) // HS256
        .compact();
}
```

**Refresh Token:**
```java
public String generateRefreshToken(String email, String tokenId) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + refreshExpiration); // 7 gün
    
    return Jwts.builder()
        .subject(email)
        .claim("tokenId", tokenId) // UUID for rotation
        .claim("type", "refresh")
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(getSigningKey())
        .compact();
}
```

#### Token Validasyonu

```java
public boolean validateToken(String token) {
    try {
        Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token);
        return true;
    } catch (Exception e) {
        log.error("Invalid JWT token: {}", e.getMessage());
        return false;
    }
}
```

#### Claims Extraction

```java
// Email (subject)
public String extractEmail(String token) {
    return extractClaim(token, Claims::getSubject);
}

// Tenant ID
public String extractTenantId(String token) {
    return extractClaim(token, claims -> claims.get("tenantId", String.class));
}

// Schema name
public String extractSchemaName(String token) {
    return extractClaim(token, claims -> claims.get("schema_name", String.class));
}

// Roles
public List<String> extractRoles(String token) {
    return extractClaim(token, claims -> claims.get("roles", List.class));
}

// Permissions (expanded from compressed)
public List<String> extractPermissions(String token) {
    List<String> compressed = extractClaim(token, claims -> claims.get("permissions", List.class));
    return PermissionMapper.expandPermissions(compressed);
}
```

---

## 🎨 Frontend Authentication Mekanizması

### 1. Axios Konfigürasyonu (`api.js`)

#### Temel Ayarlar

```javascript
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Cookie'ler için kritik
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});
```

**Önemli:** `withCredentials: true` cookie'lerin otomatik gönderilmesi için zorunludur.

#### Request Interceptor

```javascript
apiClient.interceptors.request.use(
    (config) => {
        // Token artık cookie'de, header'a ekleme gerekmez
        // Cookie otomatik gönderilir
        
        // Tenant ID'yi al ve header'a ekle
        let tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
            // Zustand store'dan al (fallback)
            const authData = localStorage.getItem('terra-auth-storage');
            if (authData) {
                const parsed = JSON.parse(authData);
                tenantId = parsed?.state?.user?.tenantId || parsed?.user?.tenantId;
            }
        }
        
        if (tenantId && tenantId !== 'null' && tenantId !== 'undefined') {
            config.headers['X-Tenant-ID'] = tenantId;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);
```

#### Response Interceptor (Token Refresh)

```javascript
apiClient.interceptors.response.use(
    (response) => {
        // Response data sadeleştirme
        if (response.data && typeof response.data === 'object') {
            if ('data' in response.data && 'success' in response.data) {
                if (response.data.success === true) {
                    return response.data.data; // Direkt data'yı döndür
                }
            }
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // 401 Hata Kontrolü
        if (error.response?.status === 401) {
            // Refresh endpoint'i kendisi hata verdi mi?
            if (originalRequest.url === '/v1/auth/refresh' || originalRequest._retry) {
                // Logout yap
                isRefreshing = false;
                failedQueue = [];
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            // Refresh token kontrolü (queuing)
            if (isRefreshing) {
                // Başka bir istek zaten refresh atıyor, kuyruğa ekle
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    // Token cookie'de, otomatik gönderilecek
                    return apiClient(originalRequest);
                });
            }
            
            // Refresh token başlat
            isRefreshing = true;
            originalRequest._retry = true;
            
            try {
                // Refresh isteği (cookie otomatik gönderilir)
                const baseURL = import.meta.env.VITE_API_URL || '/api';
                const response = await axios.post(
                    '/v1/auth/refresh',
                    {},
                    {
                        withCredentials: true,
                        baseURL: baseURL
                    }
                );
                
                // Token artık cookie'de, localStorage'a yazma gerekmez
                processQueue(null, null);
                
                // Orijinal isteği tekrar dene
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh başarısız - Logout
                processQueue(refreshError, null);
                isRefreshing = false;
                failedQueue = [];
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        // Diğer hatalar
        const normalizedError = normalizeError(error);
        return Promise.reject(normalizedError);
    }
);
```

#### Queuing Mekanizması

**Amaç:** Concurrent request'lerde sadece bir refresh isteği gönderilmesini sağlamak

**Akış:**
1. İlk 401 hatası → Refresh başlatılır, `isRefreshing = true`
2. Diğer 401 hataları → Kuyruğa eklenir (`failedQueue`)
3. Refresh başarılı → Kuyruktaki tüm istekler resolve edilir
4. Refresh başarısız → Kuyruktaki tüm istekler reject edilir

### 2. Auth Store (Zustand)

#### State Yapısı

```javascript
{
    user: null,                    // User DTO
    isAuthenticated: false,        // Authentication durumu
    loading: false,                // Loading durumu
    error: null,                   // Hata durumu
    discoveredTenantId: null       // Email discovery'den gelen tenant ID
}
```

#### Login Metodu

```javascript
login: async ({ email, password, tenantId }) => {
    const finalTenantId = tenantId || get().discoveredTenantId || localStorage.getItem('tenantId');
    
    if (!finalTenantId) {
        throw new Error('Tenant ID is required for login');
    }
    
    set({ loading: true, error: null });
    
    try {
        const response = await apiClient.post(
            '/v1/auth/login',
            { email, password },
            { headers: { 'X-Tenant-ID': tenantId } }
        );
        
        // Token artık cookie'de, localStorage'a yazma gerekmez
        // Sadece tenantId localStorage'da kalıyor
        localStorage.setItem('tenantId', response.user.tenantId.toString());
        
        set({
            user: response.user,
            isAuthenticated: true,
            loading: false,
            error: null,
            discoveredTenantId: null
        });
    } catch (error) {
        set({ error, loading: false });
        throw error;
    }
}
```

#### Logout Metodu

```javascript
logout: async () => {
    try {
        // Backend logout endpoint'ini çağır (cookie'ler otomatik gönderilir)
        await apiClient.post('/v1/auth/logout');
    } catch (error) {
        // Hata olsa bile devam et
        console.error('Logout request failed, but continuing with local cleanup:', error);
    } finally {
        // HER HALÜKARDA temizle
        localStorage.removeItem('tenantId');
        set({
            user: null,
            isAuthenticated: false,
            error: null,
            loading: false,
            discoveredTenantId: null
        });
        window.location.href = '/login';
    }
}
```

#### Permission Helper Metodları

```javascript
hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    
    // Super Admin has all access
    if (user.roles?.includes('ROLE_SUPER_ADMIN')) return true;
    
    const userPermissions = user.permissions || [];
    
    if (Array.isArray(permission)) {
        return permission.some(p => userPermissions.includes(p));
    }
    
    return userPermissions.includes(permission);
}

hasRole: (role) => {
    const user = get().user;
    if (!user) return false;
    return user.roles?.includes(role);
}
```

---

## 🔒 Güvenlik Katmanları

### 1. XSS (Cross-Site Scripting) Koruması

**Koruma:** HttpOnly Cookie
- ✅ JavaScript erişimi yok (`document.cookie` ile okunamaz)
- ✅ XSS saldırıları token'ı çalamaz
- ✅ Access token ve refresh token HttpOnly

### 2. CSRF (Cross-Site Request Forgery) Koruması

**Koruma:** SameSite Cookie + CSRF Token

**Access Token:**
- `SameSite: Lax` - Deep-link desteği için
- CSRF token ile ek koruma

**Refresh Token:**
- `SameSite: Strict` - Sıkı CSRF koruması
- Sadece same-site request'lerde gönderilir

**CSRF Token Mekanizması:**
```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .ignoringRequestMatchers("/api/v1/auth/**")
)
```

### 3. MITM (Man-in-the-Middle) Koruması

**Koruma:** Secure Cookie + HTTPS
- ✅ `Secure: true` - Sadece HTTPS üzerinden gönderilir
- ✅ HTTPS zorunlu (SSL/TLS)
- ✅ Production'da HTTP istekleri reddedilir

### 4. Token Reuse Attack Koruması

**Koruma:** Token Rotation + Grace Period

**Mekanizma:**
1. Refresh token kullanıldığında otomatik revoke edilir
2. Yeni refresh token üretilir
3. Grace period (30 saniye) içinde eski token kabul edilir ama rotation yapılmaz
4. Grace period dışında token reuse attack olarak algılanır

### 5. Cross-Tenant Access Koruması

**Koruma:** Tenant ID Cross-Check

**Mekanizma:**
```java
String headerTenantId = request.getHeader("X-Tenant-ID");
String jwtTenantId = jwtService.extractTenantId(token);

if (!jwtTenantId.equals(headerTenantId)) {
    throw new AccessDeniedException("Tenant ID mismatch");
}
```

**Sonuç:** Kullanıcı header'ı değiştirerek başka tenant'ın verilerine erişemez.

### 6. Tenant Status Koruması

**Koruma:** Filter Seviyesinde Kontrol

**Mekanizma:**
```java
if (!tenant.canAcceptRequests()) {
    // SUSPENDED tenant'lar reddedilir
    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    return;
}
```

**Sonuç:** SUSPENDED tenant'lar hiçbir istek kabul edemez.

### 7. Password Security

**Koruma:** BCrypt Password Encoding

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // Strength 12
}
```

**Özellikler:**
- ✅ Salt otomatik eklenir
- ✅ Strength 12 (production için önerilen)
- ✅ Timing attack koruması

---

## 🔄 Token Akış Diyagramları

### Login Akışı

```
┌─────────────┐
│   Frontend  │
│  (Login)    │
└──────┬──────┘
       │
       │ POST /api/v1/auth/login
       │ { email, password }
       │ Header: X-Tenant-ID
       │
       ▼
┌─────────────┐
│   Backend   │
│ AuthService │
└──────┬──────┘
       │
       │ 1. Email/Password doğrula
       │ 2. User bilgilerini yükle
       │ 3. Tenant status kontrolü
       │ 4. Permission'ları yükle
       │ 5. Access Token üret (15 dk)
       │ 6. Refresh Token üret (7 gün)
       │ 7. Refresh Token DB'ye kaydet
       │
       ▼
┌─────────────┐
│ AuthController│
└──────┬──────┘
       │
       │ Response:
       │ - Body: { user: {...}, expiresIn: 900000 }
       │ - Cookie: accessToken="..."
       │ - Cookie: refreshToken="..."
       │
       ▼
┌─────────────┐
│   Frontend  │
│  (Receive)  │
└──────┬──────┘
       │
       │ 1. Cookie'ler otomatik saklanır
       │ 2. TenantId → localStorage
       │ 3. User → Zustand Store
       │
       ▼
┌─────────────┐
│   Ready     │
└─────────────┘
```

### API Request Akışı

```
┌─────────────┐
│   Frontend   │
│  (Request)   │
└──────┬──────┘
       │
       │ 1. Cookie'den accessToken otomatik gönderilir
       │ 2. localStorage'dan tenantId alınır
       │ 3. X-Tenant-ID header'a eklenir
       │
       ▼
┌─────────────┐
│   Backend   │
│ JwtAuthFilter│
└──────┬──────┘
       │
       │ 1. Cookie'den token oku
       │ 2. Token'ı validate et
       │ 3. Tenant ID kontrolü (JWT vs Header)
       │ 4. Tenant status kontrolü
       │ 5. TenantContext set et
       │ 6. SecurityContext set et
       │
       ▼
┌─────────────┐
│  Controller │
│  (Process)   │
└─────────────┘
```

### Token Refresh Akışı

```
┌─────────────┐
│   Frontend   │
│  (401 Error) │
└──────┬──────┘
       │
       │ POST /api/v1/auth/refresh
       │ Cookie: refreshToken="..."
       │
       ▼
┌─────────────┐
│   Backend   │
│ AuthService │
└──────┬──────┘
       │
       │ 1. Cookie'den refresh token oku
       │ 2. Token'ı validate et
       │ 3. DB'den refresh token bul
       │ 4. Expiration kontrolü
       │ 5. Revoked kontrolü (grace period)
       │ 6. Eski token'ı revoke et
       │ 7. Yeni access token üret
       │ 8. Yeni refresh token üret (rotation)
       │ 9. Yeni refresh token DB'ye kaydet
       │
       ▼
┌─────────────┐
│ AuthController│
└──────┬──────┘
       │
       │ Response:
       │ - Body: { expiresIn: 900000 }
       │ - Cookie: accessToken="new_token"
       │ - Cookie: refreshToken="new_refresh_token"
       │
       ▼
┌─────────────┐
│   Frontend   │
│  (Receive)   │
└──────┬──────┘
       │
       │ 1. Yeni cookie'ler otomatik saklanır
       │ 2. Orijinal request'i tekrarla
       │
       ▼
┌─────────────┐
│   Success    │
└─────────────┘
```

---

## 🏢 Multi-Tenant Entegrasyonu

### Tenant Context Mekanizması

**Amaç:** Her request'te doğru database schema'sına bağlanmak

**Akış:**
1. JWT'den `schema_name` claim'i okunur
2. `TenantContext.setCurrentTenant(tenantId, schemaName)` çağrılır
3. Hibernate interceptor doğru schema'ya bağlanır
4. Request sonunda `TenantContext.clear()` çağrılır (memory leak önleme)

### Tenant Discovery

**Endpoint:** `/api/v1/auth/discover`

**Amaç:** Email'e göre tenant bulma (login öncesi)

**Güvenlik:** User enumeration önleme
- Her zaman success response döner
- Tenant bulunamazsa boş liste döner (ama success)

**Kullanım:**
```javascript
const response = await apiClient.post('/v1/auth/discover', { email });
// response.tenants = [{ tenantId, tenantName, schemaName }, ...]
```

### Super Admin Özel İşleme

**Özellikler:**
- ✅ SYSTEM tenant'ını kullanır
- ✅ Public schema'ya bağlanır
- ✅ Tüm tenant'ları görebilir
- ✅ Özel `/api/v1/super-admin/**` endpoint'leri

**Login Akışı:**
```java
if (isSuperAdmin) {
    Tenant systemTenant = tenantService.getSystemTenant();
    schemaName = "public";
    tenantId = systemTenant.getId().toString();
}
```

---

## ⚠️ Hata Yönetimi ve Edge Case'ler

### 1. Token Expire Durumu

**Senaryo:** Access token expire olur

**Akış:**
1. API isteği 401 döner
2. Frontend otomatik refresh isteği gönderir
3. Refresh başarılı → Yeni access token alınır, orijinal istek tekrarlanır
4. Refresh başarısız → Logout yapılır

### 2. Refresh Token Expire Durumu

**Senaryo:** Refresh token expire olur

**Akış:**
1. Refresh isteği 401 döner
2. Frontend logout yapar
3. Kullanıcı tekrar login yapmalıdır

### 3. Concurrent Request'ler

**Senaryo:** Aynı anda birden fazla request 401 döner

**Akış:**
1. İlk request refresh başlatır, `isRefreshing = true`
2. Diğer request'ler kuyruğa eklenir
3. Refresh başarılı → Kuyruktaki tüm request'ler resolve edilir
4. Refresh başarısız → Kuyruktaki tüm request'ler reject edilir

### 4. Network Hatası

**Senaryo:** Refresh isteği network hatası verir

**Akış:**
1. Refresh catch bloğuna düşer
2. Logout yapılır
3. Kullanıcı login sayfasına yönlendirilir

### 5. Cookie Silinme Durumu

**Senaryo:** Kullanıcı cookie'leri manuel siler

**Akış:**
1. Token extraction null döner
2. Filter chain devam eder (public endpoint'ler çalışır)
3. Protected endpoint'lere erişim reddedilir
4. Frontend 401 hatası alır, logout yapar

### 6. Tenant Suspension

**Senaryo:** Tenant SUSPENDED duruma geçer

**Akış:**
1. Filter seviyesinde kontrol edilir
2. Tüm istekler 403 Forbidden döner
3. Kullanıcı logout yapmalıdır

---

## 🛡️ Güvenlik Özellikleri

### 1. Token Rotation

**Amaç:** Token çalınması durumunda zararı minimize etmek

**Mekanizma:**
- Her refresh'te eski token revoke edilir
- Yeni token üretilir
- Eski token artık kullanılamaz

### 2. Grace Period

**Amaç:** Race condition'ları önlemek

**Mekanizma:**
- Revoke edilen token 30 saniye içinde kabul edilir
- Ama rotation yapılmaz (token reuse attack önleme)
- 30 saniye sonra token reuse attack olarak algılanır

### 3. Permission Compression

**Amaç:** JWT boyutunu küçültmek

**Mekanizma:**
- Permissions sıkıştırılır (örn: `users.create` → `uc`)
- Token boyutu küçülür (4KB limit altında kalır)
- Backend'de expand edilir

### 4. Stateless Authentication

**Amaç:** Scalability ve performans

**Mekanizma:**
- Session yok, sadece JWT
- Her request bağımsız validate edilir
- Load balancer arkasında çalışabilir

### 5. Tenant Isolation

**Amaç:** Multi-tenant güvenlik

**Mekanizma:**
- Her tenant'ın kendi schema'sı var
- Tenant ID cross-check ile cross-tenant erişim engellenir
- Tenant status kontrolü ile SUSPENDED tenant'lar reddedilir

---

## ⚡ Performans Optimizasyonları

### 1. Permission Compression

**Kazanç:** JWT boyutu %60-70 azalır

**Örnek:**
```
Önce: ["users.create", "users.read", "users.update", "users.delete"]
Sonra: ["uc", "ur", "uu", "ud"]
```

### 2. Token Claims Optimization

**Kazanç:** Veritabanı sorgusu gerektirmez

**İçerik:**
- Email, tenantId, schemaName, roles, permissions token içinde
- Her request'te veritabanı sorgusu yok
- Sadece refresh token için DB sorgusu (7 günde bir)

### 3. Cookie Path Optimization

**Kazanç:** Gereksiz cookie gönderimi önlenir

**Access Token:**
- Path: `/api/v1` - Sadece API isteklerine gönderilir
- HTML sayfalarına gönderilmez

**Refresh Token:**
- Path: `/api/v1/auth/refresh` - Sadece refresh endpoint'ine gönderilir
- Her API isteğine gönderilmez

### 4. Queuing Mekanizması

**Kazanç:** Concurrent request'lerde tek refresh isteği

**Sonuç:**
- 10 concurrent request → 1 refresh isteği
- Network trafiği azalır
- Server yükü azalır

---

## 📊 Konfigürasyon

### Backend (`application.yaml`)

```yaml
jwt:
  secret: ${JWT_SECRET:LnjfynBNtf0wU7Qa87kxGhihPAHcFOuOhy2vyO19eUA=}
  expiration: 900000 # 15 dakika (access token)
  refresh-expiration: 604800000 # 7 gün (refresh token)

app:
  cookie:
    secure: ${COOKIE_SECURE:true} # HTTPS zorunlu
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:https://localhost:5173,https://localhost:3000}
```

### Frontend (Environment Variables)

```env
VITE_API_URL=https://api.example.com/api
```

---

## 🔍 Debugging ve Monitoring

### Log Noktaları

**Backend:**
- Login attempt: `log.debug("Login attempt for email: {}")`
- Token generation: `log.debug("Generated access token for user {}")`
- Token validation: `log.warn("Invalid JWT token")`
- Tenant mismatch: `log.error("Tenant ID mismatch")`

**Frontend:**
- Token refresh: `console.debug('Token refresh initiated')`
- Queue processing: `console.debug('Processing queue')`

### Monitoring Metrikleri

**Önerilen Metrikler:**
- Login başarı/hata oranı
- Token refresh başarı/hata oranı
- Token expiration rate
- Tenant mismatch rate
- Grace period kullanımı

---

## 📚 Referanslar

- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Spring Security: CSRF Protection](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [OWASP: CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [JJWT Documentation](https://github.com/jwtk/jjwt)

---

## 📝 Sonuç

Terra Health CRM authentication mekanizması, modern güvenlik standartlarına uygun, production-ready bir sistemdir. Cookie-based JWT authentication, token rotation, grace period, multi-tenant güvenlik ve permission-based authorization gibi özelliklerle donatılmıştır.

**Güçlü Yönler:**
- ✅ XSS, CSRF, MITM koruması
- ✅ Token rotation ve reuse attack koruması
- ✅ Multi-tenant isolation
- ✅ Performans optimizasyonları
- ✅ Edge case handling

**İyileştirme Önerileri:**
- 🔄 Rate limiting eklenebilir
- 🔄 Token blacklist mekanizması eklenebilir
- 🔄 Audit logging genişletilebilir
- 🔄 Monitoring ve alerting eklenebilir

---

**Son Güncelleme:** 27 Ocak 2026  
**Versiyon:** 2.0  
**Hazırlayan:** AI Assistant
