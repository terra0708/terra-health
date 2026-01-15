import { Users, Calendar, HeartPulse, Settings } from 'lucide-react';

export const PERMISSION_MODULES = [
    {
        id: 'customers',
        name_tr: 'Müşteriler',
        name_en: 'Customers',
        icon: Users,
        permissions: [
            { id: 'view_customers', name_tr: 'Görüntüleme', name_en: 'Viewing', description_tr: 'Müşteri listesini görebilir.', description_en: 'Can see the customer list.' },
            { id: 'create_customers', name_tr: 'Ekleme', name_en: 'Creation', description_tr: 'Yeni müşteri kaydı açabilir.', description_en: 'Can open a new customer record.' },
            { id: 'edit_customers', name_tr: 'Düzenleme', name_en: 'Editing', description_tr: 'Mevcut müşteri bilgilerini değiştirebilir.', description_en: 'Can change existing customer info.' },
            { id: 'delete_customers', name_tr: 'Silme', name_en: 'Deletion', description_tr: 'Müşteri kaydını silebilir.', description_en: 'Can delete a customer record.' }
        ]
    },
    {
        id: 'appointments',
        name_tr: 'Randevular',
        name_en: 'Appointments',
        icon: Calendar,
        permissions: [
            { id: 'view_appointments', name_tr: 'Görüntüleme', name_en: 'Viewing', description_tr: 'Takvimi görebilir.', description_en: 'Can see the calendar.' },
            { id: 'create_appointments', name_tr: 'Oluşturma', name_en: 'Creation', description_tr: 'Yeni randevu ekleyebilir.', description_en: 'Can add a new appointment.' },
            { id: 'edit_appointments', name_tr: 'Düzenleme', name_en: 'Editing', description_tr: 'Randevu bilgilerini güncelleyebilir.', description_en: 'Can update appointment info.' },
            { id: 'cancel_appointments', name_tr: 'İptal Etme', name_en: 'Cancellation', description_tr: 'Randevuları iptal edebilir.', description_en: 'Can cancel appointments.' }
        ]
    },
    {
        id: 'analysis',
        name_tr: 'Analizler',
        name_en: 'Analysis',
        icon: HeartPulse,
        permissions: [
            { id: 'view_analysis', name_tr: 'Görüntüleme', name_en: 'Viewing', description_tr: 'Laboratuvar sonuçlarını görebilir.', description_en: 'Can see lab results.' },
            { id: 'create_analysis', name_tr: 'Ekleme', name_en: 'Creation', description_tr: 'Analiz sonucu girebilir.', description_en: 'Can enter analysis results.' },
            { id: 'approve_analysis', name_tr: 'Onaylama', name_en: 'Approving', description_tr: 'Analiz sonuçlarını onaylayabilir.', description_en: 'Can approve analysis results.' }
        ]
    },
    {
        id: 'settings',
        name_tr: 'Ayarlar',
        name_en: 'Settings',
        icon: Settings,
        permissions: [
            { id: 'view_settings', name_tr: 'Görüntüleme', name_en: 'Viewing', description_tr: 'Sistem ayarlarını görebilir.', description_en: 'Can see system settings.' },
            { id: 'edit_settings', name_tr: 'Düzenleme', name_en: 'Editing', description_tr: 'Sistem genel ayarlarını değiştirebilir.', description_en: 'Can change system general settings.' },
            { id: 'manage_users', name_tr: 'Kullanıcı Yönetimi', name_en: 'User Management', description_tr: 'Yetkileri ve kullanıcıları yönetebilir.', description_en: 'Can manage permissions and users.' }
        ]
    }
];

export const MOCK_PACKAGES = [
    { id: 1, name_tr: 'Tam Yetkili (Admin)', name_en: 'Full Access (Admin)', permissions: ['view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments', 'view_analysis', 'create_analysis', 'approve_analysis', 'view_settings', 'edit_settings', 'manage_users'], color: '#ef4444' },
    { id: 2, name_tr: 'Doktor Paketi', name_en: 'Doctor Package', permissions: ['view_customers', 'view_appointments', 'edit_appointments', 'view_analysis', 'create_analysis', 'approve_analysis'], color: '#8b5cf6' },
    { id: 3, name_tr: 'Resepsiyon Paketi', name_en: 'Reception Package', permissions: ['view_customers', 'create_customers', 'view_appointments', 'create_appointments', 'cancel_appointments'], color: '#3b82f6' },
    { id: 4, name_tr: 'Personel Paketi', name_en: 'Staff Package', permissions: ['view_customers', 'view_appointments'], color: '#10b981' },
    { id: 5, name_tr: 'Danışman Paketi', name_en: 'Consultant Package', permissions: ['view_customers', 'create_customers', 'edit_customers'], color: '#f59e0b' },
];

export const MOCK_ROLES = [
    { id: 1, name_tr: 'Başhekim', name_en: 'Chief Physician', description_tr: 'Kurumun en yetkili tıbbi personeli.', description_en: 'The most authorized medical personnel of the institution.', packages: [1, 2], color: '#6366f1' },
    { id: 2, name_tr: 'Uzman Doktor', name_en: 'Specialist Doctor', description_tr: 'Hasta takibi ve analiz yetkisine sahip doktorlar.', description_en: 'Doctors with patient follow-up and analysis authority.', packages: [2], color: '#a855f7' },
    { id: 3, name_tr: 'Hasta Kabul', name_en: 'Receptionist', description_tr: 'Resepsiyon ve randevu süreçlerini yöneten personel.', description_en: 'Personnel managing reception and appointment processes.', packages: [3], color: '#0ea5e9' },
    { id: 4, name_tr: 'Danışman', name_en: 'Consultant', description_tr: 'Müşterilerle ilgilenen ve satış süreçlerini yöneten personel.', description_en: 'Personnel dealing with customers and managing sales processes.', packages: [5], color: '#f59e0b' },
];

export const COLORS = ['#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];
