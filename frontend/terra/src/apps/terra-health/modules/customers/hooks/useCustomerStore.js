import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockCustomers } from '../data/mockData';

/**
 * @deprecated This store is deprecated. Use useClientStore (shared) + usePatientDetailsStore (health) instead.
 * This store is kept for backward compatibility during migration.
 * 
 * Migration: Use migrateCustomersToHybrid() from migrations/splitCustomers.js
 */
export const useCustomerStore = create(
    persist(
        (set, get) => ({
            customers: mockCustomers,

            // Mock Data Sync
            syncWithMockData: () => {
                const currentCustomers = get().customers;

                const merged = mockCustomers.map(mock => {
                    const existing = currentCustomers.find(c => c.id === mock.id);
                    if (existing) {
                        return {
                            ...existing,
                            // Notice: We don't force 'reminder' structure here anymore
                            // Centralized store will handle it
                        };
                    }
                    return mock;
                });

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
                return customerWithId;
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

            // Utility to clean up nested reminders after they are migrated to the central store
            clearNestedReminders: () => {
                set((state) => ({
                    customers: state.customers.map(c => {
                        const { reminder, ...rest } = c;
                        return rest;
                    })
                }));
            }
        }),
        {
            name: 'terra-customers-storage-v3', // Version bump for refactored structure
        }
    )
);
