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
            discoveredTenantId: null, // Tenant ID discovered from email (for login flow)

            // Actions
            login: async ({ email, password, tenantId }) => {
                // KRİTİK: tenantId kontrolü
                // Önce parametreden, sonra discoveredTenantId'den, sonra localStorage'dan al
                const finalTenantId = tenantId || get().discoveredTenantId || localStorage.getItem('tenantId');

                if (!finalTenantId) {
                    const error = new Error('Tenant ID is required for login');
                    set({ error, loading: false });
                    throw error;
                }

                set({ loading: true, error: null });

                try {
                    const response = await apiClient.post(
                        '/v1/auth/login',
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
                        error: null,
                        discoveredTenantId: null // Clear after successful login
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
                    loading: false,
                    discoveredTenantId: null
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
            },

            // Set discovered tenant ID (from email discovery)
            setDiscoveredTenantId: (tenantId) => {
                set({ discoveredTenantId: tenantId });
            },

            // Helper: Discover tenant ID based on email
            clearDiscoveredTenantId: () => {
                set({ discoveredTenantId: null });
            },

            // Helper: Check if current user has a specific permission or role
            // Supports both single string and array of strings (OR condition)
            hasPermission: (permission) => {
                const user = get().user;
                if (!user) return false;

                // Super Admin has all access
                if (user.roles?.includes('ROLE_SUPER_ADMIN')) return true;

                const userPermissions = user.permissions || [];

                if (Array.isArray(permission)) {
                    return permission.some(p => userPermissions.includes(p));
                }

                return userPermissions.includes(permission);
            },

            // Helper: Check if current user has a specific role
            hasRole: (role) => {
                const user = get().user;
                if (!user) return false;
                return user.roles?.includes(role);
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
