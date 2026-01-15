import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INITIAL_SERVICES = [
    { id: '1', name_tr: 'Saç Ekimi', name_en: 'Hair Transplant', category: 'Estetik', color: '#a259ff' },
    { id: '2', name_tr: 'Diş Tedavisi', name_en: 'Dental Treatment', category: 'Diş', color: '#3b82f6' },
    { id: '3', name_tr: 'Rinoplasti', name_en: 'Rhinoplasty', category: 'Estetik', color: '#10b981' },
    { id: '4', name_tr: 'Liposuction', name_en: 'Liposuction', category: 'Estetik', color: '#f472b6' },
];

const INITIAL_STATUSES = [
    { id: '1', label_tr: 'Aktif', label_en: 'Active', value: 'active', color: '#10b981' },
    { id: '2', label_tr: 'Beklemede', label_en: 'Pending', value: 'pending', color: '#f59e0b' },
    { id: '3', label_tr: 'Tamamlandı', label_en: 'Completed', value: 'completed', color: '#3b82f6' },
    { id: '4', label_tr: 'İptal', label_en: 'Cancelled', value: 'cancelled', color: '#ef4444' },
];

const INITIAL_SOURCES = [
    { id: '1', label_tr: 'Manuel Eklendi', label_en: 'Added Manually', value: 'manual', color: '#6b7280' },
    { id: '2', label_tr: 'Google Ads', label_en: 'Google Ads', value: 'google_ads', color: '#3b82f6' },
    { id: '3', label_tr: 'Facebook Ads', label_en: 'Facebook Ads', value: 'facebook_ads', color: '#10b981' },
    { id: '4', label_tr: 'Instagram Ads', label_en: 'Instagram Ads', value: 'instagram_ads', color: '#ec4899' },
    { id: '5', label_tr: 'Tavsiye', label_en: 'Referral', value: 'referral', color: '#8b5cf6' },
];

const INITIAL_TAGS = [
    { id: '1', label_tr: 'VIP', label_en: 'VIP', color: '#8b5cf6' },
    { id: '2', label_tr: 'Tekrar Eden Müşteri', label_en: 'Returning Customer', color: '#ec4899' },
    { id: '3', label_tr: 'Sıkıntılı Kayıt', label_en: 'Problematic Record', color: '#f97316' },
    { id: '4', label_tr: 'Eski Müşteri', label_en: 'Old Customer', color: '#6b7280' },
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

            repairData: () => {
                const state = get();
                let needsUpdate = false;

                const repairArray = (currentArr, initialArr, nameKey) => {
                    let arr = currentArr || initialArr;

                    // Eksik olanları ekle (ID üzerinden kontrol)
                    const existingIds = new Set(arr.map(i => i.id));
                    const missingItems = initialArr.filter(i => !existingIds.has(i.id));
                    if (missingItems.length > 0) {
                        needsUpdate = true;
                        arr = [...arr, ...missingItems];
                    }

                    return arr.map(item => {
                        const trKey = `${nameKey}_tr`;
                        const enKey = `${nameKey}_en`;
                        if (!item[trKey] && item[nameKey]) {
                            needsUpdate = true;
                            return { ...item, [trKey]: item[nameKey], [enKey]: item[nameKey] };
                        }
                        return item;
                    });
                };

                const newServices = repairArray(state.services, INITIAL_SERVICES, 'name');
                const newStatuses = repairArray(state.statuses, INITIAL_STATUSES, 'label');
                const newSources = repairArray(state.sources, INITIAL_SOURCES, 'label');
                const newTags = repairArray(state.tags, INITIAL_TAGS, 'label');
                const newFileCategories = repairArray(state.fileCategories, INITIAL_FILE_CATEGORIES, 'label');
                const newCategories = repairArray(state.categories, INITIAL_CATEGORIES, 'label');

                if (needsUpdate) {
                    set({
                        services: newServices,
                        statuses: newStatuses,
                        sources: newSources,
                        tags: newTags,
                        fileCategories: newFileCategories,
                        categories: newCategories
                    });
                }
            },

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
            deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),
        }),
        {
            name: 'customer-settings-storage',
            version: 2,
            migrate: (persistedState, version) => {
                return persistedState;
            },
        }
    )
);
