# Terra Health CRM - Sistem Analiz Raporu
## Tenant İçi Yetkilendirme Sistemi Öncesi Kapsamlı İnceleme

**Tarih:** 28 Ocak 2026  
**Versiyon:** 1.0  
**Hazırlayan:** Sistem Analiz Ekibi

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mevcut Sistem Mimarisi](#mevcut-sistem-mimarisi)
3. [Backend Yapısı](#backend-yapısı)
4. [Frontend Yapısı](#frontend-yapısı)
5. [Eksikler ve Uyumsuzluklar](#eksikler-ve-uyumsuzluklar)
6. [Tenant İçi Yetkilendirme Gereksinimleri](#tenant-içi-yetkilendirme-gereksinimleri)
7. [Öneriler ve Yol Haritası](#öneriler-ve-yol-haritası)

---

## 1. Genel Bakış

### 1.1 Sistem Özeti
Terra Health CRM, **Schema-per-Tenant** multi-tenancy mimarisi kullanan bir SaaS platformudur. Sistem şu anda **iki katmanlı yetkilendirme** yapısına sahiptir:

- **Super Admin Katmanı:** Public schema'da çalışır, tüm tenant'ları yönetir
- **Tenant Admin Katmanı:** Her tenant'ın kendi şemasında çalışır (henüz tam implementasyon yok)

### 1.2 Mevcut Durum
✅ **Tamamlanmış:**
- Multi-tenant schema yönetimi
- Super Admin yetkilendirme sistemi
- Tenant modül atama mekanizması
- Cookie-tabanlı JWT authentication
- Permission-based access control (PBAC) altyapısı
- Permission bundles sistemi (veritabanı seviyesinde)

⚠️ **Eksik/Problemli:**
- Tenant Admin için özel controller/endpoint'ler yok
- Frontend'de mock data kullanılıyor (backend ile senkron değil)
- Tenant içi kullanıcı yönetimi backend'de yok
- Tenant içi rol/paket yönetimi backend'de yok
- Permission bundles frontend'de kullanılmıyor

---

## 2. Mevcut Sistem Mimarisi

### 2.1 Veritabanı Yapısı

#### Public Schema (Sistem Seviyesi)
```
public.tenants              → Tenant kayıtları
public.users                → Tüm tenant'ların kullanıcıları
public.roles                → Sistem rolleri (ROLE_ADMIN, ROLE_SUPER_ADMIN, vb.)
public.permissions          → Tüm yetkiler (MODULE ve ACTION seviyesinde)
public.tenant_modules       → Tenant-modül ilişkileri
public.user_permissions     → Kullanıcı-yetki ilişkileri
public.permission_bundles   → Yetki paketleri (tenant bazlı)
public.bundle_permissions   → Paket-yetki ilişkileri
public.user_bundles         → Kullanıcı-paket ilişkileri
public.schema_pool          → Hazır şema havuzu
public.super_admin_users    → Super admin kullanıcıları
public.refresh_tokens       → Refresh token yönetimi
public.audit_logs           → Sistem logları
```

#### Tenant Schema (Her Tenant İçin)
```
tenant_schema.leads         → Lead kayıtları
tenant_schema.patients      → Hasta kayıtları
tenant_schema.appointments  → Randevu kayıtları
tenant_schema.services      → Hizmet tanımları
```

**KRİTİK NOT:** Tenant şemalarında **kullanıcı, rol veya yetki tabloları YOK**. Tüm kullanıcı yönetimi public schema'da yapılıyor.

### 2.2 Yetkilendirme Hiyerarşisi

```
SYSTEM (Public Schema)
├── Super Admin (ROLE_SUPER_ADMIN)
│   ├── MODULE_SUPERADMIN
│   ├── SUPERADMIN_TENANTS_VIEW
│   ├── SUPERADMIN_TENANTS_MANAGE
│   ├── SUPERADMIN_USER_SEARCH_VIEW
│   ├── SUPERADMIN_SCHEMAPOOL_VIEW
│   ├── SUPERADMIN_SCHEMAPOOL_MANAGE
│   └── SUPERADMIN_AUDIT_VIEW
│
└── Tenant (tp_xxxxx Schema)
    ├── Tenant Admin (ROLE_ADMIN) → Tenant'ın ilk kullanıcısı
    │   └── Tenant'a atanan tüm modüllerin yetkileri
    │
    └── Normal Users
        └── Tenant Admin tarafından atanan yetkiler
```

---

## 3. Backend Yapısı

### 3.1 Mevcut Controller'lar

#### ✅ SuperAdminController (`/api/v1/super-admin`)
**Lokasyon:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/modules/auth/controller/SuperAdminController.java`

**Yetki:** `@PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")`

**Endpoint'ler:**
- `POST /tenants` - Tenant oluşturma
- `GET /tenants` - Tüm tenant'ları listeleme
- `GET /tenants/{id}` - Tenant detayı
- `PUT /tenants/{id}` - Tenant güncelleme
- `PUT /tenants/{id}/modules` - Tenant modüllerini ayarlama
- `GET /tenants/{id}/modules` - Tenant modüllerini getirme
- `GET /modules/available` - Tüm mevcut modülleri getirme
- `GET /tenants/{tenantId}/admins` - Tenant admin'lerini listeleme
- `POST /tenants/{tenantId}/admins` - Yeni tenant admin oluşturma
- `PUT /tenants/{tenantId}/admins/{userId}` - Tenant admin güncelleme
- `DELETE /tenants/{tenantId}/admins/{userId}` - Tenant admin silme
- `POST /tenants/{tenantId}/admins/{userId}/reset-password` - Şifre sıfırlama

**Durum:** ✅ Tam çalışıyor

#### ⚠️ PermissionController (`/api/v1/permissions`)
**Lokasyon:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/modules/auth/controller/PermissionController.java`

**Yetki:** `@PreAuthorize("hasRole('ROLE_ADMIN')")`

**Endpoint'ler:**
- `GET /` - Tüm yetkileri getirme
- `GET /tenants/{tenantId}/modules` - Tenant modüllerini getirme
- `POST /tenants/{tenantId}/modules` - Modül atama (Sadece Super Admin)
- `DELETE /tenants/{tenantId}/modules/{moduleName}` - Modül kaldırma (Sadece Super Admin)
- `GET /users/{userId}/permissions` - Kullanıcı yetkilerini getirme
- `POST /users/{userId}/permissions` - Kullanıcıya yetki atama
- `DELETE /users/{userId}/permissions/{permissionId}` - Kullanıcıdan yetki kaldırma
- `GET /modules/{moduleName}/permissions` - Modül yetkilerini getirme
- `POST /bundles` - Paket oluşturma
- `GET /bundles/tenants/{tenantId}` - Tenant paketlerini getirme
- `PUT /bundles/{bundleId}` - Paket güncelleme
- `POST /bundles/{bundleId}/assign/{userId}` - Paketi kullanıcıya atama
- `DELETE /bundles/{bundleId}/users/{userId}` - Paketi kullanıcıdan kaldırma

**Durum:** ⚠️ **KRİTİK SORUN:** `@PreAuthorize("hasRole('ROLE_ADMIN')")` ile korunuyor, ancak **tenant admin'ler için özel endpoint'ler yok**. Tüm endpoint'ler global olarak çalışıyor.

**Problem:** Bir tenant admin, başka bir tenant'ın kullanıcılarına yetki atayabilir (eğer userId'yi biliyorsa). Tenant izolasyonu eksik.

#### ❌ TenantAdminController
**Durum:** **YOK** - Tenant admin'ler için özel controller yok.

### 3.2 Service Katmanı

#### ✅ PermissionService
**Lokasyon:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/modules/auth/service/PermissionService.java`

**Özellikler:**
- ✅ `validatePermissionAssignment()` - Yetki atama validasyonu (tenant modül havuzundan kontrol ediyor)
- ✅ `assignPermissionToUser()` - Kullanıcıya yetki atama
- ✅ `getTenantModules()` - Tenant modüllerini getirme
- ✅ `setModulesForTenant()` - Tenant modüllerini ayarlama (cascade permission removal)
- ✅ `assignAllTenantPermissionsToUser()` - Tenant'ın tüm yetkilerini kullanıcıya atama
- ✅ `createBundle()` - Paket oluşturma
- ✅ `assignBundleToUser()` - Paketi kullanıcıya atama
- ✅ `getTenantBundles()` - Tenant paketlerini getirme

**Durum:** ✅ İyi çalışıyor, ancak tenant izolasyonu eksik.

#### ✅ SuperAdminService
**Lokasyon:** `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/modules/auth/service/SuperAdminService.java`

**Özellikler:**
- ✅ `createTenantWithAdminAndModules()` - Tenant + Admin + Modül oluşturma
- ✅ `setModulesForTenant()` - Tenant modüllerini ayarlama
- ✅ `getTenantModules()` - Tenant modüllerini getirme
- ✅ `getAllAvailableModules()` - Tüm mevcut modülleri getirme
- ✅ `getTenantAdmins()` - Tenant admin'lerini listeleme
- ✅ `createTenantAdmin()` - Yeni tenant admin oluşturma
- ✅ `updateTenantAdmin()` - Tenant admin güncelleme

**Durum:** ✅ Tam çalışıyor

### 3.3 Veritabanı Migrations

#### Public Schema Migrations
- `V1__create_tenants_table.sql` ✅
- `V2__create_users_and_roles_tables.sql` ✅
- `V3__create_permissions_tables.sql` ✅
- `V5__create_permission_bundles.sql` ✅
- `V17__expand_granular_permissions.sql` ✅
- `V20__add_superadmin_permissions.sql` ✅
- `V21__create_permission_dictionary.sql` ✅

#### Tenant Schema Migrations
- `V1__create_tenant_tables.sql` ✅ (leads, patients, appointments, services)
- `V7__add_soft_delete_to_tenant_tables.sql` ✅

**Durum:** ✅ Migrations tamamlanmış

### 3.4 Yetki Yapısı

#### Modül Seviyesi (MODULE)
```
MODULE_DASHBOARD
MODULE_APPOINTMENTS
MODULE_CUSTOMERS
MODULE_REMINDERS
MODULE_STATISTICS
MODULE_NOTIFICATIONS
MODULE_MARKETING
MODULE_SETTINGS
MODULE_HEALTH
MODULE_SUPERADMIN
```

#### Aksiyon Seviyesi (ACTION)
Her modül için granüler yetkiler:
- `SETTINGS_USERS_VIEW`, `SETTINGS_USERS_CREATE`, `SETTINGS_USERS_UPDATE`, `SETTINGS_USERS_DELETE`
- `SETTINGS_ROLES_VIEW`, `SETTINGS_ROLES_MANAGE`
- `SETTINGS_SYSTEM_UPDATE`
- `CUSTOMERS_VIEW`, `CUSTOMERS_CREATE`, `CUSTOMERS_UPDATE`, `CUSTOMERS_DELETE`
- `APPOINTMENTS_VIEW`, `APPOINTMENTS_CREATE`, `APPOINTMENTS_UPDATE`, `APPOINTMENTS_DELETE`
- ... ve diğerleri

**Durum:** ✅ İyi yapılandırılmış

---

## 4. Frontend Yapısı

### 4.1 Auth Store
**Lokasyon:** `frontend/terra/src/apps/terra-shared/store/authStore.js`

**Özellikler:**
- ✅ Cookie-tabanlı authentication
- ✅ `fetchCurrentUser()` - `/api/v1/auth/me` endpoint'ini çağırıyor
- ✅ `hasPermission()` - Yetki kontrolü (Super Admin bypass var)
- ✅ `hasRole()` - Rol kontrolü
- ✅ Tenant ID senkronizasyonu

**Durum:** ✅ İyi çalışıyor

### 4.2 Sidebar Yapısı
**Lokasyon:** `frontend/terra/src/apps/terra-shared/common/ui/Sidebar.jsx`

**Özellikler:**
- ✅ Permission-based menü filtreleme
- ✅ Super Admin için özel menü
- ✅ Normal kullanıcılar için modül bazlı menü
- ✅ Dropdown menüler (Marketing, Settings) - alt öğe filtreleme ile

**Durum:** ✅ İyi çalışıyor

### 4.3 Permission Management (Settings/PermissionsPage)
**Lokasyon:** `frontend/terra/src/apps/terra-shared/views/Settings/PermissionsPage.jsx`

**Durum:** ⚠️ **KRİTİK SORUN - TAMAMEN MOCK DATA**

**Kullanılan Mock Data:**
- `PERMISSION_MODULES` - Statik modül listesi (customers, appointments, analysis, settings)
- `MOCK_PACKAGES` - Statik paket listesi
- `MOCK_ROLES` - Statik rol listesi

**Kullanılan Store:**
- `usePermissionStore` - Zustand store, sadece localStorage'a yazıyor
- Backend ile **hiçbir bağlantı yok**

**Problemler:**
1. ❌ Backend'deki gerçek permission'lar kullanılmıyor
2. ❌ Backend'deki permission bundles sistemi kullanılmıyor
3. ❌ Backend'deki rol sistemi kullanılmıyor
4. ❌ Tüm veriler mock, gerçek sistemle senkron değil

### 4.4 User Management (Settings/UsersPage)
**Lokasyon:** `frontend/terra/src/apps/terra-shared/views/Settings/UsersPage.jsx`

**Durum:** ⚠️ **KRİTİK SORUN - TAMAMEN MOCK DATA**

**Kullanılan Hook:**
- `useUsers` - Mock data kullanıyor
- Backend ile **hiçbir bağlantı yok**

**Problemler:**
1. ❌ Backend'deki gerçek kullanıcılar gösterilmiyor
2. ❌ Kullanıcı oluşturma/güncelleme backend'e gitmiyor
3. ❌ Tenant izolasyonu yok (tüm tenant'ların kullanıcıları görünebilir)

### 4.5 Routing ve Protected Routes
**Lokasyon:** `frontend/terra/src/App.jsx`

**Özellikler:**
- ✅ `ProtectedRoute` component - Permission ve role kontrolü yapıyor
- ✅ Lazy loading
- ✅ Error boundaries
- ✅ Fallback routing (yetkisi olmayan kullanıcıları ilk erişebileceği sayfaya yönlendirme)

**Durum:** ✅ İyi çalışıyor

---

## 5. Eksikler ve Uyumsuzluklar

### 5.1 Backend Eksiklikleri

#### ❌ Tenant Admin Controller Yok
**Problem:** Tenant admin'ler için özel endpoint'ler yok. Şu anda:
- `PermissionController` tüm `ROLE_ADMIN` kullanıcılarına açık
- Tenant izolasyonu yok (bir tenant admin başka tenant'ın kullanıcılarına erişebilir)
- Tenant admin'ler sadece kendi tenant'larının kullanıcılarını yönetebilmeli

**Gereksinim:**
```java
@RestController
@RequestMapping("/api/v1/tenant-admin")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class TenantAdminController {
    // Tenant context'inden otomatik tenantId alınmalı
    // Tüm işlemler sadece mevcut tenant için yapılmalı
}
```

#### ⚠️ PermissionController Tenant İzolasyonu Eksik
**Problem:** `PermissionController` içindeki endpoint'ler tenant izolasyonu yapmıyor.

**Örnek Problem:**
```java
@GetMapping("/users/{userId}/permissions")
public ResponseEntity<ApiResponse<List<String>>> getUserPermissions(@PathVariable UUID userId) {
    // userId'nin hangi tenant'a ait olduğu kontrol edilmiyor
    // Bir tenant admin, başka tenant'ın kullanıcısının yetkilerini görebilir
}
```

**Çözüm:** Her endpoint'te tenant context kontrolü yapılmalı:
```java
UUID currentTenantId = getCurrentUserTenantId();
User targetUser = userRepository.findById(userId)
    .orElseThrow(...);
    
if (!targetUser.getTenant().getId().equals(currentTenantId)) {
    throw new AccessDeniedException("Cannot access user from different tenant");
}
```

#### ❌ Tenant İçi Rol Yönetimi Yok
**Problem:** Backend'de tenant bazlı rol yönetimi yok. Roller sadece sistem seviyesinde (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`).

**Gereksinim:**
- Tenant admin'ler kendi tenant'ları için özel roller oluşturabilmeli
- Bu roller sadece o tenant'ın modül havuzundan yetki alabilmeli

#### ⚠️ Permission Bundles Kullanılmıyor
**Problem:** Backend'de permission bundles sistemi var ama:
- Frontend'de kullanılmıyor
- Tenant admin'ler paket oluşturamıyor (sadece Super Admin endpoint'leri var)
- Paket atama UI'ı yok

### 5.2 Frontend Eksiklikleri

#### ❌ Mock Data Kullanımı
**Problem:** `PermissionsPage` ve `UsersPage` tamamen mock data kullanıyor.

**Etkilenen Dosyalar:**
- `frontend/terra/src/apps/terra-shared/modules/permissions/data/mockData.js`
- `frontend/terra/src/apps/terra-shared/modules/permissions/hooks/usePermissionStore.js`
- `frontend/terra/src/apps/terra-shared/modules/permissions/hooks/usePermissions.js`

**Gereksinim:**
- Backend API'lerine bağlanmalı
- Gerçek permission'ları backend'den çekmeli
- Gerçek kullanıcıları backend'den çekmeli

#### ❌ Backend API Entegrasyonu Yok
**Problem:** Frontend'de backend API çağrıları yok.

**Eksik API Çağrıları:**
- `GET /api/v1/permissions` - Tüm yetkileri getirme
- `GET /api/v1/permissions/tenants/{tenantId}/modules` - Tenant modüllerini getirme
- `GET /api/v1/permissions/modules/{moduleName}/permissions` - Modül yetkilerini getirme
- `GET /api/v1/permissions/bundles/tenants/{tenantId}` - Tenant paketlerini getirme
- `POST /api/v1/permissions/bundles` - Paket oluşturma
- `GET /api/v1/users` - Tenant kullanıcılarını getirme (yeni endpoint gerekli)
- `POST /api/v1/users` - Kullanıcı oluşturma (yeni endpoint gerekli)

#### ❌ Tenant Context Yönetimi Eksik
**Problem:** Frontend'de tenant context yönetimi eksik.

**Gereksinim:**
- Her API çağrısında `X-Tenant-ID` header'ı gönderilmeli
- Tenant admin'ler sadece kendi tenant'larının verilerini görmeli
- Tenant bazlı filtreleme yapılmalı

### 5.3 Mimari Eksiklikleri

#### ❌ Tenant Admin Yetki Sınırlaması Yok
**Problem:** Tenant admin'lerin yetkileri sınırlandırılmamış.

**Gereksinim:**
- Tenant admin'ler sadece kendi tenant'larının:
  - Kullanıcılarını yönetebilmeli
  - Rollerini yönetebilmeli
  - Paketlerini yönetebilmeli
  - Yetkilerini atayabilmeli (sadece tenant modül havuzundan)

#### ⚠️ Role vs Permission Bundle Karışıklığı
**Problem:** Sistemde iki farklı kavram var:
1. **Roles** (`public.roles`) - Sistem seviyesi roller (ROLE_ADMIN, ROLE_SUPER_ADMIN)
2. **Permission Bundles** (`public.permission_bundles`) - Tenant bazlı yetki paketleri

**Durum:** Frontend'de "Roles" ve "Packages" olarak iki tab var, ancak backend'deki yapıyla uyumsuz.

**Gereksinim:** 
- Frontend'deki "Roles" → Backend'deki "Permission Bundles" olmalı
- Veya backend'de tenant bazlı rol sistemi eklenmeli

---

## 6. Tenant İçi Yetkilendirme Gereksinimleri

### 6.1 Backend Gereksinimleri

#### 6.1.1 TenantAdminController Oluşturulmalı
**Yeni Controller:** `TenantAdminController.java`

**Endpoint'ler:**
```
GET    /api/v1/tenant-admin/users              → Tenant kullanıcılarını listele
POST   /api/v1/tenant-admin/users              → Yeni kullanıcı oluştur
GET    /api/v1/tenant-admin/users/{userId}     → Kullanıcı detayı
PUT    /api/v1/tenant-admin/users/{userId}     → Kullanıcı güncelle
DELETE /api/v1/tenant-admin/users/{userId}     → Kullanıcı sil
POST   /api/v1/tenant-admin/users/{userId}/permissions → Kullanıcıya yetki ata
DELETE /api/v1/tenant-admin/users/{userId}/permissions/{permissionId} → Yetki kaldır

GET    /api/v1/tenant-admin/bundles            → Tenant paketlerini listele
POST   /api/v1/tenant-admin/bundles            → Yeni paket oluştur
GET    /api/v1/tenant-admin/bundles/{bundleId} → Paket detayı
PUT    /api/v1/tenant-admin/bundles/{bundleId} → Paket güncelle
DELETE /api/v1/tenant-admin/bundles/{bundleId} → Paket sil
POST   /api/v1/tenant-admin/bundles/{bundleId}/assign/{userId} → Paketi kullanıcıya ata

GET    /api/v1/tenant-admin/permissions        → Tenant'ın mevcut yetkilerini getir (modül bazlı)
GET    /api/v1/tenant-admin/modules            → Tenant'ın modüllerini getir
```

**Güvenlik:**
- `@PreAuthorize("hasRole('ROLE_ADMIN')")` - Sadece tenant admin'ler erişebilmeli
- Her endpoint'te tenant context kontrolü yapılmalı
- JWT'den tenantId alınmalı ve tüm işlemler bu tenant için yapılmalı

#### 6.1.2 Tenant Context Helper Metodları
**Yeni Service Metodları:**
```java
// AuthService veya yeni TenantAdminService içinde
public UUID getCurrentUserTenantId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String email = auth.getName();
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalStateException("User not found"));
    return user.getTenant().getId();
}

public void validateTenantAccess(UUID targetTenantId) {
    UUID currentTenantId = getCurrentUserTenantId();
    if (!currentTenantId.equals(targetTenantId)) {
        throw new AccessDeniedException("Cannot access resources from different tenant");
    }
}
```

#### 6.1.3 PermissionController Güncellemesi
**Mevcut Endpoint'ler Tenant İzolasyonu İçin Güncellenmeli:**

```java
@GetMapping("/users/{userId}/permissions")
public ResponseEntity<ApiResponse<List<String>>> getUserPermissions(@PathVariable UUID userId) {
    // Tenant context kontrolü ekle
    UUID currentTenantId = getCurrentUserTenantId();
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    
    if (!user.getTenant().getId().equals(currentTenantId)) {
        throw new AccessDeniedException("Cannot access user from different tenant");
    }
    
    List<String> permissions = permissionService.getUserPermissions(userId);
    return ResponseEntity.ok(ApiResponse.success(permissions));
}
```

### 6.2 Frontend Gereksinimleri

#### 6.2.1 API Client Entegrasyonu
**Yeni API Hook'ları Oluşturulmalı:**

```javascript
// hooks/useTenantUsers.js
export const useTenantUsers = () => {
    // GET /api/v1/tenant-admin/users
    // POST /api/v1/tenant-admin/users
    // PUT /api/v1/tenant-admin/users/{userId}
    // DELETE /api/v1/tenant-admin/users/{userId}
}

// hooks/useTenantBundles.js
export const useTenantBundles = () => {
    // GET /api/v1/tenant-admin/bundles
    // POST /api/v1/tenant-admin/bundles
    // PUT /api/v1/tenant-admin/bundles/{bundleId}
    // DELETE /api/v1/tenant-admin/bundles/{bundleId}
}

// hooks/useTenantPermissions.js
export const useTenantPermissions = () => {
    // GET /api/v1/tenant-admin/permissions
    // GET /api/v1/tenant-admin/modules
}
```

#### 6.2.2 Mock Data Kaldırılmalı
**Yapılacaklar:**
1. `mockData.js` dosyası kaldırılmalı veya sadece fallback için tutulmalı
2. `usePermissionStore.js` backend API'lerine bağlanmalı
3. `PermissionsPage.jsx` gerçek backend verilerini kullanmalı
4. `UsersPage.jsx` gerçek backend verilerini kullanmalı

#### 6.2.3 Permission Bundles UI
**Yeni UI Bileşenleri:**
- Bundle listesi
- Bundle oluşturma formu
- Bundle düzenleme
- Bundle'a yetki ekleme/çıkarma
- Bundle'ı kullanıcıya atama

---

## 7. Öneriler ve Yol Haritası

### 7.1 Faz 2: Tenant İçi Yetkilendirme (Öncelikli)

#### Adım 1: Backend - TenantAdminController
**Süre:** 2-3 saat

1. `TenantAdminController.java` oluştur
2. Tenant context helper metodları ekle
3. Tüm endpoint'lerde tenant izolasyonu sağla
4. Test et

#### Adım 2: Backend - PermissionController Güncelleme
**Süre:** 1-2 saat

1. Mevcut `PermissionController` endpoint'lerine tenant izolasyonu ekle
2. Veya endpoint'leri `TenantAdminController`'a taşı
3. Test et

#### Adım 3: Frontend - API Entegrasyonu
**Süre:** 3-4 saat

1. API hook'ları oluştur (`useTenantUsers`, `useTenantBundles`, `useTenantPermissions`)
2. `PermissionsPage.jsx`'i backend'e bağla
3. `UsersPage.jsx`'i backend'e bağla
4. Mock data'yı kaldır
5. Test et

#### Adım 4: Frontend - Permission Bundles UI
**Süre:** 2-3 saat

1. Bundle listesi UI'ı
2. Bundle oluşturma/düzenleme formu
3. Bundle'a yetki atama UI'ı
4. Bundle'ı kullanıcıya atama UI'ı
5. Test et

### 7.2 Faz 1: Mock Data Temizliği (Sonraki)

#### Adım 1: Mock Data Analizi
**Süre:** 1 saat

1. Tüm mock data kullanımlarını tespit et
2. Backend'deki gerçek verilerle karşılaştır
3. Uyumsuzlukları listele

#### Adım 2: Backend API'lerini Tamamla
**Süre:** 2-3 saat

1. Eksik endpoint'leri ekle
2. Response formatlarını standardize et
3. Dokümantasyon oluştur

#### Adım 3: Frontend Mock Data Kaldırma
**Süre:** 2-3 saat

1. Mock data import'larını kaldır
2. Backend API çağrılarına geç
3. Error handling ekle
4. Loading state'leri ekle

### 7.3 Öncelik Sırası

**Yüksek Öncelik:**
1. ✅ TenantAdminController oluşturma
2. ✅ Tenant context helper metodları
3. ✅ PermissionController tenant izolasyonu
4. ✅ Frontend API entegrasyonu (UsersPage, PermissionsPage)

**Orta Öncelik:**
5. ⚠️ Permission Bundles UI
6. ⚠️ Mock data temizliği
7. ⚠️ Error handling iyileştirmeleri

**Düşük Öncelik:**
8. 📝 Dokümantasyon
9. 📝 Unit testler
10. 📝 Integration testler

---

## 8. Detaylı Teknik Bulgular

### 8.1 Backend - PermissionService Analizi

#### ✅ İyi Çalışan Özellikler
1. **validatePermissionAssignment()** - Tenant modül havuzundan yetki kontrolü yapıyor ✅
2. **setModulesForTenant()** - Modül değişikliğinde cascade permission removal yapıyor ✅
3. **assignAllTenantPermissionsToUser()** - Tenant'ın tüm yetkilerini kullanıcıya atıyor ✅
4. **createBundle()** - Paket oluşturma ve validasyon yapıyor ✅

#### ⚠️ İyileştirme Gereken Özellikler
1. **getUserPermissions()** - Tenant context kontrolü yok (herkes herkesin yetkilerini görebilir)
2. **assignPermissionToUser()** - Tenant context kontrolü var ama endpoint seviyesinde de olmalı
3. **getTenantBundles()** - Tenant context kontrolü yok

### 8.2 Frontend - Mock Data Yapısı

#### Mevcut Mock Yapı
```javascript
// mockData.js
PERMISSION_MODULES = [
    { id: 'customers', permissions: ['view_customers', 'create_customers', ...] },
    { id: 'appointments', permissions: ['view_appointments', ...] },
    { id: 'analysis', permissions: ['view_analysis', ...] },
    { id: 'settings', permissions: ['view_settings', ...] }
]

MOCK_PACKAGES = [
    { id: 1, name_tr: 'Tam Yetkili (Admin)', permissions: [...] },
    { id: 2, name_tr: 'Doktor Paketi', permissions: [...] },
    ...
]

MOCK_ROLES = [
    { id: 1, name_tr: 'Başhekim', packages: [1, 2] },
    { id: 2, name_tr: 'Uzman Doktor', packages: [2] },
    ...
]
```

#### Backend'deki Gerçek Yapı
```java
// Backend permissions
MODULE_CUSTOMERS
├── CUSTOMERS_VIEW
├── CUSTOMERS_CREATE
├── CUSTOMERS_UPDATE
└── CUSTOMERS_DELETE

MODULE_APPOINTMENTS
├── APPOINTMENTS_VIEW
├── APPOINTMENTS_CREATE
├── APPOINTMENTS_UPDATE
└── APPOINTMENTS_DELETE

// Permission Bundles (tenant bazlı)
permission_bundles
├── tenant_id (FK)
├── name
└── permissions (Many-to-Many)
```

**Uyumsuzluk:**
- Mock'ta `view_customers`, backend'de `CUSTOMERS_VIEW`
- Mock'ta `analysis` modülü var, backend'de yok (sadece `MODULE_HEALTH` var)
- Mock'ta "Roles" var, backend'de sadece "Permission Bundles" var

### 8.3 Güvenlik Açıkları

#### 🔴 Kritik: Tenant İzolasyonu Eksik
**Risk:** Bir tenant admin, başka tenant'ın kullanıcılarına yetki atayabilir.

**Örnek Senaryo:**
1. Tenant A admin'i: `admin@tenanta.com`
2. Tenant B kullanıcısı: `user@tenantb.com` (userId: `xyz-123`)
3. Tenant A admin'i, `POST /api/v1/permissions/users/xyz-123/permissions` çağrısı yapabilir
4. Backend şu anda sadece `ROLE_ADMIN` kontrolü yapıyor, tenant kontrolü yok

**Çözüm:** Her endpoint'te tenant context kontrolü zorunlu olmalı.

#### 🟡 Orta: Permission Controller Erişim Kontrolü
**Risk:** `PermissionController` tüm `ROLE_ADMIN` kullanıcılarına açık.

**Problem:** Super Admin ve Tenant Admin aynı endpoint'leri kullanıyor.

**Çözüm:** 
- Super Admin için: `/api/v1/super-admin/permissions/*`
- Tenant Admin için: `/api/v1/tenant-admin/permissions/*`

---

## 9. Önerilen Mimari Değişiklikler

### 9.1 Backend - Controller Yapısı

#### Mevcut Yapı
```
/api/v1/permissions/*          → ROLE_ADMIN (herkes)
/api/v1/super-admin/*          → ROLE_SUPER_ADMIN
```

#### Önerilen Yapı
```
/api/v1/super-admin/*           → ROLE_SUPER_ADMIN (sadece Super Admin)
/api/v1/tenant-admin/*          → ROLE_ADMIN (sadece Tenant Admin, tenant izolasyonlu)
/api/v1/permissions/*           → Kaldırılmalı veya sadece read-only endpoint'ler
```

### 9.2 Frontend - Store Yapısı

#### Mevcut Yapı
```
usePermissionStore (Zustand)   → Mock data, localStorage
useAuthStore (Zustand)          → Backend API (✅ çalışıyor)
```

#### Önerilen Yapı
```
useAuthStore                    → Backend API (mevcut, değişiklik yok)
useTenantUsers                  → React Query + Backend API
useTenantBundles                → React Query + Backend API
useTenantPermissions            → React Query + Backend API
```

**Neden React Query?**
- Cache yönetimi
- Auto-refresh
- Optimistic updates
- Error handling
- Loading states

### 9.3 Veritabanı - Rol Yapısı

#### Mevcut Yapı
```
public.roles                    → Sistem rolleri (ROLE_ADMIN, ROLE_SUPER_ADMIN)
public.permission_bundles       → Tenant bazlı yetki paketleri
```

#### Önerilen Yapı (Opsiyonel)
```
public.roles                    → Sistem rolleri (değişiklik yok)
public.permission_bundles       → Tenant bazlı yetki paketleri (mevcut, kullanılmalı)
public.tenant_roles (YENİ)      → Tenant bazlı roller (opsiyonel, gelecekte eklenebilir)
```

**Not:** Şu an için `permission_bundles` yeterli. Tenant bazlı rol sistemi gelecekte eklenebilir.

---

## 10. Uygulama Planı

### 10.1 Faz 2: Tenant İçi Yetkilendirme (Öncelikli)

#### Sprint 1: Backend Foundation (4-6 saat)
1. ✅ `TenantAdminController` oluştur
2. ✅ Tenant context helper metodları
3. ✅ Tüm endpoint'lerde tenant izolasyonu
4. ✅ Unit testler

#### Sprint 2: Frontend API Entegrasyonu (4-6 saat)
1. ✅ API hook'ları oluştur
2. ✅ `UsersPage.jsx` backend'e bağla
3. ✅ `PermissionsPage.jsx` backend'e bağla
4. ✅ Mock data'yı kaldır
5. ✅ Error handling

#### Sprint 3: Permission Bundles UI (3-4 saat)
1. ✅ Bundle listesi
2. ✅ Bundle CRUD işlemleri
3. ✅ Bundle'a yetki atama
4. ✅ Bundle'ı kullanıcıya atama

### 10.2 Faz 1: Mock Data Temizliği (Sonraki)

#### Sprint 4: Mock Data Analizi ve Temizlik (2-3 saat)
1. ⚠️ Tüm mock data kullanımlarını tespit et
2. ⚠️ Backend API'lerini tamamla
3. ⚠️ Frontend'deki tüm mock kullanımlarını kaldır

---

## 11. Sonuç ve Öneriler

### 11.1 Özet

**Mevcut Durum:**
- ✅ Multi-tenant mimari çalışıyor
- ✅ Super Admin sistemi tam çalışıyor
- ✅ Permission-based access control altyapısı hazır
- ⚠️ Tenant Admin için özel controller yok
- ❌ Frontend tamamen mock data kullanıyor
- ❌ Tenant izolasyonu eksik

**Kritik Eksikler:**
1. Tenant Admin Controller yok
2. Frontend backend'e bağlı değil
3. Tenant izolasyonu yok
4. Permission Bundles UI yok

### 11.2 Önerilen Yaklaşım

**Öncelik Sırası:**
1. **Faz 2'ye geç** (Tenant içi yetkilendirme) - Daha kritik
2. **Faz 1'i sonra yap** (Mock data temizliği) - Daha az kritik

**Neden?**
- Faz 2, sistemin temel işlevselliğini sağlıyor
- Faz 1, sadece mevcut mock data'yı temizliyor
- Faz 2 tamamlandıktan sonra Faz 1 daha kolay olacak

### 11.3 Riskler

**Yüksek Risk:**
- Tenant izolasyonu eksikliği güvenlik açığı yaratabilir
- Mock data kullanımı production'da sorun yaratabilir

**Orta Risk:**
- Permission bundles kullanılmadığı için sistemin esnekliği azalıyor
- Frontend-backend uyumsuzluğu bakım zorluğu yaratıyor

**Düşük Risk:**
- Dokümantasyon eksikliği
- Test coverage eksikliği

---

## 12. Ek Notlar

### 12.1 Mevcut Çalışan Özellikler
- ✅ Tenant oluşturma
- ✅ Modül atama
- ✅ Kullanıcı oluşturma (Super Admin tarafından)
- ✅ Permission atama (backend seviyesinde)
- ✅ JWT authentication
- ✅ Cookie-based token yönetimi
- ✅ Sidebar permission filtering

### 12.2 Çalışmayan Özellikler
- ❌ Tenant admin kullanıcı yönetimi (frontend mock)
- ❌ Tenant admin yetki yönetimi (frontend mock)
- ❌ Permission bundles kullanımı (backend var, frontend yok)
- ❌ Tenant izolasyonu (güvenlik riski)

---

**Rapor Sonu**

Bu rapor, tenant içi yetkilendirme sistemine geçmeden önce sistemin mevcut durumunu kapsamlı olarak analiz etmektedir. Önerilen yol haritasına göre ilerlenmesi önerilir.
