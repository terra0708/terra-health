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

export const useCustomerSettingsStore = create(
    persist(
        (set, get) => ({
            services: INITIAL_SERVICES,
            statuses: INITIAL_STATUSES,
            sources: INITIAL_SOURCES,
            tags: INITIAL_TAGS,

            // Migration helper to fix old data format in localStorage
            repairData: () => {
                const state = get();
                let needsUpdate = false;

                const repairArray = (arr, nameKey) => {
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

                const newServices = repairArray(state.services, 'name');
                const newStatuses = repairArray(state.statuses, 'label');
                const newSources = repairArray(state.sources, 'label');
                const newTags = repairArray(state.tags, 'label');

                if (needsUpdate) {
                    set({
                        services: newServices,
                        statuses: newStatuses,
                        sources: newSources,
                        tags: newTags,
                    });
                }
            },

            addService: (service) => set((state) => ({
                services: [...state.services, { ...service, id: Date.now().toString() }]
            })),
            updateService: (id, updatedService) => set((state) => ({
                services: state.services.map(s => s.id === id ? { ...s, ...updatedService } : s)
            })),
            deleteService: (id) => set((state) => ({
                services: state.services.filter(s => s.id !== id)
            })),

            addStatus: (status) => set((state) => ({
                statuses: [...state.statuses, { ...status, id: Date.now().toString() }]
            })),
            updateStatus: (id, updatedStatus) => set((state) => ({
                statuses: state.statuses.map(s => s.id === id ? { ...s, ...updatedStatus } : s)
            })),
            deleteStatus: (id) => set((state) => ({
                statuses: state.statuses.filter(s => s.id !== id)
            })),

            addSource: (source) => set((state) => ({
                sources: [...state.sources, { ...source, id: Date.now().toString() }]
            })),
            updateSource: (id, updatedSource) => set((state) => ({
                sources: state.sources.map(s => s.id === id ? { ...s, ...updatedSource } : s)
            })),
            deleteSource: (id) => set((state) => ({
                sources: state.sources.filter(s => s.id !== id)
            })),

            addTag: (tag) => set((state) => ({
                tags: [...state.tags, { ...tag, id: Date.now().toString() }]
            })),
            updateTag: (id, updatedTag) => set((state) => ({
                tags: state.tags.map(t => t.id === id ? { ...t, ...updatedTag } : t)
            })),
            deleteTag: (id) => set((state) => ({
                tags: state.tags.filter(t => t.id !== id)
            })),
        }),
        {
            name: 'customer-settings-storage',
            version: 1,
        }
    )
);
