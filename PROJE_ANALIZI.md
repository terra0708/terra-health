# TERRA-HEALTH CRM - DETAYLI PROJE ANALİZİ

**Tarih:** 26 Ocak 2026  
**Proje Adı:** Terra-Health CRM  
**Versiyon:** 0.0.1-SNAPSHOT

---

## 📋 İÇİNDEKİLER

1. [Genel Bakış](#genel-bakış)
2. [Backend Analizi](#backend-analizi)
3. [Frontend Analizi](#frontend-analizi)
4. [Mimari Özet](#mimari-özet)
5. [Teknoloji Stack](#teknoloji-stack)
6. [Güvenlik ve Yetkilendirme](#güvenlik-ve-yetkilendirme)
7. [Veritabanı Yapısı](#veritabanı-yapısı)
8. [API Endpoint'leri](#api-endpointleri)
9. [Öneriler ve İyileştirmeler](#öneriler-ve-iyileştirmeler)

---

## GENEL BAKIŞ

Terra-Health CRM, sağlık turizmi sektörü için geliştirilmiş, çok kiracılı (multi-tenant) bir CRM sistemidir. Sistem, modüler monolit mimari kullanarak hem sağlık turizmi hem de pazarlama/ads modüllerini desteklemektedir.

### Proje Yapısı
```
terra-health/
├── backend/terra-crm/          # Spring Boot backend
├── frontend/terra/             # React frontend
├── document/                   # API dokümantasyonları
└── steps/                      # Geliştirme adımları
```

### Temel Özellikler
- **Multi-Tenancy:** Schema-per-tenant yaklaşımı ile tam izolasyon
- **JWT Authentication:** Token tabanlı kimlik doğrulama
- **Permission-Based Access Control:** Detaylı yetki yönetimi
- **Modüler Yapı:** Health ve Ads modülleri
- **Real-time Communication:** Socket.io desteği
- **Internationalization:** TR/EN dil desteği

---

## BACKEND ANALİZİ

### Teknoloji Stack

#### Framework ve Kütüphaneler
- **Java:** 25
- **Spring Boot:** 4.0.2
- **Maven:** Build tool
- **PostgreSQL:** Veritabanı
- **Flyway:** Database migration
- **JWT (JJWT):** 0.13.0 - Token yönetimi
- **Lombok:** Boilerplate kod azaltma
- **Spring Security:** Güvenlik altyapısı
- **Spring Data JPA:** ORM
- **Hibernate:** JPA implementasyonu

#### Bağımlılıklar (pom.xml)
```xml
- spring-boot-starter-webmvc
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- spring-boot-starter-validation
- spring-boot-starter-actuator
- spring-boot-starter-flyway
- flyway-database-postgresql
- postgresql (runtime)
- lombok
- jjwt-api, jjwt-impl, jjwt-jackson
```

### Mimari Yapı

#### Paket Yapısı
```
com.terrarosa.terra_crm/
├── core/                        # Çekirdek altyapı
│   ├── common/                 # Ortak entity'ler ve servisler
│   │   ├── dto/                # ApiResponse
│   │   ├── entity/             # BaseEntity
│   │   ├── repository/        # SoftDeleteRepository
│   │   └── service/            # SoftDeleteService
│   ├── config/                 # Konfigürasyonlar
│   │   ├── SuperAdminInitializer
│   │   └── WebConfig
│   ├── exception/              # Exception handling
│   │   ├── GlobalExceptionHandler
│   │   └── TenantNotFoundException
│   ├── security/              # Güvenlik altyapısı
│   │   ├── annotation/        # @RequirePermission
│   │   ├── config/            # SecurityConfig, PermissionEvaluator
│   │   ├── filter/            # JwtAuthenticationFilter
│   │   ├── service/           # JwtService, CustomUserDetailsService
│   │   └── util/              # CookieUtil, PermissionMapper
│   └── tenancy/               # Multi-tenancy altyapısı
│       ├── entity/            # Tenant
│       ├── repository/        # TenantRepository
│       ├── service/           # TenantService
│       ├── TenantContext      # ThreadLocal context
│       ├── TenantInterceptor # Request interceptor
│       ├── HibernateConfig    # Hibernate multi-tenant config
│       └── MultiTenantConnectionProvider
└── modules/                    # İş modülleri
    ├── auth/                   # Kimlik doğrulama modülü
    │   ├── controller/        # AuthController, PermissionController, SuperAdminController
    │   ├── dto/               # LoginRequest, LoginResponse, RegisterRequest, vb.
    │   ├── entity/            # User, Role, Permission, RefreshToken, vb.
    │   ├── repository/        # UserRepository, RoleRepository, vb.
    │   └── service/           # AuthService, PermissionService, SuperAdminService, TokenCleanupService
    ├── health/                # Sağlık turizmi modülü
    │   ├── controller/        # HealthController
    │   ├── dto/               # LeadDto, LeadCreateRequest, LeadUpdateRequest
    │   ├── entity/            # Lead, Patient, Appointment, Service
    │   ├── repository/        # LeadRepository, PatientRepository, AppointmentRepository, ServiceRepository
    │   └── service/           # LeadService
    └── ads/                   # Pazarlama modülü (placeholder)
        └── AdsModule.java
```

### Multi-Tenancy Mimarisi

#### Schema-per-Tenant Yaklaşımı
Sistem, her tenant için ayrı PostgreSQL şeması kullanır. Bu yaklaşım:
- **Tam Veri İzolasyonu:** Her tenant'ın verisi fiziksel olarak ayrı
- **Ölçeklenebilirlik:** Tenant bazlı ölçeklendirme
- **Güvenlik:** Cross-tenant veri erişimi imkansız

#### Tenant Yönetimi

**1. TenantContext (ThreadLocal)**
```java
// Her request thread'inde tenant bilgisi saklanır
TenantContext.setCurrentTenant(tenantId, schemaName);
String currentSchema = TenantContext.getCurrentSchemaName();
```

**2. TenantInterceptor**
- `X-Tenant-ID` header'ını okur
- Tenant'ın varlığını doğrular
- TenantContext'i set eder
- Request sonunda context'i temizler

**3. Hibernate Multi-Tenancy**
- `CurrentTenantIdentifierResolver`: Aktif tenant'ı belirler
- `MultiTenantConnectionProvider`: Schema switching yapar
- Her SQL sorgusu tenant'ın şemasında çalışır

#### Şema Yapısı

**Public Schema (Ortak)**
- `tenants`: Tenant bilgileri
- `users`: Tüm kullanıcılar
- `roles`: Roller
- `permissions`: Yetkiler
- `permission_bundles`: Yetki paketleri
- `tenant_modules`: Tenant-modül ilişkileri
- `user_permissions`: Kullanıcı-yetki ilişkileri
- `refresh_tokens`: Refresh token'lar
- `super_admin_users`: Super admin kullanıcıları

**Tenant Schema (Her tenant için)**
- `services`: Hizmetler
- `leads`: Potansiyel müşteriler
- `patients`: Hasta kayıtları
- `appointments`: Randevular

### Authentication ve Authorization

#### JWT Token Yapısı

**Access Token (15 dakika)**
```json
{
  "sub": "user@example.com",
  "tenantId": "uuid",
  "schemaName": "tenant_schema",
  "roles": ["ROLE_ADMIN"],
  "permissions": ["CUSTOMERS_VIEW", "CUSTOMERS_CREATE"],
  "exp": 1234567890
}
```

**Refresh Token (7 gün)**
- HttpOnly cookie olarak saklanır
- Token rotation ile güvenlik artırılır
- Grace period (30 saniye) ile race condition önlenir

#### Authentication Flow

1. **Login:**
   ```
   POST /api/v1/auth/login
   Headers: X-Tenant-ID: <tenant-uuid>
   Body: { email, password }
   
   Response:
   - Access token (JSON body)
   - Refresh token (HttpOnly cookie)
   - User info
   ```

2. **Token Refresh:**
   ```
   POST /api/v1/auth/refresh
   Cookie: refreshToken=<token>
   
   Response:
   - New access token
   - New refresh token (token rotation)
   ```

3. **Request Flow:**
   ```
   Request → TenantInterceptor → JwtAuthenticationFilter → 
   SecurityContext → TenantContext → Controller
   ```

#### Permission System

**Yetki Hiyerarşisi:**
1. **Super Admin:** Tüm yetkilere sahip, SYSTEM tenant kullanır
2. **Tenant Admin:** Kendi tenant'ı içinde tüm yetkilere sahip
3. **User:** Tenant'ın modül havuzundan atanan yetkilere sahip

**Yetki Kontrolü:**
- `@PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'PERMISSION_NAME')")`
- JWT token içindeki permissions claim'i kontrol edilir
- Tenant modül havuzu ile doğrulama yapılır

**Yetki Tipleri:**
- `CUSTOMERS_VIEW`, `CUSTOMERS_CREATE`, `CUSTOMERS_UPDATE`, `CUSTOMERS_DELETE`
- `USERS_VIEW`, `USERS_CREATE`, `USERS_UPDATE`, `USERS_DELETE`
- `PERMISSIONS_VIEW`, `PERMISSIONS_MANAGE`
- Modül bazlı yetkiler (gelecekte genişletilebilir)

### Entity Yapısı

#### Core Entities

**BaseEntity**
```java
- id: UUID
- createdAt: LocalDateTime
- updatedAt: LocalDateTime
- deleted: Boolean (soft delete)
- deletedAt: LocalDateTime
- deletedBy: UUID
```

**Tenant**
```java
- id: UUID
- name: String
- schemaName: String (unique)
```

**User**
```java
- id: UUID
- email: String (unique)
- password: String (BCrypt encoded)
- firstName: String
- lastName: String
- tenant: Tenant (ManyToOne)
- enabled: Boolean
- roles: Set<Role> (ManyToMany)
- bundles: Set<PermissionBundle> (ManyToMany)
```

**Role**
```java
- id: UUID
- name: String (ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT, ROLE_SUPER_ADMIN)
```

**Permission**
```java
- id: UUID
- name: String (CUSTOMERS_VIEW, vb.)
- description: String
```

**PermissionBundle**
```java
- id: UUID
- name: String
- description: String
- permissions: Set<Permission>
- users: Set<User>
```

**RefreshToken**
```java
- id: UUID
- user: User
- token: String
- expiresAt: LocalDateTime
- revoked: Boolean
- revokedAt: LocalDateTime
```

#### Health Module Entities

**Lead**
```java
- id: UUID
- name: String
- phone: String
- email: String
- country: String
- source: String
- dynamicData: JSONB (custom form fields)
- service: Service (ManyToOne)
- assignedTo: UUID
- status: String
```

**Patient**
```java
- id: UUID
- lead: Lead (ManyToOne)
- name: String
- phone: String
- email: String
- country: String
- medicalHistory: String
- passportNumber: String
```

**Appointment**
```java
- id: UUID
- patient: Patient (ManyToOne)
- doctorId: UUID
- appointmentDate: LocalDateTime
- status: String
- notes: String
```

**Service**
```java
- id: UUID
- name: String
- description: String
```

### Service Layer

#### AuthService
**Metodlar:**
- `login(LoginRequest, String tenantId)`: Kullanıcı girişi
- `refreshToken(String refreshToken)`: Token yenileme
- `register(RegisterRequest)`: Kullanıcı kaydı (deprecated)

**Özellikler:**
- Tenant doğrulama
- Super Admin özel işleme
- Permission yükleme
- Token rotation
- Grace period

#### PermissionService
**Metodlar:**
- `getUserPermissions(UUID userId)`: Kullanıcı yetkilerini getir
- `assignAllTenantPermissionsToUser(User user)`: İlk kullanıcıya tüm yetkileri ata
- `validatePermissionForTenant(String permission, UUID tenantId)`: Yetki doğrulama

#### TenantService
**Metodlar:**
- `createTenant(String name)`: Yeni tenant oluştur
  - Public schema'ya tenant kaydı
  - Yeni PostgreSQL şeması oluştur
  - Flyway migration çalıştır
  - Tenant modüllerini ata
- `getSystemTenant()`: SYSTEM tenant'ı getir
- `getTenantById(UUID id)`: Tenant getir

#### LeadService
**Metodlar:**
- `getAllLeads()`: Tüm lead'leri getir
- `getLeadById(UUID id)`: Lead getir
- `createLead(LeadCreateRequest)`: Yeni lead oluştur
- `updateLead(UUID id, LeadUpdateRequest)`: Lead güncelle
- `deleteLead(UUID id)`: Lead sil (soft delete)

### Controller Layer

#### AuthController
**Endpoints:**
- `POST /api/v1/auth/login`: Giriş
- `POST /api/v1/auth/refresh`: Token yenileme
- `POST /api/v1/auth/register`: Kayıt (deprecated)

#### PermissionController
**Endpoints:**
- `GET /api/v1/auth/permissions`: Tüm yetkileri listele
- `GET /api/v1/auth/permissions/bundles`: Yetki paketlerini listele
- `GET /api/v1/auth/permissions/user/{userId}`: Kullanıcı yetkilerini getir

#### SuperAdminController
**Endpoints:**
- `POST /api/v1/super-admin/tenants`: Yeni tenant oluştur
- `GET /api/v1/super-admin/tenants`: Tüm tenant'ları listele
- `GET /api/v1/super-admin/tenants/{id}`: Tenant detayı
- `POST /api/v1/super-admin/tenants/{id}/admin`: Tenant admin oluştur

#### HealthController
**Endpoints:**
- `GET /api/v1/health/leads`: Lead'leri listele
- `GET /api/v1/health/leads/{id}`: Lead detayı
- `POST /api/v1/health/leads`: Yeni lead oluştur
- `PUT /api/v1/health/leads/{id}`: Lead güncelle
- `DELETE /api/v1/health/leads/{id}`: Lead sil

**Yetkilendirme:**
- Tüm endpoint'ler `@PreAuthorize` ile korumalı
- Permission bazlı erişim kontrolü

### Database Migrations

#### Flyway Yapısı
```
db/migration/
├── public/              # Public schema migrations
│   ├── V1__create_tenants_table.sql
│   ├── V2__create_users_and_roles_tables.sql
│   ├── V3__create_permissions_tables.sql
│   ├── V4__add_soft_delete_to_base_entities.sql
│   ├── V5__create_permission_bundles.sql
│   ├── V6__create_super_admin_table.sql
│   ├── V7__refactor_tenant_modules_to_simple_id.sql
│   ├── V8__add_super_admin_role.sql
│   ├── V9__create_system_tenant.sql
│   ├── V10__refactor_super_admin_to_simple_id.sql
│   └── V11__create_refresh_tokens_table.sql
└── tenant/              # Tenant schema migrations
    ├── V1__create_tenant_tables.sql
    └── V7__add_soft_delete_to_tenant_tables.sql
```

#### Önemli Migration'lar

**V1__create_tenants_table.sql**
- Tenant tablosu oluşturur
- Schema name unique constraint
- Auto-update trigger

**V2__create_users_and_roles_tables.sql**
- Users, roles, user_roles tabloları
- Tenant foreign key
- Email unique constraint

**V3__create_permissions_tables.sql**
- Permissions, tenant_modules, user_permissions tabloları
- Permission bundle yapısı

**V1__create_tenant_tables.sql (tenant)**
- Services, leads, patients, appointments tabloları
- JSONB dynamic_data kolonu
- Index'ler

### Security Configuration

#### SecurityConfig
```java
- CSRF: Disabled (JWT kullanılıyor)
- CORS: localhost:3000, localhost:5173
- Session: STATELESS
- Password Encoder: BCrypt (strength 12)
- Method Security: Enabled (@PreAuthorize)
```

#### JwtAuthenticationFilter
**Görevler:**
1. Authorization header'dan token al
2. Token'ı validate et
3. X-Tenant-ID ile tenantId claim'ini karşılaştır
4. SecurityContext'e Authentication set et
5. TenantContext'i set et

#### GlobalExceptionHandler
- Tüm exception'ları yakalar
- ApiResponse formatında döner
- Loglama yapar

### Soft Delete Mekanizması

**BaseEntity:**
- `deleted: Boolean`
- `deletedAt: LocalDateTime`
- `deletedBy: UUID`

**Hibernate Filter:**
- `@SQLRestriction("COALESCE(deleted, false) = false")`
- Silinen kayıtlar otomatik filtrelenir

**SoftDeleteService:**
- Generic soft delete işlemleri
- Audit bilgisi ekler

### Scheduled Tasks

**TokenCleanupService:**
- `@Scheduled` ile periyodik çalışır
- Süresi dolmuş refresh token'ları temizler
- Veritabanı optimizasyonu

### Configuration

#### application.yaml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/terra-crm
    username: cagri
    password: cagri_1234
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
  
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration/public
    schemas: public

jwt:
  secret: ${JWT_SECRET:...}
  expiration: 900000  # 15 minutes
  refresh-expiration: 604800000  # 7 days

server:
  port: 8080
```

### Test Yapısı

**Integration Tests:**
- `AuthGracePeriodIT`: Grace period testi
- `TokenCleanupServiceIT`: Token temizleme testi
- `TerraCrmApplicationTests`: Ana uygulama testi

---

## FRONTEND ANALİZİ

### Teknoloji Stack

#### Framework ve Kütüphaneler
- **React:** 19.0.0
- **Vite:** 6.0.7 (Build tool)
- **React Router:** 7.1.1
- **Material-UI (MUI):** 6.4.0
- **Zustand:** 5.0.3 (State management)
- **TanStack React Query:** 5.64.0 (Server state)
- **Axios:** 1.7.9 (HTTP client)
- **React Hook Form:** 7.54.2
- **Zod:** 3.24.1 (Validation)
- **i18next:** 24.2.1 (Internationalization)
- **Socket.io-client:** 4.8.3
- **Recharts:** 2.15.0 (Charts)
- **FullCalendar:** 6.1.20 (Calendar)

### Mimari Yapı

#### Klasör Yapısı
```
frontend/terra/
├── src/
│   ├── main.jsx                 # Entry point
│   ├── App.jsx                   # Ana routing
│   ├── apps/                     # Modüler uygulama yapısı
│   │   ├── terra-shared/        # Paylaşılan modüller
│   │   ├── terra-health/        # Health modülü
│   │   └── terra-ads/           # Marketing modülü
│   ├── assets/                  # Statik dosyalar
│   │   └── locales/             # i18n çevirileri
│   ├── actions/                  # Karmaşık iş akışları
│   ├── mocks/                   # Mock data
│   └── views/                   # Placeholder sayfalar
├── public/                      # Public assets
├── vite.config.js               # Vite config
├── jsconfig.json                # Path aliases
└── package.json
```

### Modüler Yapı

#### terra-shared (Paylaşılan Modüller)

**app/**
- `MainLayout.jsx`: Ana layout (Sidebar + Header)
- `providers.jsx`: React Query, Theme, Router providers

**core/**
- `api.js`: Axios client ve interceptors
  - Request interceptor: Token ve Tenant ID ekleme
  - Response interceptor: Token refresh, error handling
  - Token refresh queue mekanizması
- `theme.js`: MUI tema konfigürasyonu
- `i18n.js`: i18next konfigürasyonu
- `socket.js`: Socket.io client
- `config.js`: Genel config
- `useSettingsStore.js`: Settings state (Zustand)

**common/ui/**
- `Button.jsx`: Custom button component
- `TextField.jsx`: Custom text field
- `Sidebar.jsx`: Ana sidebar navigasyon
- `Header.jsx`: Üst bar
- `ErrorBoundary.jsx`: Hata yakalama
- `LoadingSpinner.jsx`: Yükleme göstergesi
- `PageSkeleton.jsx`: Sayfa skeleton
- `ModulePageWrapper.jsx`: Modül sayfa wrapper'ı
- `AccessibleModal.jsx`: Erişilebilir modal
- `EditableList.jsx`: Düzenlenebilir liste
- `LoadingSkeleton.jsx`: Skeleton loader
- `SettingsSwitchers.jsx`: Ayar switcher'ları
- `SkipLink.jsx`: Erişilebilirlik skip link

**common/hooks/**
- `useAsync.js`: Async işlemler için hook
- `useLoading.js`: Loading state yönetimi
- `useLookup.js`: Lookup verileri
- `usePerformance.js`: Performans izleme
- `usePackageLabels.js`: Paket etiketleri

**common/utils/**
- `accessibility.js`: Erişilebilirlik yardımcıları
- `performance.js`: Performans yardımcıları
- `react-query-helpers.js`: React Query yardımcıları

**modules/auth/**
- `components/LoginForm.jsx`: Giriş formu
- `hooks/useAuthStore.js`: Auth state (Zustand)
- `schemas/loginSchema.js`: Zod validation şeması

**modules/clients/**
- `components/`: ClientCard, ClientFilters, ClientTable, vb.
- `data/`: mockData, schema, countries
- `hooks/useClientStore.js`: Client state

**modules/users/**
- `components/`: UserDrawer, UserDetailsDialog, UserTerminationDialog
- `data/mockData.js`: Mock kullanıcı verileri
- `hooks/`: useUsers, useUserStore

**modules/permissions/**
- `components/`: PermissionCard, CreateDrawer, PermissionDeleteDialog
- `data/mockData.js`: Mock yetki verileri
- `hooks/`: usePermissions, usePermissionStore

**modules/reminders/**
- `components/`: ReminderCard, AddReminderDialog, ReminderFilters
- `hooks/`: useReminders, useReminderStore, useReminderSettingsStore
- `utils/`: iconUtils, migrationUtils, protectionUtils

**modules/notifications/**
- `NotificationCenter.jsx`: Bildirim merkezi
- `NotificationManager.jsx`: Bildirim yöneticisi
- `hooks/useNotificationStore.js`: Bildirim state

**views/**
- `Login/LoginPage.jsx`: Giriş sayfası
- `Clients/ClientsPage.jsx`: Müşteri listesi
- `Notifications/NotificationsPage.jsx`: Bildirimler
- `Reminders/RemindersPage.jsx`: Hatırlatıcılar
- `Settings/`: Ayarlar sayfaları
  - `UsersPage.jsx`: Kullanıcı yönetimi
  - `PermissionsPage.jsx`: Yetki yönetimi
  - `SystemSettingsPage.jsx`: Sistem ayarları
  - `CustomerPanel.jsx`: Müşteri paneli
  - `ReminderSettingsPage.jsx`: Hatırlatıcı ayarları

#### terra-health (Health Modülü)

**modules/appointments/**
- `components/`:
  - `AppointmentCalendar.jsx`: Takvim görünümü
  - `AppointmentDrawer.jsx`: Randevu detay drawer'ı
  - `DoctorSelector.jsx`: Doktor seçici
- `data/mockData.js`: Mock randevu verileri
- `hooks/`:
  - `useAppointments.js`: Randevu API hook'ları
  - `useAppointmentStore.js`: Randevu state

**modules/customers/**
- `components/`:
  - `CustomerTable.jsx`: Müşteri tablosu
  - `CustomerDrawer.jsx`: Müşteri detay drawer'ı
  - `CustomerDetailsDialog.jsx`: Müşteri detay dialog'u
  - `CustomerFilters.jsx`: Filtreleme bileşeni
  - `CustomerStats.jsx`: İstatistikler
  - `CustomerMobileCard.jsx`: Mobil kart görünümü
  - `PersonalInfoTab.jsx`: Kişisel bilgiler sekmesi
  - `StatusTab.jsx`: Durum sekmesi
  - `RemindersTab.jsx`: Hatırlatıcılar sekmesi
  - `FilesTab.jsx`: Dosyalar sekmesi
  - `PaymentsTab.jsx`: Ödemeler sekmesi
  - `HealthNotificationManager.jsx`: Bildirim yöneticisi
  - `CustomerCommunicationDrawer.jsx`: İletişim drawer'ı
- `data/`:
  - `mockData.js`: Mock müşteri verileri
  - `schema.js`: Zod validation şeması
  - `patientSchema.js`: Hasta şeması
  - `countries.js`: Ülke listesi
- `hooks/`:
  - `useCustomers.js`: Müşteri API hook'ları
  - `useCustomerStore.js`: Müşteri state
  - `useCustomerSettingsStore.js`: Müşteri ayar state'i
  - `usePatientDetailsStore.js`: Hasta detay state'i
  - `useMigrateCustomers.js`: Müşteri migrasyon hook'u
- `migrations/splitCustomers.js`: Müşteri ayrıştırma

**modules/finance/**: Placeholder
**modules/sales/**: Placeholder
**modules/staff/**: Placeholder

**views/**
- `Dashboard/DashboardPage.jsx`: Ana dashboard
- `Appointments/AppointmentsPage.jsx`: Randevu yönetimi
- `Customers/CustomersPage.jsx`: Müşteri yönetimi
- `Reminders/RemindersPage.jsx`: Hatırlatıcılar

#### terra-ads (Marketing Modülü)

**modules/marketing/**
- `components/MarketingStatCard.jsx`: İstatistik kartı
- `hooks/`:
  - `useMarketingDashboard.js`: Dashboard hook'u
  - `useMarketingCampaigns.js`: Kampanya hook'u
  - `useMarketingStore.js`: Marketing state
- `utils/platformHelpers.js`: Platform yardımcıları

**views/marketing/**
- `MarketingDashboard.jsx`: Marketing dashboard
- `MarketingCampaigns.jsx`: Kampanya listesi
- `MarketingCampaignDetail.jsx`: Kampanya detayı
- `MarketingAttribution.jsx`: Attribution analizi

### State Management

#### Zustand Stores

**useAuthStore** (`terra-shared/modules/auth/hooks/useAuthStore.js`)
```javascript
State:
- user: User object
- isAuthenticated: Boolean
- loading: Boolean
- error: Error
- _hasHydrated: Boolean (hydration flag)

Actions:
- login({ email, password, tenantId })
- logout()
- refreshUser(userData)
- clearError()

Persistence:
- localStorage: 'terra-auth-storage'
- Partialize: sadece user ve isAuthenticated
```

**useSettingsStore** (`terra-shared/core/useSettingsStore.js`)
- Tema ayarları
- Dil ayarları
- Diğer kullanıcı tercihleri

**Module-specific Stores:**
- `useCustomerStore`: Müşteri state
- `useAppointmentStore`: Randevu state
- `useUserStore`: Kullanıcı state
- `usePermissionStore`: Yetki state
- `useReminderStore`: Hatırlatıcı state
- `useMarketingStore`: Marketing state

#### React Query

**Kullanım:**
- Server state yönetimi
- Caching
- Background refetching
- Optimistic updates

**Provider:**
```javascript
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### Routing

#### App.jsx Yapısı

**Public Routes:**
- `/login`: Giriş sayfası

**Protected Routes:**
- `/`: Dashboard (index)
- `/appointments`: Randevu yönetimi
- `/customers`: Müşteri yönetimi
- `/reminders`: Hatırlatıcılar
- `/marketing/*`: Marketing modülü
  - `/marketing/dashboard`
  - `/marketing/campaigns`
  - `/marketing/campaigns/:id`
  - `/marketing/attribution`
- `/statistics`: İstatistikler
- `/notifications`: Bildirimler
- `/settings/*`: Ayarlar
  - `/settings`: Sistem ayarları
  - `/settings/users`: Kullanıcı yönetimi
  - `/settings/permissions`: Yetki yönetimi
  - `/settings/reminders`: Hatırlatıcı ayarları
  - `/settings/customer-panel`: Müşteri paneli

**ProtectedRoute Component:**
- Hydration kontrolü
- Authentication kontrolü
- Loading state yönetimi
- Redirect handling

**Lazy Loading:**
- Tüm sayfalar lazy load edilir
- Code splitting için Suspense kullanılır
- ErrorBoundary ile hata yakalama

### API Integration

#### Axios Client (`core/api.js`)

**Request Interceptor:**
```javascript
- Authorization header ekleme (Bearer token)
- X-Tenant-ID header ekleme
- localStorage'dan token ve tenantId okuma
```

**Response Interceptor:**
```javascript
- ApiResponse yapısını düzleştirme
- 401 hatası yakalama
- Token refresh mekanizması
- Refresh queue (concurrent request handling)
- Error normalization
```

**Token Refresh Flow:**
1. 401 hatası alındığında
2. Refresh token cookie'den okunur
3. `/auth/refresh` endpoint'ine istek atılır
4. Yeni token localStorage'a yazılır
5. Başarısız istek tekrar denenir
6. Queue'daki diğer istekler de yeni token ile çalıştırılır

### Internationalization (i18n)

#### Yapı
```
assets/locales/
├── en/
│   └── translation.json
├── tr/
│   └── translation.json
├── terra-shared/
│   ├── en.json
│   └── tr.json
├── terra-health/
│   ├── en.json
│   └── tr.json
└── terra-ads/
    ├── en.json
    └── tr.json
```

**Kullanım:**
```javascript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
t('key');
```

### UI Components

#### Material-UI Integration
- MUI v6 kullanılıyor
- Custom tema (`theme.js`)
- Responsive design
- Dark mode desteği (hazırlık aşamasında)

#### Custom Components
- Tüm MUI bileşenleri custom wrapper'larla sarmalanmış
- Consistent styling
- Accessibility özellikleri
- Error handling

### Form Management

#### React Hook Form + Zod
- Form validation
- Type-safe form handling
- Error messages (i18n)
- Schema validation

**Örnek:**
```javascript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### Real-time Communication

#### Socket.io Client
- `core/socket.js`: Socket bağlantısı
- Real-time bildirimler
- Event handling
- Reconnection logic

### Performance Optimizations

#### Code Splitting
- Lazy loading
- Route-based splitting
- Component-based splitting

#### Memoization
- React.memo
- useMemo
- useCallback

#### Virtualization
- Büyük listeler için (gelecekte)

### Error Handling

#### ErrorBoundary
- App-level error boundary
- Component-level error boundary
- Error logging
- Fallback UI

#### API Error Handling
- Normalized error structure
- User-friendly messages
- Error logging

### Accessibility

#### Özellikler
- ARIA labels
- Keyboard navigation
- Focus management
- Skip links
- Screen reader support

### Path Aliases (vite.config.js)

```javascript
@shared          → src/apps/terra-shared
@terra-health    → src/apps/terra-health
@terra-ads       → src/apps/terra-ads
@core            → src/apps/terra-shared/core
@common          → src/apps/terra-shared/common
@app             → src/apps/terra-shared/app
@assets          → src/assets
@mocks           → src/mocks
@actions         → src/actions
```

---

## MİMARİ ÖZET

### Genel Mimari
- **Modüler Monolit:** Backend ve frontend modüler yapıda
- **Multi-Tenancy:** Schema-per-tenant
- **Microservices Hazırlığı:** Modüller bağımsız çalışabilir

### Backend Mimari
- **Layered Architecture:**
  - Controller → Service → Repository → Entity
- **Domain-Driven Design:** Modül bazlı organizasyon
- **Security First:** Her katmanda güvenlik

### Frontend Mimari
- **Feature-Based Structure:** Modül bazlı organizasyon
- **Component Composition:** Küçük, yeniden kullanılabilir bileşenler
- **State Management:** Zustand (client) + React Query (server)

### Communication
- **RESTful API:** JSON over HTTP
- **JWT Authentication:** Stateless auth
- **WebSocket:** Real-time updates (Socket.io)

---

## TEKNOLOJİ STACK

### Backend
- Java 25
- Spring Boot 4.0.2
- PostgreSQL
- Flyway
- JWT (JJWT 0.13.0)
- Spring Security
- Hibernate
- Lombok

### Frontend
- React 19
- Vite 6
- Material-UI 6
- Zustand 5
- TanStack React Query 5
- Axios
- React Hook Form + Zod
- i18next
- Socket.io-client
- Recharts
- FullCalendar

### Development Tools
- Maven (Backend)
- ESLint (Frontend)
- Git

---

## GÜVENLİK VE YETKİLENDİRME

### Authentication
- JWT-based stateless authentication
- Access token (15 dakika)
- Refresh token (7 gün, HttpOnly cookie)
- Token rotation
- Grace period (30 saniye)

### Authorization
- Permission-based access control
- Role-based access control
- Tenant isolation
- Method-level security (@PreAuthorize)

### Security Features
- BCrypt password hashing (strength 12)
- CORS configuration
- CSRF disabled (JWT kullanıldığı için)
- SQL injection protection (JPA)
- XSS protection (React)
- Tenant validation (header vs token)

---

## VERİTABANI YAPISI

### Public Schema
- `tenants`: Tenant bilgileri
- `users`: Kullanıcılar
- `roles`: Roller
- `permissions`: Yetkiler
- `permission_bundles`: Yetki paketleri
- `tenant_modules`: Tenant-modül ilişkileri
- `user_permissions`: Kullanıcı-yetki ilişkileri
- `refresh_tokens`: Refresh token'lar
- `super_admin_users`: Super admin'ler

### Tenant Schema (Her tenant için)
- `services`: Hizmetler
- `leads`: Potansiyel müşteriler
- `patients`: Hasta kayıtları
- `appointments`: Randevular

### Özellikler
- UUID primary keys
- Soft delete (deleted flag)
- Audit fields (created_at, updated_at)
- JSONB columns (dynamic_data)
- Indexes for performance

---

## API ENDPOINT'LERİ

### Authentication
- `POST /api/v1/auth/login`: Giriş
- `POST /api/v1/auth/refresh`: Token yenileme
- `POST /api/v1/auth/register`: Kayıt (deprecated)

### Permissions
- `GET /api/v1/auth/permissions`: Yetki listesi
- `GET /api/v1/auth/permissions/bundles`: Yetki paketleri
- `GET /api/v1/auth/permissions/user/{userId}`: Kullanıcı yetkileri

### Super Admin
- `POST /api/v1/super-admin/tenants`: Tenant oluştur
- `GET /api/v1/super-admin/tenants`: Tenant listesi
- `GET /api/v1/super-admin/tenants/{id}`: Tenant detayı
- `POST /api/v1/super-admin/tenants/{id}/admin`: Tenant admin oluştur

### Health Module
- `GET /api/v1/health/leads`: Lead listesi
- `GET /api/v1/health/leads/{id}`: Lead detayı
- `POST /api/v1/health/leads`: Lead oluştur
- `PUT /api/v1/health/leads/{id}`: Lead güncelle
- `DELETE /api/v1/health/leads/{id}`: Lead sil

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

---

## ÖNERİLER VE İYİLEŞTİRMELER

### Backend

1. **API Documentation**
   - Swagger/OpenAPI entegrasyonu
   - Endpoint dokümantasyonu

2. **Testing**
   - Unit test coverage artırılmalı
   - Integration test'ler genişletilmeli
   - E2E test'ler eklenmeli

3. **Monitoring & Logging**
   - Structured logging (Logback/Log4j2)
   - Metrics collection (Micrometer)
   - Health checks

4. **Performance**
   - Caching stratejisi (Redis)
   - Database query optimization
   - Connection pooling tuning

5. **Security**
   - Rate limiting
   - Input validation güçlendirme
   - Security headers

6. **Documentation**
   - API dokümantasyonu
   - Architecture decision records
   - Deployment guide

### Frontend

1. **Testing**
   - Unit test'ler (Vitest/Jest)
   - Component test'ler (React Testing Library)
   - E2E test'ler (Playwright/Cypress)

2. **Performance**
   - Bundle size optimization
   - Image optimization
   - Lazy loading genişletme
   - Virtual scrolling

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation iyileştirme
   - Screen reader testleri

4. **Error Handling**
   - Error boundary genişletme
   - Error logging (Sentry)
   - User-friendly error messages

5. **State Management**
   - State normalization
   - Cache invalidation stratejisi
   - Optimistic updates

6. **Documentation**
   - Component Storybook
   - API integration guide
   - Deployment guide

### Genel

1. **CI/CD**
   - Automated testing
   - Automated deployment
   - Environment management

2. **Monitoring**
   - Application performance monitoring
   - Error tracking
   - User analytics

3. **Documentation**
   - Developer onboarding guide
   - Architecture documentation
   - API documentation

4. **Security**
   - Security audit
   - Penetration testing
   - Dependency scanning

5. **Scalability**
   - Load testing
   - Database sharding stratejisi
   - Caching stratejisi

---

## SONUÇ

Terra-Health CRM, modern teknolojiler kullanılarak geliştirilmiş, ölçeklenebilir ve güvenli bir CRM sistemidir. Multi-tenant mimarisi, detaylı yetkilendirme sistemi ve modüler yapısı ile sağlık turizmi sektörüne özel ihtiyaçları karşılamaktadır.

Proje, hem backend hem de frontend tarafında iyi organize edilmiş bir yapıya sahiptir. Modüler mimari sayesinde yeni özellikler eklemek ve mevcut özellikleri genişletmek kolaydır.

Önerilen iyileştirmeler ile sistem daha da güçlendirilebilir ve production-ready hale getirilebilir.

---

**Analiz Tarihi:** 26 Ocak 2026  
**Analiz Eden:** AI Assistant  
**Versiyon:** 1.0
