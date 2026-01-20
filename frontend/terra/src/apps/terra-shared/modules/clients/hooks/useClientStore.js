import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockBaseClients } from '../data/mockData';

export const useClientStore = create(
    persist(
        (set, get) => ({
            clients: mockBaseClients,

            // Mock Data Sync
            syncWithMockData: () => {
                const currentClients = get().clients;

                const merged = mockBaseClients.map(mock => {
                    const existing = currentClients.find(c => c.id === mock.id);
                    if (existing) {
                        return {
                            ...existing,
                            // Preserve existing data, merge with mock defaults
                        };
                    }
                    return mock;
                });

                const newRecords = mockBaseClients.filter(m => !currentClients.find(c => c.id === m.id));
                set({ clients: [...merged, ...newRecords] });
            },

            addClient: (newClient) => {
                const clientWithId = {
                    ...newClient,
                    id: newClient.id || Date.now(),
                    registrationDate: newClient.registrationDate || new Date().toISOString().split('T')[0],
                    createdAt: newClient.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                set((state) => ({
                    clients: [clientWithId, ...state.clients]
                }));
                return clientWithId;
            },

            updateClient: (id, updatedData) => {
                set((state) => ({
                    clients: state.clients.map(c => 
                        c.id === id 
                            ? { ...c, ...updatedData, updatedAt: new Date().toISOString() }
                            : c
                    )
                }));
            },

            deleteClient: (id) => {
                set((state) => ({
                    clients: state.clients.filter(c => c.id !== id)
                }));
            },

            getClientById: (id) => {
                return get().clients.find(c => c.id === id) || null;
            },

            getClientsBySource: (source) => {
                return get().clients.filter(c => c.source === source);
            },

            getClientsByIndustryType: (industryType) => {
                return get().clients.filter(c => c.industryType === industryType);
            },

            // Set industry type for a client (when assigned to a module)
            setIndustryType: (id, industryType) => {
                set((state) => ({
                    clients: state.clients.map(c => 
                        c.id === id 
                            ? { ...c, industryType, updatedAt: new Date().toISOString() }
                            : c
                    )
                }));
            }
        }),
        {
            name: 'terra-clients-storage-v1',
        }
    )
);
