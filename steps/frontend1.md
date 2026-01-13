Sağlık turizmi CRM için React projesi oluştur. Aşağıdaki gereksinimleri karşıla. uygulamanın adı terra-health:

TEMEL SETUP:
- Create React App ile başlat
- JavaScript kullan (TypeScript değil)
- Path aliasing için jsconfig.json ekle (@features, @shared, @config)
- ESLint ve Prettier konfigürasyonu

KLASÖR YAPISI:
src/
├── app/ (Ana uygulama konfigürasyonu)
├── features/ (Domain modülleri)
├── shared/ (Ortak componentler)
├── config/ (Konfigürasyon dosyaları)
└── assets/ (Statik dosyalar)

DEPENDENCIES:
- react-router-dom: Routing
- @reduxjs/toolkit ve react-redux: State management
- @mui/material: UI framework
- axios: HTTP client
- react-hook-form: Form yönetimi
- i18next ve react-i18next: Çoklu dil (TR/EN)
- socket.io-client: Real-time messaging
- date-fns: Tarih işlemleri
- recharts: Grafikler

Tüm package.json'ı oluştur ve temel klasör yapısını kur.