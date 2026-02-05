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

    deleteRemindersByRelation: async (relationId) => {
        const toDelete = get().reminders.filter(r => r.relationId === relationId);
        for (const r of toDelete) {
            await reminderAPI.deleteReminder(r.id);
        }
        set(state => ({
            reminders: state.reminders.filter(r => r.relationId !== relationId)
        }));
    },

    syncCustomerReminders: async (customerId, reminders) => {
        if (!customerId) return;

        const currentReminders = get().reminders.filter(r => r.relationId === customerId);
        const newReminders = reminders || [];

        // 1. Identify Deletions: In current but NOT in new (by ID)
        const toDelete = currentReminders.filter(c => !newReminders.find(n => n.id === c.id));
        for (const r of toDelete) {
            await reminderAPI.deleteReminder(r.id);
        }

        // 2. Identify Updates: In both (preserve ID)
        const toUpdate = newReminders.filter(n => n.id && !String(n.id).startsWith('temp-') && currentReminders.find(c => c.id === n.id));
        for (const r of toUpdate) {
            await reminderAPI.updateReminder(r.id, r);
        }

        // 3. Identify Additions: In new but NOT in current (or has temp ID)
        const toAdd = newReminders.filter(n => !n.id || String(n.id).startsWith('temp-') || !currentReminders.find(c => c.id === n.id));
        for (const r of toAdd) {
            const { id, ...data } = r; // Exclude temp ID
            await reminderAPI.createReminder({ ...data, relationId: customerId, relationType: 'customer' });
        }

        // 4. Refresh local state
        await get().fetchRemindersByCustomer(customerId);
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
