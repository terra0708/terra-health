# Modül ve Permission Sorunları - Detaylı Analiz Raporu

**Tarih:** 27 Ocak 2026  
**Durum:** İnceleniyor

## Özet

Bu rapor, Terra Health sistemindeki iki kritik sorunu detaylı olarak analiz etmektedir:

1. **System Tenant Modül Görünürlüğü Sorunu**: System tenant için sadece SuperAdmin modülü görünmeli, ancak şu anda tüm modüller görünüyor.

2. **Permission Atama ve Sidebar Görünürlüğü Sorunu**: Kullanıcıya tüm yetkiler verildiğinde bile sidebar'da sadece Dashboard ve Reminders görünüyor.

---

## 1. System Tenant Modül Görünürlüğü Sorunu

### 1.1. Mevcut Durum

**Sorun:** System tenant'ında (SYSTEM tenant, schema='public') modül yönetimi ekranında tüm modüller görünüyor. Ancak System tenant için sadece `MODULE_SUPERADMIN` modülü görünmeli.

**Etkilenen Dosyalar:**
- `frontend/terra/src/apps/terra-shared/views/SuperAdmin/TenantSettingsTabs/ModulesTab.jsx`
- `backend/terra-crm/src/main/java/com/terrarosa/terra_crm/modules/auth/service/SuperAdminService.java` (getAllAvailableModules)

### 1.2. Sistem Akışı Analizi

#### 1.2.1. Frontend Akışı

```
ModulesTab Component
  ↓
useAvailableModules() hook
  ↓
GET /v1/super-admin/modules/available
  ↓
SuperAdminService.getAllAvailableModules()
  ↓
PermissionService.getAllModuleLevelPermissions()
  ↓
Tüm MODULE tipindeki permission'ları döndürür
```

**Kod İncelemesi:**

```javascript
// ModulesTab.jsx - Satır 19
const { data: availableModules = [], isLoading: modulesLoading } = useAvailableModules();

// ModulesTab.jsx - Satır 139-224
{availableModules && availableModules.length > 0 ? (
    <Grid container spacing={2}>
        {availableModules.map((module) => {
            // Tüm modüller gösteriliyor, System tenant kontrolü YOK
        })}
    </Grid>
)}
```

**Sorun:** `ModulesTab` component'i tenant bilgisini alıyor (`tenant` prop) ancak System tenant kontrolü yapmıyor.

#### 1.2.2. Backend Akışı

```java
// SuperAdminService.java - Satır 496-508
public List<Map<String, String>> getAllAvailableModules() {
    return permissionService.getAllModuleLevelPermissions().stream()
        .filter(permission -> !permission.getName().equals("MODULE_HEALTH"))
        .map(permission -> Map.of(
            "name", permission.getName(),
            "description", permission.getDescription() != null ? permission.getDescription() : permission.getName()))
        .collect(Collectors.toList());
}
```

**Sorun:** Backend'de System tenant kontrolü yok. Tüm modüller döndürülüyor.

### 1.3. System Tenant Tanımlaması

```java
// TenantService.java - Satır 199-204
public Tenant getSystemTenant() {
    return tenantRepository.findBySchemaName("public")
        .filter(tenant -> "SYSTEM".equals(tenant.getName()))
        .orElseThrow(() -> new IllegalStateException("SYSTEM tenant not found. Run migrations."));
}
```

**System Tenant Özellikleri:**
- `schemaName = "public"`
- `name = "SYSTEM"`
- Super Admin kullanıcıları bu tenant'a ait

### 1.4. Beklenen Davranış

System tenant için:
- ✅ Sadece `MODULE_SUPERADMIN` modülü görünmeli
- ✅ Diğer tüm modüller (DASHBOARD, APPOINTMENTS, CUSTOMERS, vb.) görünmemeli
- ✅ System tenant'a modül atama işlemi sadece SuperAdmin modülü için yapılabilmeli

### 1.5. Çözüm Önerileri

**Çözüm 1: Frontend'de Filtreleme (Önerilen)**
- `ModulesTab` component'inde tenant kontrolü yap
- Eğer `tenant.schemaName === 'public'` veya `tenant.name === 'SYSTEM'` ise, sadece `MODULE_SUPERADMIN` göster

**Çözüm 2: Backend'de Filtreleme**
- `getAllAvailableModules()` metoduna tenant parametresi ekle
- System tenant için sadece SuperAdmin modülünü döndür

**Çözüm 3: Hibrit Yaklaşım**
- Backend'de tenant-aware endpoint oluştur
- Frontend'de de ekstra kontrol yap

---

## 2. Permission Atama ve Sidebar Görünürlüğü Sorunu

### 2.1. Mevcut Durum

**Sorun:** Kullanıcıya tüm yetkiler verildiğinde (tenant modüllerinden tüm permission'lar atandığında), kullanıcı giriş yaptığında sidebar'da sadece Dashboard ve Reminders görünüyor. Diğer modüller (Appointments, Customers, Statistics, Notifications, Marketing, Settings) görünmüyor.

### 2.2. Sistem Akışı Analizi

#### 2.2.1. Permission Atama Akışı

```
Tenant Modülleri Atama
  ↓
setModulesForTenant(tenant, moduleNames)
  ↓
TenantModule kayıtları oluşturulur/güncellenir
  ↓
Kullanıcıya Permission Atama
  ↓
assignAllTenantPermissionsToUser(user)
  ↓
Tenant'ın modüllerinden tüm permission'lar kullanıcıya atanır
  ↓
UserPermission kayıtları oluşturulur
```

**Kod İncelemesi:**

```java
// PermissionService.java - Satır 406-491
@Transactional
public void assignAllTenantPermissionsToUser(User user) {
    UUID tenantId = user.getTenant().getId();
    UUID userId = user.getId();
    
    // Get all modules for the tenant
    List<Permission> tenantModules = getTenantModules(tenantId);
    
    // For each module, assign the module itself and all its action-level permissions
    for (Permission module : tenantModules) {
        // 1. Assign the MODULE permission itself
        // 2. Assign all ACTION-level permissions for this module
        List<Permission> modulePermissions = getModulePermissions(module.getName());
        for (Permission permission : modulePermissions) {
            // Create UserPermission
            permissionsToSave.add(UserPermission.builder()
                .user(user)
                .permission(permission)
                .build());
        }
    }
    
    // Batch save all permissions
    userPermissionRepository.saveAll(permissionsToSave);
    userPermissionRepository.flush();
}
```

**Bu metod şu durumlarda çağrılıyor:**
1. Tenant oluşturulurken admin kullanıcısına (SuperAdminService.createTenantWithAdmin - Satır 180)
2. İlk kullanıcı kaydolduğunda (AuthService.register - Satır 413)
3. Tenant admin oluşturulurken (SuperAdminService.createTenantAdmin - Satır 650)

#### 2.2.2. JWT Token ve Permission Yükleme

```
Kullanıcı Girişi
  ↓
AuthService.authenticate()
  ↓
JWT Token oluşturulur (user bilgileri + permissions)
  ↓
Frontend'e token gönderilir
  ↓
authStore.login() - token localStorage'a kaydedilir
  ↓
authStore.fetchCurrentUser() - /api/v1/auth/me endpoint'inden user bilgileri alınır
  ↓
user.permissions array'i authStore'a kaydedilir
```

**Kod İncelemesi:**

```javascript
// authStore.js - Satır 111-125
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
```

**JWT Token Oluşturma:**

```java
// JwtTokenProvider.java veya benzeri
// Token'a user permissions ekleniyor mu? Kontrol edilmeli.
```

#### 2.2.3. Sidebar Permission Kontrolü

```javascript
// Sidebar.jsx - Satır 339-347
const normalUserMenuItems = [
    { key: 'dashboard', icon: 'dashboard', label: t('menu.dashboard'), path: '/', 
      requiredPermission: ['DASHBOARD_VIEW', 'MODULE_DASHBOARD'] },
    { key: 'appointments', icon: 'appointments', label: t('menu.appointments'), path: '/appointments', 
      requiredPermission: ['APPOINTMENTS_VIEW', 'MODULE_APPOINTMENTS'] },
    { key: 'customers', icon: 'customers', label: t('menu.customers'), path: '/customers', 
      requiredPermission: ['CUSTOMERS_VIEW', 'MODULE_CUSTOMERS'] },
    { key: 'reminders', icon: 'reminders', label: t('menu.reminders'), path: '/reminders', 
      requiredPermission: ['REMINDERS_VIEW', 'MODULE_REMINDERS'] },
    // ...
];

// Satır 360-363
const menuItems = (isSuperAdmin ? superAdminMenuItems : normalUserMenuItems).filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
});
```

**Sidebar Mantığı:**
- Her menu item için `requiredPermission` array'i var
- `hasPermission()` metodu bu permission'lardan birini kontrol ediyor (OR mantığı)
- Eğer kullanıcıda bu permission'lardan biri yoksa, menu item gösterilmiyor

### 2.3. Olası Sorun Noktaları

#### 2.3.1. Permission Atama Eksikliği

**Sorun:** `assignAllTenantPermissionsToUser` metodu çağrıldığında:
- ✅ MODULE permission'ları atanıyor (MODULE_DASHBOARD, MODULE_APPOINTMENTS, vb.)
- ✅ ACTION permission'ları atanıyor (DASHBOARD_VIEW, APPOINTMENTS_VIEW, vb.)

**Ancak:**
- ❓ Permission'lar gerçekten database'e kaydediliyor mu?
- ❓ JWT token'a permission'lar ekleniyor mu?
- ❓ `/api/v1/auth/me` endpoint'i permission'ları döndürüyor mu?

#### 2.3.2. JWT Token Güncelleme Sorunu

**Sorun:** Permission'lar kullanıcıya atandıktan sonra:
- Kullanıcı çıkış yapıp tekrar giriş yapmadığı sürece eski JWT token kullanılıyor
- Eski token'da eski permission'lar var
- Sidebar eski permission'lara göre render ediliyor

**Çözüm:** Permission atandıktan sonra kullanıcının token'ını yenilemek gerekiyor.

#### 2.3.3. Permission İsimlendirme Uyumsuzluğu

**Sorun:** Sidebar'da kontrol edilen permission isimleri ile database'deki permission isimleri uyumsuz olabilir.

**Örnek:**
- Sidebar: `['DASHBOARD_VIEW', 'MODULE_DASHBOARD']`
- Database: `MODULE_DASHBOARD`, `DASHBOARD_VIEW` var mı?

#### 2.3.4. Tenant Modül-Permission İlişkisi

**Sorun:** Tenant'a modül atandığında, o modülün ACTION permission'ları tenant'a otomatik ekleniyor mu?

**Kontrol Edilmesi Gerekenler:**
- `getModulePermissions(moduleName)` metodu doğru çalışıyor mu?
- Her modül için ACTION permission'ları tanımlı mı?
- Permission hierarchy doğru mu?

### 2.4. Debug Adımları

#### 2.4.1. Database Kontrolü

```sql
-- Kullanıcının permission'larını kontrol et
SELECT p.name, p.type 
FROM user_permissions up
JOIN permissions p ON up.permission_id = p.id
WHERE up.user_id = '<user_id>'
ORDER BY p.type, p.name;

-- Tenant'ın modüllerini kontrol et
SELECT p.name 
FROM tenant_modules tm
JOIN permissions p ON tm.permission_id = p.id
WHERE tm.tenant_id = '<tenant_id>'
AND p.type = 'MODULE';

-- Modülün ACTION permission'larını kontrol et
SELECT p.name, p.type
FROM permissions p
WHERE p.parent_permission_id = (
    SELECT id FROM permissions WHERE name = 'MODULE_APPOINTMENTS'
);
```

#### 2.4.2. Backend Log Kontrolü

```java
// PermissionService.assignAllTenantPermissionsToUser() metodunda
log.info("Found {} modules for tenant {}", tenantModules.size(), tenantId);
log.info("Assigned {} permissions to user {}", totalPermissionsAssigned, user.getEmail());
log.info("Verified {} permissions in database", savedPermissions.size());
```

#### 2.4.3. Frontend Debug

```javascript
// authStore.js'de
console.log('User permissions:', user.permissions);
console.log('Has DASHBOARD_VIEW:', hasPermission('DASHBOARD_VIEW'));
console.log('Has MODULE_DASHBOARD:', hasPermission('MODULE_DASHBOARD'));

// Sidebar.jsx'de
console.log('Menu items:', menuItems);
console.log('Filtered items:', menuItems.filter(item => hasPermission(item.requiredPermission)));
```

### 2.5. Olası Çözümler

#### 2.5.1. Permission Atama Sonrası Token Yenileme

```java
// Permission atandıktan sonra
// Kullanıcının mevcut token'ını invalidate et
// Kullanıcıyı yeniden login yapmaya zorla veya token'ı yenile
```

#### 2.5.2. `/api/v1/auth/me` Endpoint Kontrolü

```java
// AuthController veya UserController'da
@GetMapping("/me")
public ResponseEntity<UserDto> getCurrentUser() {
    User user = getCurrentUser();
    List<String> permissions = permissionService.getUserPermissions(user.getId());
    // permissions'ı UserDto'ya ekle
}
```

#### 2.5.3. Real-time Permission Güncelleme

```javascript
// Permission atandıktan sonra frontend'de
// authStore.fetchCurrentUser() çağrılmalı
// Veya WebSocket ile real-time güncelleme
```

#### 2.5.4. Permission Validation

```java
// assignAllTenantPermissionsToUser metodunda
// Her permission atandıktan sonra validate et
// Hata varsa log'a yaz ve devam et
```

---

## 3. Sistem Mimarisi Özeti

### 3.1. Permission Hierarchy

```
MODULE (MODULE_DASHBOARD, MODULE_APPOINTMENTS, ...)
  ↓
ACTION (DASHBOARD_VIEW, APPOINTMENTS_VIEW, ...)
```

### 3.2. Tenant-User-Permission İlişkisi

```
Tenant
  ↓ (has many)
TenantModule (tenant_modules table)
  ↓ (references)
Permission (MODULE type)
  ↓ (has many children)
Permission (ACTION type)
  ↓ (assigned to)
UserPermission (user_permissions table)
  ↓ (belongs to)
User
```

### 3.3. Permission Atama Akışı

```
1. Tenant'a modül atanır → TenantModule kaydı oluşturulur
2. Kullanıcıya permission atanır → UserPermission kaydı oluşturulur
3. Permission atama sırasında:
   - MODULE permission'ı atanır
   - O modülün tüm ACTION permission'ları atanır
4. Permission'lar database'e kaydedilir
5. JWT token'a permission'lar eklenir
6. Frontend'de permission'lar authStore'a kaydedilir
7. Sidebar permission kontrolü yapılır
```

---

## 4. Önerilen Çözüm Planı

### 4.1. System Tenant Modül Görünürlüğü

**Öncelik:** Yüksek  
**Zorluk:** Düşük  
**Süre:** 1-2 saat

**Adımlar:**
1. `ModulesTab.jsx`'de tenant kontrolü ekle
2. System tenant için sadece `MODULE_SUPERADMIN` göster
3. Backend'de de ekstra kontrol ekle (defense in depth)

### 4.2. Permission Atama ve Sidebar Görünürlüğü

**Öncelik:** Kritik  
**Zorluk:** Orta-Yüksek  
**Süre:** 4-8 saat

**Adımlar:**
1. Database'de permission'ları kontrol et
2. JWT token oluşturma kodunu kontrol et
3. `/api/v1/auth/me` endpoint'ini kontrol et
4. Permission atama sonrası token yenileme mekanizması ekle
5. Frontend'de permission güncelleme mekanizması ekle
6. Test et ve doğrula

---

## 5. Test Senaryoları

### 5.1. System Tenant Modül Görünürlüğü Testi

```
1. Super Admin olarak giriş yap
2. Tenant Settings → SYSTEM tenant'ı seç
3. Modules tab'ına git
4. Beklenen: Sadece SuperAdmin modülü görünmeli
5. Diğer modüller görünmemeli
```

### 5.2. Permission Atama Testi

```
1. Bir tenant oluştur (ör: test-tenant)
2. Tenant'a modüller ata (Dashboard, Appointments, Customers, vb.)
3. Tenant için bir admin kullanıcısı oluştur
4. Admin kullanıcısı ile giriş yap
5. Beklenen: Sidebar'da tüm modüller görünmeli
6. Her modül için sayfaya erişilebilmeli
```

### 5.3. Permission Güncelleme Testi

```
1. Mevcut bir kullanıcıya permission ata
2. Kullanıcı çıkış yapmadan permission'ların güncellenip güncellenmediğini kontrol et
3. Beklenen: Permission'lar güncellenmeli veya kullanıcı yeniden login yapmalı
```

---

## 6. Sonuç ve Öneriler

### 6.1. Kritik Sorunlar

1. **System Tenant Modül Görünürlüğü:** Hızlıca çözülebilir, frontend'de basit bir kontrol yeterli.

2. **Permission Atama ve Sidebar Görünürlüğü:** Daha karmaşık, sistemin birden fazla katmanında değişiklik gerektirebilir.

### 6.2. Öncelik Sırası

1. ✅ System Tenant modül görünürlüğü düzeltilmeli
2. ✅ Permission atama mekanizması debug edilmeli
3. ✅ JWT token güncelleme mekanizması eklenmeli
4. ✅ Real-time permission güncelleme düşünülmeli

### 6.3. İyileştirme Önerileri

1. **Permission Cache:** Permission'ları cache'le, performansı artır
2. **Permission Audit:** Permission değişikliklerini logla
3. **Permission Validation:** Permission atama sırasında validation yap
4. **Unit Tests:** Permission atama için unit testler yaz
5. **Integration Tests:** End-to-end test senaryoları oluştur

---

**Rapor Hazırlayan:** AI Assistant  
**Son Güncelleme:** 27 Ocak 2026
