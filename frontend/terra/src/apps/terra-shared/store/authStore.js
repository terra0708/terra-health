import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@shared/core/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            _hasHydrated: false, // Hydration flag
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,

            // Actions
            login: async ({ email, password, tenantId }) => {
                // KRİTİK: tenantId kontrolü
                if (!tenantId) {
                    const error = new Error('Tenant ID is required for login');
                    set({ error, loading: false });
                    throw error;
                }

                set({ loading: true, error: null });

                try {
                    const response = await apiClient.post(
                        '/auth/login',
                        { email, password },
                        { headers: { 'X-Tenant-ID': tenantId } }
                    );

                    // KRİTİK: Token Dağıtımı - Sıralama ÖNEMLİ
                    // 1. ÖNCE localStorage'a yaz (api.js interceptor buradan okuyor)
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('tenantId', response.user.tenantId.toString());

                    // 2. SONRA store'a yaz (persist middleware otomatik localStorage'a yazar)
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        loading: false,
                        error: null
                    });
                } catch (error) {
                    // api.js'den normalize edilmiş hata gelir
                    set({ error, loading: false });
                    throw error; // Caller'a fırlat
                }
            },

            logout: () => {
                // KRİTİK: Token Dağıtımı (Temizleme - Senkronizasyon)
                // 1. ÖNCE localStorage'dan sil
                localStorage.removeItem('token');
                localStorage.removeItem('tenantId');

                // 2. SONRA store'u sıfırla
                set({
                    user: null,
                    isAuthenticated: false,
                    error: null,
                    loading: false
                });

                // Hard redirect - güvenli ve temiz
                window.location.href = '/login';
            },

            refreshUser: (userData) => {
                // Token refresh sonrası kullanıcı verilerini güncelle
                // KRİTİK: Eğer user.tenantId değiştiyse, localStorage'daki tenantId de güncellenmeli
                if (userData?.tenantId) {
                    const currentTenantId = localStorage.getItem('tenantId');
                    const newTenantId = userData.tenantId.toString();
                    if (currentTenantId !== newTenantId) {
                        localStorage.setItem('tenantId', newTenantId);
                    }
                }

                set({ user: userData });
            },

            // Helper: Error state'i temizle
            clearError: () => {
                set({ error: null });
            }
        }),
        {
            name: 'terra-auth-storage', // api.js ile uyumlu
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                // Hydration tamamlandığında flag'i set et
                if (state) {
                    state._hasHydrated = true;
                }
            },
            partialize: (state) => ({
                // Sadece user ve isAuthenticated persist edilmeli
                // loading ve error persist edilmemeli (sayfa yenilemede eski durum görünmemeli)
                // _hasHydrated persist edilmemeli (her render'da false başlamalı)
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);

export default useAuthStore;
