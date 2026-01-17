import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReminderStore = create(
    persist(
        (set, get) => ({
            reminders: [], // Central repository for all types of reminders

            // Primary Actions
            addReminder: (reminderData) => {
                const newReminder = {
                    id: reminderData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    title: reminderData.title || '',
                    note: reminderData.note || '',
                    date: reminderData.date || new Date().toISOString().split('T')[0],
                    time: reminderData.time || '09:00',
                    statusId: reminderData.statusId || 'pending',
                    categoryId: reminderData.categoryId || 'personal',
                    subCategoryId: reminderData.subCategoryId || '',
                    relationId: reminderData.relationId || reminderData.customerId || null,
                    isCompleted: reminderData.isCompleted || false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                set((state) => ({
                    reminders: [newReminder, ...state.reminders]
                }));
                return newReminder;
            },

            updateReminder: (id, updates) => {
                set((state) => ({
                    reminders: state.reminders.map((r) =>
                        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
                    )
                }));
            },

            deleteReminder: (id) => {
                set((state) => ({
                    reminders: state.reminders.filter((r) => r.id !== id)
                }));
            },

            deleteRemindersByRelation: (relationId) => {
                set((state) => ({
                    reminders: state.reminders.filter((r) => r.relationId !== relationId)
                }));
            },

            toggleComplete: (id) => {
                const reminder = get().reminders.find(r => r.id === id);
                if (!reminder) return;

                const nextStatus = !reminder.isCompleted ? 'completed' : 'pending';
                get().updateReminder(id, {
                    isCompleted: !reminder.isCompleted,
                    statusId: nextStatus
                });
            },

            // Utility to get reminders for a specific customer
            getRemindersByCustomer: (customerId) => {
                return get().reminders.filter(r => r.relationId === customerId || r.categoryId === 'customer' && r.relationId === customerId);
            },

            // LEGACY SYNC: Function to pull reminders from customers and clear them
            syncFromCustomerStore: (customers, clearCustomerReminders) => {
                const currentReminders = get().reminders;
                const newFromCustomers = [];

                customers.forEach(customer => {
                    if (customer.reminder?.notes?.length > 0) {
                        customer.reminder.notes.forEach(note => {
                            // Avoid duplicates
                            if (!currentReminders.find(r => r.id === note.id)) {
                                newFromCustomers.push({
                                    ...note,
                                    relationId: customer.id,
                                    categoryId: 'customer',
                                    updatedAt: new Date().toISOString()
                                });
                            }
                        });
                    }
                });

                if (newFromCustomers.length > 0) {
                    set({ reminders: [...get().reminders, ...newFromCustomers] });
                    return true; // Indicating sync happened
                }
                return false;
            }
        }),
        {
            name: 'terra-central-reminders-v1', // New storage name for consistent data
        }
    )
);
