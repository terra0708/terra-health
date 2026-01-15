import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockCustomers } from '../data/mockData';

export const useCustomerStore = create(
    persist(
        (set, get) => ({
            customers: mockCustomers, // İlk kurulumda temel veriler

            // Eğer localStorage'da veri varsa, mock verilerindeki yeni alanları (tags gibi) 
            // mevcut verilere enjekte eden bir metod (Sadece geliştirme/demo için yararlı)
            syncWithMockData: () => {
                const currentCustomers = get().customers;
                const merged = currentCustomers.map(cc => {
                    const mock = mockCustomers.find(m => m.id === cc.id);
                    if (mock && !cc.tags) return { ...cc, tags: mock.tags };
                    return cc;
                });
                set({ customers: merged });
            },

            addCustomer: (newCustomer) => {
                const customerWithId = {
                    ...newCustomer,
                    id: Date.now(),
                    registrationDate: new Date().toISOString() // Standard ISO format
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

            // Migration logic for settings (Sizin istediğiniz toplu güncelleme alanı)
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
