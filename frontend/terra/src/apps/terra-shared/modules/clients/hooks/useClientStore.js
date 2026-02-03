import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@shared/core/api';

export const useClientStore = create(
    persist(
        (set, get) => ({
            clients: [],
            loading: false,
            error: null,

            // Fetch health customers from backend
            fetchClients: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await apiClient.get('/v1/health/customers');
                    // Ensure response is an array
                    const data = Array.isArray(response) ? response : (response?.data || []);
                    set({ clients: data, loading: false });
                } catch (error) {
                    console.error('Failed to fetch clients:', error);
                    set({ error, loading: false });
                }
            },

            // Mock Data Sync (Deprecated)
            syncWithMockData: () => {
                // No-op - transitioned to backend API
            },

            addClient: async (newClient) => {
                set({ loading: true, error: null });
                try {
                    const response = await apiClient.post('/v1/health/customers', newClient);
                    set((state) => ({
                        clients: [response, ...state.clients],
                        loading: false
                    }));
                    return response;
                } catch (error) {
                    set({ error, loading: false });
                    throw error;
                }
            },

            updateClient: async (id, updatedData) => {
                set({ loading: true, error: null });
                try {
                    const response = await apiClient.put(`/v1/health/customers/${id}`, updatedData);
                    set((state) => ({
                        clients: state.clients.map(c => c.id === id ? response : c),
                        loading: false
                    }));
                    return response;
                } catch (error) {
                    set({ error, loading: false });
                    throw error;
                }
            },

            deleteClient: async (id) => {
                set({ loading: true, error: null });
                try {
                    await apiClient.delete(`/v1/health/customers/${id}`);
                    set((state) => ({
                        clients: state.clients.filter(c => c.id !== id),
                        loading: false
                    }));
                } catch (error) {
                    set({ error, loading: false });
                    throw error;
                }
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
