import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_CAMPAIGNS as INITIAL_CAMPAIGNS } from '../../../mocks/marketingMocks';

export const useMarketingStore = create(
    persist(
        (set, get) => ({
            campaigns: INITIAL_CAMPAIGNS,

            addCampaign: (campaign) => set((state) => ({
                campaigns: [
                    ...state.campaigns,
                    {
                        ...campaign,
                        id: `CMP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                        status: 'active',
                        spend: 0,
                        leads: 0,
                        sales: 0,
                        roi: 0
                    }
                ]
            })),

            updateCampaign: (id, updates) => set((state) => ({
                campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
            })),

            deleteCampaign: (id) => set((state) => ({
                campaigns: state.campaigns.filter(c => c.id !== id)
            })),

            toggleStatus: (id) => set((state) => ({
                campaigns: state.campaigns.map(c =>
                    c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
                )
            })),
        }),
        {
            name: 'terra-marketing-storage',
        }
    )
);
