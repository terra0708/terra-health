shared/components/ klasörü için ortak UI componentleri oluştur:

UI COMPONENTS (shared/components/ui/):
1. Button: Primary, secondary, outlined varyantları
2. Input: Text, email, phone, number tipleri
3. Modal: Dialog penceresi
4. Table: Sortable, filterable data table
5. Card: İçerik kartı
6. Dropdown: Select box
7. DatePicker: Tarih seçici (date-fns kullan)
8. Loader: Loading spinner
9. ErrorBoundary: Hata yakalama

LAYOUT COMPONENTS (shared/components/layout/):
1. Header: Logo, kullanıcı menüsü, bildirimler
2. Sidebar: Navigasyon menüsü (接katlanabilir)
3. Footer: Alt bilgi
4. MainLayout: Header + Sidebar + Content wrapper
5. DashboardLayout: Grid layout

FORM COMPONENTS (shared/components/forms/):
1. FormField: Input wrapper with label & error
2. FormSelect: Dropdown with validation
3. FormDatePicker: Date picker with validation
4. FormPhoneInput: Phone number input (country code ile)
5. FormCurrencyInput: Para birimi input

Her component için:
- CSS Modules kullan (.module.css)
- PropTypes ekle
- Loading ve error state'leri handle et
- Accessibility (a11y) kurallarına uy

Önce Button componentinden başla, örnek göster.