import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INITIAL_SERVICES = [
    { id: '1', name_tr: 'Saç Ekimi', name_en: 'Hair Transplant', value: 'sac_ekimi', category: 'Estetik', color: '#a259ff' },
    { id: '2', name_tr: 'Diş Tedavisi', name_en: 'Dental Treatment', value: 'dis_tedavisi', category: 'Diş', color: '#3b82f6' },
    { id: '3', name_tr: 'Rinoplasti', name_en: 'Rhinoplasty', value: 'rinoplasti', category: 'Estetik', color: '#10b981' },
    { id: '4', name_tr: 'Liposuction', name_en: 'Liposuction', value: 'liposuction', category: 'Estetik', color: '#f472b6' },
    { id: '5', name_tr: 'Diş Beyazlatma', name_en: 'Teeth Whitening', value: 'dis_beyazlatma', category: 'Diş', color: '#06b6d4' },
    { id: '6', name_tr: 'Gülüş Tasarımı', name_en: 'Smile Design', value: 'gulus_tasarimi', category: 'Diş', color: '#f59e0b' },
    { id: '7', name_tr: 'Estetik Cerrahi', name_en: 'Plastic Surgery', value: 'estetik_cerrahi', category: 'Estetik', color: '#ec4899' },
    { id: '8', name_tr: 'Burun Estetiği', name_en: 'Nose Job', value: 'burun_estetigi', category: 'Estetik', color: '#8b5cf6' },
];

const INITIAL_STATUSES = [
    { id: '1', label_tr: 'Yeni', label_en: 'New', value: 'new', color: '#3b82f6' },
    { id: '2', label_tr: 'İşlemde', label_en: 'In Process', value: 'process', color: '#f59e0b' },
    { id: '3', label_tr: 'İletişime Geçildi', label_en: 'Contacted', value: 'contacted', color: '#8b5cf6' },
    { id: '4', label_tr: 'Randevu', label_en: 'Appointment', value: 'appointment', color: '#10b981' },
    { id: '5', label_tr: 'Operasyon Sonrası', label_en: 'Post Op', value: 'post_op', color: '#6366f1' },
    { id: '6', label_tr: 'Kaybedildi', label_en: 'Lost', value: 'lost', color: '#ef4444' },
    { id: '7', label_tr: 'Satış', label_en: 'Sale', value: 'sale', color: '#10b981' },
];

const INITIAL_SOURCES = [
    { id: '1', label_tr: 'Manuel Eklendi', label_en: 'Added Manually', value: 'manual', color: '#6b7280' },
    { id: '2', label_tr: 'Google Ads', label_en: 'Google Ads', value: 'google_ads', color: '#3b82f6' },
    { id: '3', label_tr: 'Facebook Ads', label_en: 'Facebook Ads', value: 'facebook_ads', color: '#10b981' },
    { id: '4', label_tr: 'Instagram Ads', label_en: 'Instagram Ads', value: 'instagram_ads', color: '#ec4899' },
    { id: '5', label_tr: 'Tavsiye', label_en: 'Referral', value: 'referral', color: '#8b5cf6' },
];

const INITIAL_TAGS = [
    { id: '1', label_tr: 'VIP', label_en: 'VIP', value: 'vip', color: '#8b5cf6' },
    { id: '2', label_tr: 'Öncelikli', label_en: 'Priority', value: 'oncelikli', color: '#ef4444' },
    { id: '3', label_tr: 'İngilizce', label_en: 'English', value: 'ingilizce', color: '#3b82f6' },
    { id: '4', label_tr: 'Arapça', label_en: 'Arabic', value: 'arapca', color: '#10b981' },
    { id: '5', label_tr: 'Rusça', label_en: 'Russian', value: 'rusca', color: '#f43f5e' },
    { id: '6', label_tr: 'Almanca', label_en: 'German', value: 'almanca', color: '#f59e0b' },
];

const INITIAL_FILE_CATEGORIES = [
    { id: '1', label_tr: 'Kimlik Belgeleri', label_en: 'Identity Documents', color: '#312e81' },
    { id: '2', label_tr: 'Tıbbi Raporlar', label_en: 'Medical Reports', color: '#ef4444' },
    { id: '3', label_tr: 'Ödeme Makbuzları', label_en: 'Payment Receipts', color: '#10b981' },
    { id: '4', label_tr: 'Fotoğraflar', label_en: 'Photos', color: '#f59e0b' },
    { id: '5', label_tr: 'Uçuş ve Konaklama', label_en: 'Flight & Stay', color: '#6366f1' },
    { id: '6', label_tr: 'Diğer', label_en: 'Other', color: '#64748b' },
];

const INITIAL_CATEGORIES = [
    { id: 'system', label_tr: 'Sistem', label_en: 'System', color: '#6366f1' },
    { id: '1', label_tr: 'Estetik', label_en: 'Aesthetics', color: '#a259ff' },
    { id: '2', label_tr: 'Obezite', label_en: 'Obesity', color: '#3b82f6' },
    { id: '3', label_tr: 'Diş', label_en: 'Dental', color: '#10b981' },
    { id: '4', label_tr: 'Göz', label_en: 'Eye', color: '#f472b6' },
];

export const useCustomerSettingsStore = create(
    persist(
        (set, get) => ({
            services: INITIAL_SERVICES,
            statuses: INITIAL_STATUSES,
            sources: INITIAL_SOURCES,
            tags: INITIAL_TAGS,
            fileCategories: INITIAL_FILE_CATEGORIES,
            categories: INITIAL_CATEGORIES,

            addService: (service) => set((state) => ({ services: [...state.services, { ...service, id: Date.now().toString() }] })),
            updateService: (id, updated) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, ...updated } : s) })),
            deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),

            addStatus: (status) => set((state) => ({ statuses: [...state.statuses, { ...status, id: Date.now().toString() }] })),
            updateStatus: (id, updated) => set((state) => ({ statuses: state.statuses.map(s => s.id === id ? { ...s, ...updated } : s) })),
            deleteStatus: (id) => set((state) => ({ statuses: state.statuses.filter(s => s.id !== id) })),

            addSource: (source) => set((state) => ({ sources: [...state.sources, { ...source, id: Date.now().toString() }] })),
            updateSource: (id, updated) => set((state) => ({ sources: state.sources.map(s => s.id === id ? { ...s, ...updated } : s) })),
            deleteSource: (id) => set((state) => ({ sources: state.sources.filter(s => s.id !== id) })),

            addTag: (tag) => set((state) => ({ tags: [...state.tags, { ...tag, id: Date.now().toString() }] })),
            updateTag: (id, updated) => set((state) => ({ tags: state.tags.map(t => t.id === id ? { ...t, ...updated } : t) })),
            deleteTag: (id) => set((state) => ({ tags: state.tags.filter(t => t.id !== id) })),

            addFileCategory: (cat) => set((state) => ({ fileCategories: [...state.fileCategories, { ...cat, id: Date.now().toString() }] })),
            updateFileCategory: (id, updated) => set((state) => ({ fileCategories: state.fileCategories.map(c => c.id === id ? { ...c, ...updated } : c) })),
            deleteFileCategory: (id) => set((state) => ({ fileCategories: state.fileCategories.filter(c => c.id !== id) })),

            addCategory: (cat) => set((state) => ({ categories: [...state.categories, { ...cat, id: Date.now().toString() }] })),
            updateCategory: (id, updated) => set((state) => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...updated } : c) })),
            deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id && c.id !== 'system') })),
        }),
        {
            name: 'customer-settings-storage-v1',
            version: 1
        }
    )
);
