# 🏗️ Terra-Health CRM - Mimari Rehberi (Architecture README)

Bu dosya, projenin klasör yapısını ve kod yazarken uymamız gereken kuralları açıklar. Proje büyüdüğünde "Bu dosya nereye gitmeli?" sorusunun cevabı buradadır.

---

## 📂 Klasör Yapısı ve Mantığı

### 1. `src/core/` (Merkezi Sistem)
Uygulamanın "beyni" ve teknik altyapısıdır. 
- **`api.js`**: Axios ayarları ve Interceptor'lar (Token ekleme, 401 hatasında Login'e atma).
- **`theme.js`**: MUI renkleri, fontları ve global stil kuralları.
- **`router/`**: Navigasyon ve sayfa rotaları.

### 2. `src/modules/` (Dikey İş Modülleri)
Projenin en önemli kısmıdır. Her klasör kendi başına bir "mini uygulama" gibi çalışır.
- **Örnekler**: `customers`, `appointments`, `ads`, `finance`.
- **İçerik**: Modüle özel API çağrıları (hooks), Zod şemaları, alt-bileşenler.
- **Kural**: Modüller birbirinin içine gizli dosyalardan erişmez. Sadece `index.js` üzerinden veri alışverişi yaparlar.

### 3. `src/common/` (Tasarım Sistemi & Araçlar)
İş mantığı içermeyen, projenin her yerinde kullanılan yardımcılar.
- **`ui/`**: Kendi Butonumuz, Inputumuz, Kartımız (MUI'yi burada sarmalıyoruz).
- **`hooks/`**: `useDebounce`, `useAuth` gibi genel araçlar.
- **`utils/`**: Para birimi çevirme, tarih formatlama gibi yardımcı fonksiyonlar.

### 4. `src/views/` (Ekranlar / Sayfalar)
Modülleri ve UI bileşenlerini birleştirip kullanıcıya sunan "Layout" (Yerleşim) katmanıdır.
- İş mantığı burada yazılmaz; sadece bileşenler dizilir.

### 5. `src/actions/` (Karmaşık İş Akışları)
Birden fazla modülü aynı anda ilgilendiren senaryolar.
- **Örnek**: "Yeni Müşteri Kaydı yap + Aynı anda Randevu oluştur + Mail at".

### 6. `src/app/` (Root)
Uygulamanın en dış katmanı. React Query Provider, Theme Provider ve Global Context'lerin sarmalandığı yer.

---

## 📏 Altın Kurallar

1.  **Public API Kuralı**: Bir klasörün içinde ne olduğu önemli değildir; dışarıdaki bir dosya o klasörden bir şey alacaksa mutlaka o klasörün `index.js` dosyasından almalıdır.
    - ✅ `import { Button } from '@common/ui';`
    - ❌ `import Button from '@common/ui/Button/Button.jsx';`

2.  **Path Aliasing**: Asla `../../../../` gibi yollar kullanma. `@core`, `@modules`, `@common`, `@views` gibi takma adları kullan.

3.  **Müşteri Değil Hasta (Düzeltme: Müşteri)**: Projede her zaman **"Customer"** terimi kullanılır.

4.  **MUI Kullanımı**: Sayfaların içine doğrudan MUI bileşeni koymak yerine, önce onu `common/ui` altında özelleştirip oradan çağır.

---

## 🛠️ Teknoloji Yığınımız

- **Data Fetching**: `React Query` (Loading ve Error durumlarını otomatik yönetir).
- **State**: `Zustand` (Hafif ve hızlı global state).
- **Form**: `React Hook Form` + `Zod` (Performanslı formlar ve katı doğrulama kuralları).
- **UI**: `MUI` (Material UI).

---
*Not: Bu mimari projenin bir gün binlerce sayfa olabileceği öngörülerek tasarlanmıştır.*
