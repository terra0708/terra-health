import { Users, Calendar, HeartPulse, Settings } from 'lucide-react';

export const PERMISSION_MODULES = [
    {
        id: 'customers',
        name: 'Müşteriler',
        icon: Users,
        permissions: [
            { id: 'view_customers', name: 'Görüntüleme', description: 'Müşteri listesini görebilir.' },
            { id: 'create_customers', name: 'Ekleme', description: 'Yeni müşteri kaydı açabilir.' },
            { id: 'edit_customers', name: 'Düzenleme', description: 'Mevcut müşteri bilgilerini değiştirebilir.' },
            { id: 'delete_customers', name: 'Silme', description: 'Müşteri kaydını silebilir.' }
        ]
    },
    {
        id: 'appointments',
        name: 'Randevular',
        icon: Calendar,
        permissions: [
            { id: 'view_appointments', name: 'Görüntüleme', description: 'Takvimi görebilir.' },
            { id: 'create_appointments', name: 'Oluşturma', description: 'Yeni randevu ekleyebilir.' },
            { id: 'edit_appointments', name: 'Düzenleme', description: 'Randevu bilgilerini güncelleyebilir.' },
            { id: 'cancel_appointments', name: 'İptal Etme', description: 'Randevuları iptal edebilir.' }
        ]
    },
    {
        id: 'analysis',
        name: 'Analizler',
        icon: HeartPulse,
        permissions: [
            { id: 'view_analysis', name: 'Görüntüleme', description: 'Laboratuvar sonuçlarını görebilir.' },
            { id: 'create_analysis', name: 'Ekleme', description: 'Analiz sonucu girebilir.' },
            { id: 'approve_analysis', name: 'Onaylama', description: 'Analiz sonuçlarını onaylayabilir.' }
        ]
    },
    {
        id: 'settings',
        name: 'Ayarlar',
        icon: Settings,
        permissions: [
            { id: 'view_settings', name: 'Görüntüleme', description: 'Sistem ayarlarını görebilir.' },
            { id: 'edit_settings', name: 'Düzenleme', description: 'Sistem genel ayarlarını değiştirebilir.' },
            { id: 'manage_users', name: 'Kullanıcı Yönetimi', description: 'Yetkileri ve kullanıcıları yönetebilir.' }
        ]
    }
];

export const MOCK_PACKAGES = [
    { id: 1, name: 'Tam Yetkili (Admin)', permissions: ['view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments', 'view_analysis', 'create_analysis', 'approve_analysis', 'view_settings', 'edit_settings', 'manage_users'], color: '#ef4444' },
    { id: 2, name: 'Doktor Paketi', permissions: ['view_customers', 'view_appointments', 'edit_appointments', 'view_analysis', 'create_analysis', 'approve_analysis'], color: '#8b5cf6' },
    { id: 3, name: 'Resepsiyon Paketi', permissions: ['view_customers', 'create_customers', 'view_appointments', 'create_appointments', 'cancel_appointments'], color: '#3b82f6' },
    { id: 4, name: 'Personel Paketi', permissions: ['view_customers', 'view_appointments'], color: '#10b981' },
    { id: 5, name: 'Danışman Paketi', permissions: ['view_customers', 'create_customers', 'edit_customers'], color: '#f59e0b' },
];

export const MOCK_ROLES = [
    { id: 1, name: 'Başhekim', description: 'Kurumun en yetkili tıbbi personeli.', packages: [1, 2], color: '#6366f1' },
    { id: 2, name: 'Uzman Doktor', description: 'Hasta takibi ve analiz yetkisine sahip doktorlar.', packages: [2], color: '#a855f7' },
    { id: 3, name: 'Hasta Kabul', description: 'Resepsiyon ve randevu süreçlerini yöneten personel.', packages: [3], color: '#0ea5e9' },
    { id: 4, name: 'Danışman', description: 'Müşterilerle ilgilenen ve satış süreçlerini yöneten personel.', packages: [5], color: '#f59e0b' },
];

export const COLORS = ['#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];
