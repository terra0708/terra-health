import { create } from 'zustand';
import { reminderSettingsAPI } from '../api/reminderSettingsAPI';

export const useReminderSettingsStore = create((set, get) => ({
    categories: [],
    subCategories: [],
    statuses: [],
    loading: false,
    error: null,

    fetchSettings: async () => {
        set({ loading: true, error: null });
        try {
            const [categories, subCategories, statuses] = await Promise.all([
                reminderSettingsAPI.getCategories(),
                reminderSettingsAPI.getSubcategories(),
                reminderSettingsAPI.getStatuses()
            ]);
            set({
                categories,
                subCategories,
                statuses,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch reminder settings:', error);
            set({ error: error.message, loading: false });
        }
    },

    // Categories
    addCategory: async (data) => {
        const newCategory = await reminderSettingsAPI.createCategory(data);
        set(state => ({ categories: [...state.categories, newCategory] }));
        return newCategory;
    },
    updateCategory: async (id, data) => {
        const updatedCategory = await reminderSettingsAPI.updateCategory(id, data);
        set(state => ({
            categories: state.categories.map(c => c.id === id ? updatedCategory : c)
        }));
        return updatedCategory;
    },
    deleteCategory: async (id) => {
        await reminderSettingsAPI.deleteCategory(id);
        set(state => ({
            categories: state.categories.filter(c => c.id !== id),
            subCategories: state.subCategories.filter(s => s.categoryId !== id)
        }));
    },

    // Subcategories
    addSubCategory: async (data) => {
        const newSub = await reminderSettingsAPI.createSubcategory(data);
        set(state => ({ subCategories: [...state.subCategories, newSub] }));
        return newSub;
    },
    updateSubCategory: async (id, data) => {
        const updatedSub = await reminderSettingsAPI.updateSubcategory(id, data);
        set(state => ({
            subCategories: state.subCategories.map(s => s.id === id ? updatedSub : s)
        }));
        return updatedSub;
    },
    deleteSubCategory: async (id) => {
        await reminderSettingsAPI.deleteSubcategory(id);
        set(state => ({
            subCategories: state.subCategories.filter(s => s.id !== id)
        }));
    },

    // Statuses
    addStatus: async (data) => {
        const newStatus = await reminderSettingsAPI.createStatus(data);
        set(state => ({ statuses: [...state.statuses, newStatus] }));
        return newStatus;
    },
    updateStatus: async (id, data) => {
        const updatedStatus = await reminderSettingsAPI.updateStatus(id, data);
        set(state => ({
            statuses: state.statuses.map(s => s.id === id ? updatedStatus : s)
        }));
        return updatedStatus;
    },
    deleteStatus: async (id) => {
        await reminderSettingsAPI.deleteStatus(id);
        set(state => ({
            statuses: state.statuses.filter(s => s.id !== id)
        }));
    },

    // Helper to get Customer Category
    getCustomerCategory: () => {
        return get().categories.find(c => c.labelEn === 'Customer');
    },

    // Helper to get Status Category (which is used for subcategories in some views)
    getStatusCategory: () => {
        return get().categories.find(c => c.labelEn === 'Status');
    },

    // Helper to get default status (Pending)
    getDefaultStatus: () => {
        return get().statuses.find(s => s.value === 'pending') || get().statuses[0];
    }
}));
