import { create } from 'zustand';
import { reminderAPI } from '../api/reminderAPI';

export const useReminderStore = create((set, get) => ({
    reminders: [],
    loading: false,
    error: null,

    fetchReminders: async () => {
        set({ loading: true, error: null });
        try {
            const reminders = await reminderAPI.getAllReminders();
            set({ reminders, loading: false });
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchRemindersByCustomer: async (customerId) => {
        if (!customerId) return [];
        try {
            const reminders = await reminderAPI.getRemindersByCustomerId(customerId);
            // Update local state for these specific reminders
            set(state => {
                const otherReminders = state.reminders.filter(r => r.relationId !== customerId);
                return { reminders: [...otherReminders, ...reminders] };
            });
            return reminders;
        } catch (error) {
            console.error('Failed to fetch customer reminders:', error);
            return [];
        }
    },

    addReminder: async (reminderData) => {
        const newReminder = await reminderAPI.createReminder(reminderData);
        set(state => ({
            reminders: [newReminder, ...state.reminders]
        }));
        return newReminder;
    },

    updateReminder: async (id, updates) => {
        const updated = await reminderAPI.updateReminder(id, updates);
        set(state => ({
            reminders: state.reminders.map(r => r.id === id ? updated : r)
        }));
        return updated;
    },

    deleteReminder: async (id) => {
        await reminderAPI.deleteReminder(id);
        set(state => ({
            reminders: state.reminders.filter(r => r.id !== id)
        }));
    },

    toggleComplete: async (id) => {
        const updated = await reminderAPI.toggleComplete(id);
        set(state => ({
            reminders: state.reminders.map(r => r.id === id ? updated : r)
        }));
        return updated;
    },

    // Utility getters (synchronous from current state)
    getRemindersByRelation: (relationId) => {
        return get().reminders.filter(r => r.relationId === relationId);
    },

    // Legacy method name for backward compatibility
    getRemindersByCustomer: (customerId) => {
        return get().reminders.filter(r => r.relationId === customerId);
    }
}));
