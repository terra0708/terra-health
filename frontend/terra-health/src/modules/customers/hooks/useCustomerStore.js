import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockCustomers } from '../data/mockData';

export const useCustomerStore = create(
    persist(
        (set, get) => ({
            customers: mockCustomers,

            // Mock Data Sync
            syncWithMockData: () => {
                const currentCustomers = get().customers;
                // Only sync if customers array is empty or looks corrupted to avoid overwriting user edits too aggressively
                // Or force sync structure but keep IDs if valid. 
                // For simplicity in this dev phase, we merge mock data structure fixes.

                const merged = mockCustomers.map(mock => {
                    const existing = currentCustomers.find(c => c.id === mock.id);
                    if (existing) {
                        return {
                            ...existing,
                            // Ensure nested structures are updated if they are missing/old
                            reminder: existing.reminder && existing.reminder.notes && existing.reminder.notes.length > 0 && existing.reminder.notes[0].date
                                ? existing.reminder // Keep existing if it looks migrated
                                : mock.reminder // Force update to new structure if old structure detected
                        };
                    }
                    return mock;
                });

                // Also adding any new mock records
                const newRecords = mockCustomers.filter(m => !currentCustomers.find(c => c.id === m.id));

                set({ customers: [...merged, ...newRecords] });
            },

            addCustomer: (newCustomer) => {
                const customerWithId = {
                    ...newCustomer,
                    id: Date.now(),
                    registrationDate: newCustomer.registrationDate || new Date().toISOString().split('T')[0]
                };
                set((state) => ({
                    customers: [customerWithId, ...state.customers]
                }));
            },

            updateCustomer: (id, updatedData) => {
                set((state) => ({
                    customers: state.customers.map(c => c.id === id ? { ...c, ...updatedData } : c)
                }));
            },

            deleteCustomer: (id) => {
                set((state) => ({
                    customers: state.customers.filter(c => c.id !== id)
                }));
            },

            migrateField: (type, oldValue, newValue) => {
                set((state) => ({
                    customers: state.customers.map(c => {
                        if (type === 'status' && c.status === oldValue) return { ...c, status: newValue };
                        if (type === 'source' && c.source === oldValue) return { ...c, source: newValue };
                        if (type === 'services') return { ...c, services: c.services.map(s => s === oldValue ? newValue : s).filter(Boolean) };
                        if (type === 'tags') return { ...c, tags: c.tags.map(t => t === oldValue ? newValue : t).filter(Boolean) };
                        return c;
                    })
                }));
            },

            // --- STANDARDIZED REMINDER ACTIONS ---

            addCustomerNote: (customerId, noteData) => {
                set((state) => ({
                    customers: state.customers.map(c => {
                        if (c.id === customerId) {
                            const newNote = {
                                id: noteData.id || Date.now().toString(),
                                title: noteData.title || noteData.text, // Fallback for old calls
                                note: noteData.note || '',
                                date: noteData.date, // Expecting YYYY-MM-DD
                                time: noteData.time, // Expecting HH:MM
                                statusId: noteData.statusId || 'pending',
                                categoryId: 'customer', // Always customer
                                subCategoryId: noteData.subCategoryId || '',
                                isCompleted: noteData.isCompleted || noteData.completed || false,
                                type: 'customer',
                                createdAt: new Date().toISOString()
                            };
                            return {
                                ...c,
                                reminder: {
                                    ...c.reminder,
                                    notes: c.reminder?.notes ? [newNote, ...c.reminder.notes] : [newNote]
                                }
                            };
                        }
                        return c;
                    })
                }));
            },

            updateCustomerNote: (customerId, noteId, updates) => {
                set((state) => ({
                    customers: state.customers.map(c => {
                        if (c.id === customerId && c.reminder?.notes) {
                            return {
                                ...c,
                                reminder: {
                                    ...c.reminder,
                                    notes: c.reminder.notes.map(n => {
                                        if (n.id === noteId) {
                                            const updatedNote = { ...n, ...updates };
                                            // Ensure data consistency
                                            if (updates.isCompleted !== undefined) updatedNote.isCompleted = updates.isCompleted;
                                            if (updates.completed !== undefined) updatedNote.isCompleted = updates.completed; // Legacy support

                                            // Map legacy 'text' -> 'title' if update comes from old component
                                            if (updates.text) updatedNote.title = updates.text;

                                            return updatedNote;
                                        }
                                        return n;
                                    })
                                }
                            };
                        }
                        return c;
                    })
                }));
            },

            deleteCustomerNote: (customerId, noteId) => {
                set((state) => ({
                    customers: state.customers.map(c => {
                        if (c.id === customerId && c.reminder?.notes) {
                            return {
                                ...c,
                                reminder: {
                                    ...c.reminder,
                                    notes: c.reminder.notes.filter(n => n.id !== noteId)
                                }
                            };
                        }
                        return c;
                    })
                }));
            },

            toggleReminderComplete: (customerId, noteId) => {
                set((state) => ({
                    customers: state.customers.map(c => {
                        if (c.id === customerId && c.reminder && c.reminder.notes) {
                            return {
                                ...c,
                                reminder: {
                                    ...c.reminder,
                                    notes: c.reminder.notes.map(n =>
                                        n.id === noteId ? {
                                            ...n,
                                            isCompleted: !n.isCompleted,
                                            statusId: !n.isCompleted ? 'completed' : 'pending' // Auto switch
                                        } : n
                                    )
                                }
                            };
                        }
                        return c;
                    })
                }));
            },

            // Updated Generator to produce STANDARDIZED data
            generateRandomReminders: () => {
                set((state) => {
                    const updatedCustomers = state.customers.map(c => {
                        // If no reminders, add some random ones
                        if (!c.reminder?.notes || c.reminder.notes.length === 0) {
                            const hasReminder = Math.random() > 0.4;
                            if (!hasReminder) return c;

                            const notes = [];
                            const count = Math.floor(Math.random() * 2) + 1;

                            for (let i = 0; i < count; i++) {
                                const isPastDate = Math.random() > 0.3;
                                const dateObj = new Date();
                                dateObj.setDate(dateObj.getDate() + (isPastDate ? -Math.floor(Math.random() * 10) : Math.floor(Math.random() * 14)));

                                const dateStr = dateObj.toISOString().split('T')[0];
                                const timeStr = `${9 + Math.floor(Math.random() * 9)}:00`.padStart(5, '0');
                                const isDone = isPastDate && Math.random() > 0.4;

                                notes.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    title: `Otomatik Görev: ${c.name}`,
                                    note: `Sistem tarafından oluşturulan otomatik takip görevi #${i + 1}`,
                                    date: dateStr,
                                    time: timeStr,
                                    statusId: isDone ? 'completed' : (isPastDate ? 'pending' : 'pending'), // Simplified logic
                                    categoryId: 'customer',
                                    subCategoryId: '',
                                    isCompleted: isDone,
                                    type: 'customer',
                                    createdAt: new Date().toISOString()
                                });
                            }

                            return {
                                ...c,
                                reminder: {
                                    active: true,
                                    notes: notes
                                }
                            };
                        }
                        return c;
                    });
                    return { customers: updatedCustomers };
                });
            }
        }),
        {
            name: 'terra-customers-storage-v2', // Version bump to ensure fresh structure
        }
    )
);
