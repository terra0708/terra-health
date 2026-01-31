# Terra CRM - Yetki ve Kullanıcı Yönetimi Modülü Analiz Raporu

## 📊 Genel Durum Özeti

**Kritik Bulgu**: Frontend'deki PermissionsPage ve UsersPage **tamamen mock data** kullanıyor. Backend ile gerçek entegrasyon **yok**. Bu, sistemin en büyük mimari açığı.

---

## 1. Veri Yapısı Analizi

### Backend Durumu ✅
- **Parent-Child Hiyerarşisi**: `permissions` tablosunda `parent_permission_id` ile MODULE → ACTION ilişkisi kurulmuş
- **V23 Migration**: Tabula Rasa yaklaşımıyla tüm permission'lar yeniden oluşturuldu
- **PermissionService.getModulePermissions()**: Parent-child ilişkisini kullanarak ACTION permission'ları döndürüyor

### Frontend Durumu ❌
- **Mock Data Kullanımı**: `PERMISSION_MODULES` sabit mock data (mockData.js)
- **Hiyerarşi Yok**: UI'da parent-child ilişkisi kullanılmıyor, her şey düz liste
- **Backend Entegrasyonu Yok**: `/api/v1/tenant-admin/permissions` endpoint'i çağrılmıyor
- **Permission ID Uyumsuzluğu**: Mock data string ID kullanıyor (`'view_customers'`), backend UUID kullanıyor

**Kod Kanıtı**:
```javascript
// frontend/terra/src/apps/terra-shared/modules/permissions/data/mockData.js
export const PERMISSION_MODULES = [
    {
        id: 'customers',
        permissions: [
            { id: 'view_customers', name_tr: 'Görüntüleme', ... }
        ]
    }
];
```

**Sorun**: Backend'den gelen gerçek permission listesi (`List<String>` olarak `/api/v1/tenant-admin/permissions`) hiç kullanılmıyor.

---

## 2. Bundle (Paket) Mantığı Analizi

### Backend Güvenlik ✅
- **Tenant İzolasyonu**: `validatePermissionAssignment()` her permission için tenant module pool kontrolü yapıyor
- **createBundle()**: Tüm permission ID'leri için `validatePermissionAssignment()` çağırıyor
- **updateBundle()**: Aynı validasyon mekanizması kullanılıyor
- **Sızma İhtimali**: Backend seviyesinde **YOK** ✅

**Kod Kanıtı**:
```java
// PermissionService.createBundle()
for (UUID permissionId : permissionIds) {
    validatePermissionAssignment(tenantId, permissionId); // ✅ Tenant kontrolü
}
```

### Frontend Durumu ❌
- **Mock Store**: `usePermissionStore` tamamen mock data (localStorage'da persist ediliyor)
- **Backend API Çağrısı Yok**: Bundle oluşturma/güncelleme backend'e gitmiyor
- **Tenant Kontrolü Yok**: Frontend'de tenant izolasyonu kontrol edilmiyor
- **Permission ID Validasyonu Yok**: Mock string ID'ler backend UUID'lere map edilmiyor

**Kod Kanıtı**:
```javascript
// usePermissionStore.js
addPackage: (newPkg) => set((state) => ({
    packages: [...state.packages, { ...newPkg, id: Date.now(), permissions: [] }]
    // ❌ Backend API çağrısı yok
}))
```

**Kritik Sorun**: Tenant Admin, mock data üzerinden bundle oluşturuyor ama bu bundle'lar backend'e kaydedilmiyor. Sistem **çalışmıyor**.

---

## 3. Kullanıcı Atama Akışı Analizi

### Backend Durumu ✅
- **İki Yöntem Mevcut**:
  1. **Doğrudan Yetki**: `POST /api/v1/tenant-admin/users/{userId}/permissions` (Permission ID ile)
  2. **Bundle Tabanlı**: `POST /api/v1/tenant-admin/bundles/{bundleId}/assign/{userId}`

- **Her İkisi de Zorunlu Değil**: Sistem esnek, her iki yöntem de kullanılabilir
- **Tenant İzolasyonu**: Her iki endpoint'te de `validateUserActiveAndBelongsToTenant()` kontrolü var

### Frontend Durumu ❌
- **Mock User Management**: `UsersPage.jsx` tamamen mock data kullanıyor
- **Backend Entegrasyonu Yok**: Kullanıcı oluşturma/güncelleme backend'e gitmiyor
- **Yetki Atama UI Yok**: Kullanıcılara doğrudan veya bundle ile yetki atama arayüzü yok
- **API Endpoint'leri Kullanılmıyor**: `/api/v1/tenant-admin/users`, `/api/v1/tenant-admin/bundles` endpoint'leri hiç çağrılmıyor

**Kod Kanıtı**:
```javascript
// UsersPage.jsx
const handleSaveUser = (userData) => {
    if (editUser) {
        store.updateUser(editUser.id, finalData); // ❌ Mock store
    } else {
        store.addUser(finalData); // ❌ Mock store
    }
};
```

**Kritik Sorun**: Kullanıcı yönetimi ve yetki atama işlemleri **tamamen mock**, gerçek sistemle bağlantısı yok.

---

## 4. Zayıf Noktalar ve UX/Mimari Açıklar

### 🔴 Kritik Açıklar

#### 4.1 Frontend-Backend Bağlantısı Yok
- **Sorun**: PermissionsPage ve UsersPage tamamen mock data kullanıyor
- **Risk**: Tenant Admin'in yaptığı tüm işlemler kayboluyor, backend'e gitmiyor
- **Etki**: Sistem **çalışmıyor**, sadece UI mockup'ı var

#### 4.2 Parent-Child Hiyerarşisi UI'da Yok
- **Sorun**: Backend'de MODULE → ACTION hiyerarşisi var ama UI düz liste gösteriyor
- **Risk**: Kullanıcı hangi permission'ın hangi modüle ait olduğunu göremiyor
- **Etki**: UX kötü, kullanıcı kafası karışıyor

#### 4.3 Tenant İzolasyonu Frontend'de Kontrol Edilmiyor
- **Sorun**: Frontend mock data kullanıyor, tenant kontrolü yok
- **Risk**: Eğer backend entegrasyonu yapılırsa ve frontend kontrol eksikse, tenant sızması mümkün
- **Etki**: Güvenlik açığı riski

#### 4.4 Permission ID Format Uyumsuzluğu
- **Sorun**: Mock data string ID (`'view_customers'`), backend UUID kullanıyor
- **Risk**: Backend entegrasyonu yapılırken mapping sorunları çıkacak
- **Etki**: Refactoring zorluğu

#### 4.5 Bundle Oluştururken Available Permissions Kontrolü Yok
- **Sorun**: Frontend mock data kullanıyor, backend'den `/api/v1/tenant-admin/permissions` çekilmiyor
- **Risk**: Tenant Admin, tenant'ına ait olmayan permission'ları görebilir (mock data'da)
- **Etki**: Güvenlik açığı (mock data kullanıldığı için şu an aktif değil ama entegrasyon sonrası risk)

#### 4.6 Kullanıcıya Doğrudan Yetki Atama UI Yok
- **Sorun**: UsersPage'de kullanıcıya yetki atama arayüzü yok
- **Risk**: Tenant Admin kullanıcılara yetki atayamıyor
- **Etki**: Sistem işlevsiz

#### 4.7 Bundle-User İlişkisi UI'da Yok
- **Sorun**: Kullanıcılara bundle atama arayüzü yok
- **Risk**: RBAC akışı kullanılamıyor
- **Etki**: Sistem işlevsiz

#### 4.8 Empty State ve Hata Yönetimi Yok
- **Sorun**: Permission listesi boşsa veya API hata verirse kullanıcıya bilgi verilmiyor
- **Risk**: Kullanıcı sistemin bozulduğunu sanabilir
- **Etki**: Kötü UX

---

## 5. "Aptal Korumalı" (Foolproof) İyileştirme Önerileri

### 🛡️ Acil Öncelikli (Kritik)

#### 5.1 Backend Entegrasyonu
- [ ] PermissionsPage'i backend API'lerine bağla (`/api/v1/tenant-admin/permissions`, `/api/v1/tenant-admin/bundles`)
- [ ] UsersPage'i backend API'lerine bağla (`/api/v1/tenant-admin/users`)
- [ ] Mock store'u kaldır, gerçek API çağrıları yap
- [ ] Permission ID formatını UUID'ye çevir

#### 5.2 Parent-Child Hiyerarşisi UI'da Göster
- [ ] Backend'den permission'ları MODULE bazında grupla
- [ ] Accordion/Collapse yapısı ile MODULE → ACTION hiyerarşisini göster
- [ ] Her permission'ın hangi modüle ait olduğunu görsel olarak belirt

#### 5.3 Tenant İzolasyonu Frontend'de Kontrol Et
- [ ] Bundle oluştururken sadece `/api/v1/tenant-admin/permissions` endpoint'inden gelen permission'ları göster
- [ ] Kullanıcı seçerken sadece tenant'ına ait kullanıcıları listele
- [ ] API hatalarında (403) kullanıcıyı `/forbidden` sayfasına yönlendir

### ⚠️ Yüksek Öncelikli

#### 5.4 Kullanıcı Yetki Atama UI
- [ ] UsersPage'de kullanıcı detayında "Yetkiler" sekmesi ekle
- [ ] Doğrudan yetki atama: Checkbox listesi ile permission seçimi
- [ ] Bundle tabanlı atama: Dropdown ile bundle seçimi
- [ ] Mevcut yetkileri göster (MODULE ve ACTION bazında)

#### 5.5 Bundle-User İlişkisi UI
- [ ] UsersPage'de kullanıcıya bundle atama butonu
- [ ] Bundle detayında "Bu bundle'a sahip kullanıcılar" listesi
- [ ] Bundle'dan kullanıcı çıkarma işlemi

#### 5.6 Validation ve Hata Yönetimi
- [ ] Bundle oluştururken boş permission listesi kontrolü
- [ ] Kullanıcıya yetki atarken tenant kontrolü
- [ ] API hatalarında kullanıcı dostu mesajlar
- [ ] Loading state'leri ve skeleton loader'lar

### 📋 Orta Öncelikli

#### 5.7 UX İyileştirmeleri
- [ ] Permission arama/filtreleme (modül bazında)
- [ ] Bulk operations (çoklu permission atama)
- [ ] Permission açıklamalarını tooltip ile göster
- [ ] Empty state'ler (permission yoksa, bundle yoksa)

#### 5.8 Güvenlik İyileştirmeleri
- [ ] Super Admin permission'larını UI'da gizle (tenant admin görmemeli)
- [ ] MODULE permission'larını bundle'a ekleme seçeneğini kaldır (sadece ACTION)
- [ ] Silme işlemlerinde onay dialog'u (cascade etkileri göster)

---

## 6. Mimari Öneriler

### 6.1 Veri Akışı Önerisi

```
Backend API → Frontend Store → UI Components
     ↓              ↓                ↓
/tenant-admin/  Zustand Store   PermissionsPage
/permissions    (Real API)       UsersPage
/bundles
/users
```

**Mevcut Durum**: Mock Data → Mock Store → UI Components ❌

### 6.2 Permission Hiyerarşisi UI Tasarımı

```
MODULE_MARKETING (Accordion Header)
  ├─ MARKETING_DASHBOARD (Checkbox)
  ├─ MARKETING_CAMPAIGNS (Checkbox)
  └─ MARKETING_ATTRIBUTION (Checkbox)

MODULE_SETTINGS (Accordion Header)
  ├─ SETTINGS_USERS (Checkbox)
  ├─ SETTINGS_PERMISSIONS (Checkbox)
  └─ SETTINGS_SYSTEM (Checkbox)
```

### 6.3 Bundle Oluşturma Akışı

1. Kullanıcı "Yeni Bundle" butonuna tıklar
2. Backend'den `/api/v1/tenant-admin/permissions` çekilir (MODULE bazında gruplanmış)
3. Accordion yapısında permission'lar gösterilir
4. Kullanıcı permission'ları seçer
5. "Kaydet" butonuna tıklanır
6. `POST /api/v1/tenant-admin/bundles` çağrılır
7. Başarılı olursa bundle listesi güncellenir

---

## 7. Sonuç ve Öncelikler

### 🔴 Kritik Durum
**Frontend'deki PermissionsPage ve UsersPage tamamen mock data kullanıyor. Backend entegrasyonu yok. Sistem çalışmıyor.**

### Öncelik Sırası
1. **Acil**: Backend entegrasyonu (PermissionsPage, UsersPage)
2. **Acil**: Parent-child hiyerarşisi UI'da göster
3. **Yüksek**: Kullanıcı yetki atama UI
4. **Yüksek**: Bundle-user ilişkisi UI
5. **Orta**: UX iyileştirmeleri ve validation

### Tahmini İş Yükü
- Backend entegrasyonu: 2-3 gün
- UI hiyerarşisi: 1 gün
- Kullanıcı yetki atama UI: 2 gün
- Bundle-user ilişkisi: 1 gün
- UX iyileştirmeleri: 1-2 gün

**Toplam**: ~7-9 gün

---

## 8. Teknik Detaylar

### Backend Endpoint'leri (Mevcut ve Hazır)
- `GET /api/v1/tenant-admin/permissions` → `List<String>` (permission names)
- `GET /api/v1/tenant-admin/bundles` → `List<PermissionBundle>`
- `POST /api/v1/tenant-admin/bundles` → Create bundle
- `PUT /api/v1/tenant-admin/bundles/{bundleId}` → Update bundle
- `DELETE /api/v1/tenant-admin/bundles/{bundleId}` → Delete bundle
- `POST /api/v1/tenant-admin/bundles/{bundleId}/assign/{userId}` → Assign bundle to user
- `GET /api/v1/tenant-admin/users` → List tenant users
- `POST /api/v1/tenant-admin/users/{userId}/permissions` → Assign permission to user

### Frontend Store Yapısı (Önerilen)
```javascript
const usePermissionStore = create((set, get) => ({
    // State
    permissions: [], // Backend'den çekilen permission listesi (MODULE bazında gruplanmış)
    bundles: [], // Backend'den çekilen bundle listesi
    loading: false,
    error: null,
    
    // Actions
    fetchPermissions: async () => { /* API çağrısı */ },
    fetchBundles: async () => { /* API çağrısı */ },
    createBundle: async (data) => { /* API çağrısı */ },
    // ...
}));
```

---

**Rapor Tarihi**: 2026-01-28
**Analiz Eden**: Cursor AI Assistant
**Durum**: 🔴 Kritik - Acil Müdahale Gerekli
