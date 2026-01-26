# Frontend Klasör Yapısı

## Genel Yapı

```
frontend/terra/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Ana routing ve layout
│   │
│   ├── apps/                       # Modüler uygulama yapısı
│   │   ├── terra-shared/          # Paylaşılan modüller ve core
│   │   ├── terra-health/          # Health modülü
│   │   └── terra-ads/             # Marketing/Ads modülü
│   │
│   ├── assets/                     # Statik dosyalar
│   │   └── locales/               # i18n çevirileri
│   │
│   ├── actions/                    # Karmaşık iş akışları
│   ├── mocks/                      # Mock data
│   └── views/                      # Placeholder sayfalar
│
├── public/                         # Public assets
├── vite.config.js                  # Vite config ve path aliases
├── jsconfig.json                   # JS path aliases
└── package.json                    # Dependencies
```

## Detaylı Yapı

### 📁 `src/apps/terra-shared/` - Paylaşılan Modüller

```
terra-shared/
├── app/                            # Uygulama root katmanı
│   ├── MainLayout.jsx             # Ana layout (Sidebar + Header)
│   ├── providers.jsx              # React Query, Theme, Router providers
│   └── index.js
│
├── core/                           # Merkezi sistem altyapısı
│   ├── api.js                     # Axios client ve interceptors
│   ├── theme.js                   # MUI tema konfigürasyonu
│   ├── i18n.js                    # i18next konfigürasyonu
│   ├── socket.js                  # Socket.io client
│   ├── config.js                  # Genel config
│   ├── useSettingsStore.js        # Settings state (Zustand)
│   └── index.js
│
├── common/                         # Tasarım sistemi ve yardımcılar
│   ├── ui/                        # UI bileşenleri
│   │   ├── Button.jsx
│   │   ├── TextField.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ModulePageWrapper.jsx
│   │   └── index.js
│   │
│   ├── hooks/                     # Genel hooks
│   │   ├── useAsync.js
│   │   ├── useLoading.js
│   │   ├── useLookup.js
│   │   ├── usePerformance.js
│   │   └── index.js
│   │
│   └── utils/                     # Yardımcı fonksiyonlar
│       ├── accessibility.js
│       ├── performance.js
│       ├── react-query-helpers.js
│       └── index.js
│
├── modules/                        # İş modülleri
│   ├── auth/                      # Authentication
│   │   ├── components/
│   │   │   └── LoginForm.jsx
│   │   ├── hooks/
│   │   │   └── useAuthStore.js
│   │   ├── schemas/
│   │   │   └── loginSchema.js
│   │   └── index.js
│   │
│   ├── clients/                   # Müşteri yönetimi (shared)
│   │   ├── components/
│   │   ├── data/
│   │   ├── hooks/
│   │   └── index.js
│   │
│   ├── users/                     # Kullanıcı yönetimi
│   │   ├── components/
│   │   ├── data/
│   │   ├── hooks/
│   │   └── index.js
│   │
│   ├── permissions/               # İzin yönetimi
│   │   ├── components/
│   │   ├── data/
│   │   ├── hooks/
│   │   └── index.js
│   │
│   ├── reminders/                # Hatırlatıcılar
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.js
│   │
│   └── notifications/             # Bildirimler
│       ├── hooks/
│       ├── NotificationCenter.jsx
│       └── NotificationManager.jsx
│
└── views/                         # Sayfalar
    ├── Login/
    │   └── LoginPage.jsx
    ├── Clients/
    │   └── ClientsPage.jsx
    ├── Notifications/
    │   └── NotificationsPage.jsx
    ├── Reminders/
    │   └── RemindersPage.jsx
    └── Settings/
        ├── UsersPage.jsx
        ├── PermissionsPage.jsx
        ├── SystemSettingsPage.jsx
        ├── CustomerPanel.jsx
        ├── ReminderSettingsPage.jsx
        └── components/
            ├── customer/
            ├── reminder/
            └── shared/
```

### 📁 `src/apps/terra-health/` - Health Modülü

```
terra-health/
├── modules/
│   ├── appointments/              # Randevu yönetimi
│   │   ├── components/
│   │   │   ├── AppointmentCalendar.jsx
│   │   │   ├── AppointmentDrawer.jsx
│   │   │   └── DoctorSelector.jsx
│   │   ├── data/
│   │   │   └── mockData.js
│   │   ├── hooks/
│   │   │   ├── useAppointments.js
│   │   │   └── useAppointmentStore.js
│   │   └── index.js
│   │
│   ├── customers/                 # Müşteri yönetimi (health-specific)
│   │   ├── components/
│   │   │   ├── CustomerDrawer.jsx
│   │   │   ├── CustomerTable.jsx
│   │   │   ├── CustomerDetailsDialog.jsx
│   │   │   ├── CustomerFilters.jsx
│   │   │   ├── PersonalInfoTab.jsx
│   │   │   ├── StatusTab.jsx
│   │   │   ├── RemindersTab.jsx
│   │   │   ├── FilesTab.jsx
│   │   │   ├── PaymentsTab.jsx
│   │   │   └── HealthNotificationManager.jsx
│   │   ├── data/
│   │   │   ├── mockData.js
│   │   │   ├── schema.js
│   │   │   ├── patientSchema.js
│   │   │   └── countries.js
│   │   ├── hooks/
│   │   │   ├── useCustomers.js
│   │   │   ├── useCustomerStore.js
│   │   │   ├── useCustomerSettingsStore.js
│   │   │   ├── usePatientDetailsStore.js
│   │   │   └── useMigrateCustomers.js
│   │   ├── migrations/
│   │   │   └── splitCustomers.js
│   │   └── index.js
│   │
│   ├── finance/                   # Finans modülü (placeholder)
│   │   └── index.js
│   ├── sales/                     # Satış modülü (placeholder)
│   │   └── index.js
│   └── staff/                     # Personel modülü (placeholder)
│       └── index.js
│
└── views/                         # Health modülü sayfaları
    ├── Dashboard/
    │   └── DashboardPage.jsx
    ├── Appointments/
    │   └── AppointmentsPage.jsx
    ├── Customers/
    │   └── CustomersPage.jsx
    └── Reminders/
        └── RemindersPage.jsx
```

### 📁 `src/apps/terra-ads/` - Marketing/Ads Modülü

```
terra-ads/
├── modules/
│   └── marketing/
│       ├── components/
│       │   └── MarketingStatCard.jsx
│       ├── hooks/
│       │   ├── useMarketingDashboard.js
│       │   ├── useMarketingCampaigns.js
│       │   └── useMarketingStore.js
│       ├── utils/
│       │   └── platformHelpers.js
│       └── index.js
│
└── views/
    └── marketing/
        ├── MarketingDashboard.jsx
        ├── MarketingCampaigns.jsx
        ├── MarketingCampaignDetail.jsx
        └── MarketingAttribution.jsx
```

### 📁 `src/assets/` - Statik Dosyalar

```
assets/
├── locales/                       # i18n çevirileri
│   ├── en/
│   │   └── translation.json
│   ├── tr/
│   │   └── translation.json
│   ├── terra-shared/
│   │   ├── en.json
│   │   └── tr.json
│   ├── terra-health/
│   │   ├── en.json
│   │   └── tr.json
│   └── terra-ads/
│       ├── en.json
│       └── tr.json
└── react.svg
```

## Path Aliases (vite.config.js)

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

## Mimari Prensipler

### 1. Modüler Yapı
- Her modül (`terra-shared`, `terra-health`, `terra-ads`) bağımsız çalışır
- Modüller arası iletişim sadece `index.js` üzerinden (Public API)

### 2. Katmanlar
- **Core**: Teknik altyapı (API, theme, i18n)
- **Common**: Paylaşılan UI bileşenleri ve hooks
- **Modules**: İş mantığı ve state yönetimi
- **Views**: Sayfa bileşenleri (sadece layout)

### 3. State Yönetimi
- **Zustand**: Global state (auth, settings, stores)
- **React Query**: Server state ve caching
- **Local State**: useState/useReducer (component-level)

### 4. Public API Kuralı
Her modülün `index.js` dosyası dışarıya açık API'sidir:
```javascript
// ✅ Doğru
import { useCustomers } from '@terra-health/modules/customers';

// ❌ Yanlış
import { useCustomers } from '@terra-health/modules/customers/hooks/useCustomers';
```

## Teknoloji Stack

- **Framework**: React 19 + Vite 6
- **UI Library**: Material-UI v6
- **State**: Zustand
- **Data Fetching**: TanStack React Query
- **Form**: React Hook Form + Zod
- **Routing**: React Router v7
- **i18n**: i18next
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
