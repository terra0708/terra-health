import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReminderStore = create(
    persist(
        (set, get) => ({
            personalReminders: [], // { id, title, date, time, completed, note }

            addPersonalReminder: (reminder) => set((state) => ({
                personalReminders: [...state.personalReminders, {
                    id: Date.now().toString(),
                    completed: false,
                    createdAt: new Date().toISOString(),
                    ...reminder
                }]
            })),

            updatePersonalReminder: (id, updates) => set((state) => ({
                personalReminders: state.personalReminders.map((r) =>
                    r.id === id ? { ...r, ...updates } : r
                )
            })),

            toggleComplete: (id) => set((state) => ({
                personalReminders: state.personalReminders.map((r) =>
                    r.id === id ? { ...r, completed: !r.completed } : r
                )
            })),

            deletePersonalReminder: (id) => set((state) => ({
                personalReminders: state.personalReminders.filter((r) => r.id !== id)
            })),
        }),
        {
            name: 'reminder-storage',
            getStorage: () => localStorage,
        }
    )
);
