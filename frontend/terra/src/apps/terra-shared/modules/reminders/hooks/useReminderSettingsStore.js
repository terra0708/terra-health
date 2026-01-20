import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReminderSettingsStore = create(
    persist(
        (set) => ({
            categories: [
                { id: 'customer', label_tr: 'Müşteri', label_en: 'Customer', type: 'system', color: '#6366f1', isDefault: true },
                { id: 'personal', label_tr: 'Kişisel', label_en: 'Personal', type: 'custom', color: '#8b5cf6', isDefault: false },
                { id: 'finance', label_tr: 'Finans', label_en: 'Finance', type: 'custom', color: '#10b981', isDefault: false },
                { id: 'meeting', label_tr: 'Toplantı', label_en: 'Meeting', type: 'custom', color: '#f59e0b', isDefault: false },
            ],

            subCategories: [
                { id: 'invoice', label_tr: 'Fatura', label_en: 'Invoice', categoryId: 'finance', color: '#10b981' },
                { id: 'payment', label_tr: 'Ödeme', label_en: 'Payment', categoryId: 'finance', color: '#059669' },
                { id: 'weekly_meeting', label_tr: 'Haftalık Toplantı', label_en: 'Weekly Meeting', categoryId: 'meeting', color: '#f59e0b' },
            ],

            // YENİ: Status yapısı
            statuses: [
                { id: 'pending', label_tr: 'Bekliyor', label_en: 'Pending', type: 'system', color: '#f59e0b', isCompleted: false },
                { id: 'completed', label_tr: 'Tamamlandı', label_en: 'Completed', type: 'system', color: '#10b981', isCompleted: true },
                { id: 'cancelled', label_tr: 'İptal', label_en: 'Cancelled', type: 'system', color: '#ef4444', isCompleted: true },
                { id: 'postponed', label_tr: 'Ertelendi', label_en: 'Postponed', type: 'custom', color: '#8b5cf6', isCompleted: false },
            ],

            // --- Categories Actions ---
            addCategory: (category) => set((state) => ({
                categories: [...state.categories, { ...category, id: Date.now().toString(), type: 'custom' }]
            })),

            updateCategory: (id, updates) => set((state) => ({
                categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c)
            })),

            deleteCategory: (id) => set((state) => ({
                categories: state.categories.filter((c) => c.id !== id || c.type === 'system'),
                subCategories: state.subCategories.filter(s => s.categoryId !== id)
            })),

            // --- Sub-Categories Actions ---
            addSubCategory: (subCategory) => set((state) => ({
                subCategories: [...state.subCategories, { ...subCategory, id: Date.now().toString() }]
            })),

            updateSubCategory: (id, updates) => set((state) => ({
                subCategories: state.subCategories.map((s) => s.id === id ? { ...s, ...updates } : s)
            })),

            deleteSubCategory: (id) => set((state) => ({
                subCategories: state.subCategories.filter((s) => s.id !== id)
            })),

            // --- Status Actions ---
            addStatus: (status) => set((state) => ({
                statuses: [...state.statuses, { ...status, id: Date.now().toString(), type: 'custom' }]
            })),

            updateStatus: (id, updates) => set((state) => ({
                statuses: state.statuses.map((s) => s.id === id ? { ...s, ...updates } : s)
            })),

            deleteStatus: (id) => set((state) => ({
                statuses: state.statuses.filter((s) => s.id !== id || s.type === 'system')
            })),
        }),
        {
            name: 'terra-reminder-settings-v3', // Version bump for schema change
        }
    )
);
