import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCustomerSettingsStore = create(
    persist(
        (set) => ({
            // 1. Hizmet Yönetimi
            services: [
                { id: '1', name: 'Saç Ekimi', category: 'Estetik' },
                { id: '2', name: 'Diş Tedavisi', category: 'Diş' },
                { id: '3', name: 'Rinoplasti', category: 'Estetik' },
                { id: '4', name: 'Liposuction', category: 'Estetik' },
            ],
            addService: (service) => set((state) => ({
                services: [...state.services, { ...service, id: Date.now().toString() }]
            })),
            updateService: (id, updatedService) => set((state) => ({
                services: state.services.map(s => s.id === id ? { ...s, ...updatedService } : s)
            })),
            deleteService: (id) => set((state) => ({
                services: state.services.filter(s => s.id !== id)
            })),

            // 2. Durum (Status) Yönetimi
            statuses: [
                { id: '1', label: 'Aktif', value: 'active', color: '#10b981' },
                { id: '2', label: 'Beklemede', value: 'pending', color: '#f59e0b' },
                { id: '3', label: 'Tamamlandı', value: 'completed', color: '#3b82f6' },
                { id: '4', label: 'İptal', value: 'cancelled', color: '#ef4444' },
            ],
            addStatus: (status) => set((state) => ({
                statuses: [...state.statuses, { ...status, id: Date.now().toString() }]
            })),
            updateStatus: (id, updatedStatus) => set((state) => ({
                statuses: state.statuses.map(s => s.id === id ? { ...s, ...updatedStatus } : s)
            })),
            deleteStatus: (id) => set((state) => ({
                statuses: state.statuses.filter(s => s.id !== id)
            })),

            // 3. Kaynak Yönetimi
            sources: [
                { id: '1', label: 'Manuel Eklendi', value: 'manual' },
                { id: '2', label: 'Google Ads', value: 'google_ads' },
                { id: '3', label: 'Facebook Ads', value: 'facebook_ads' },
                { id: '4', label: 'Instagram Ads', value: 'instagram_ads' },
                { id: '5', label: 'Tavsiye', value: 'referral' },
            ],
            addSource: (source) => set((state) => ({
                sources: [...state.sources, { ...source, id: Date.now().toString() }]
            })),
            updateSource: (id, updatedSource) => set((state) => ({
                sources: state.sources.map(s => s.id === id ? { ...s, ...updatedSource } : s)
            })),
            deleteSource: (id) => set((state) => ({
                sources: state.sources.filter(s => s.id !== id)
            })),

            // 4. Etiket (Tag) Yönetimi
            tags: [
                { id: '1', label: 'VIP', color: '#8b5cf6' },
                { id: '2', label: 'Tekrar Eden Müşteri', color: '#ec4899' },
                { id: '3', label: 'Sıkıntılı Kayıt', color: '#f97316' },
                { id: '4', label: 'Eski Müşteri', color: '#6b7280' },
            ],
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
        }
    )
);
