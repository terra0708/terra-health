import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockCustomers } from '../data/mockData';

export const useCustomerStore = create(
    persist(
        (set, get) => ({
            customers: mockCustomers,

            // Geliştirme aşamasında mock verilerle güncel kalmak için
            syncWithMockData: () => {
                const currentCustomers = get().customers;
                const merged = mockCustomers.map(mock => {
                    const existing = currentCustomers.find(c => c.id === mock.id);
                    if (existing) {
                        // Eğer mevcut veride eksiklik varsa veya yapı değiştiyse (geliştirme amaçlı zorla güncelleme)
                        // Sadece isim ve telefon gibi 'gerçek' kullanıcı verilerini koruyup, 
                        // ayar bazlı alanları mock verisinden güncelleyebiliriz.
                        return {
                            ...existing,
                            services: mock.services,
                            tags: mock.tags,
                            status: mock.status,
                            source: mock.source
                        };
                    }
                    return mock;
                });
                set({ customers: merged });
            },

            addCustomer: (newCustomer) => {
                const customerWithId = {
                    ...newCustomer,
                    id: Date.now(),
                    registrationDate: new Date().toISOString()
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
            }
        }),
        {
            name: 'terra-customers-storage',
        }
    )
);
