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

                    // KRİTİK: Token artık cookie'de, localStorage'a yazma işlemi kaldırıldı
                    // Access token ve refresh token HttpOnly cookie'lerde otomatik gönderilecek
                    // Sadece tenantId localStorage'da kalıyor (X-Tenant-ID header için gerekli)
                    localStorage.setItem('tenantId', response.user.tenantId.toString());

                    // CRITICAL: Fetch granular ACTION permissions after login
                    // Login response contains only MODULE permissions (JWT optimization)
                    // ACTION permissions must be fetched separately
                    let granularPermissions = [];
                    try {
                        granularPermissions = await get().fetchGranularPermissions();
                    } catch (permError) {
                        // Don't fail login if granular permissions fetch fails
                        console.warn('Failed to fetch granular permissions after login:', permError);
                    }

                    // Combine MODULE permissions (from login response) + ACTION permissions (from API)
                    const allPermissions = [
                        ...(response.user.permissions || []), // MODULE_* yetkileri
                        ...granularPermissions // ACTION yetkileri
                    ];

                    // Store'a yaz (persist middleware otomatik localStorage'a yazar)
                    set({
                        user: { ...response.user, permissions: allPermissions },
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

            logout: async () => {
                try {
                    // Backend logout endpoint'ini çağır (cookie'ler otomatik gönderilir)
                    await apiClient.post('/v1/auth/logout');
                } catch (error) {
                    // Hata olsa bile devam et - cookie'ler backend'den temizlenmiş olabilir
                    // Kullanıcı uçaktayken veya interneti koptuğunda "çıkış yapamama" gibi bir saçmalık yaşamamalı
                    console.error('Logout request failed, but continuing with local cleanup:', error);
                } finally {
                    // HER HALÜKARDA temizle - Local cleanup her zaman çalışmalı
                    // Network hatası, timeout, uçak modu - hiçbir şey logout'u engellememeli
                    localStorage.removeItem('tenantId');
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: null,
                        loading: false,
                        discoveredTenantId: null
                    });
                    window.location.href = '/login';
                }
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
            },

            // Fetch granular ACTION permissions from backend
            // Backend returns List<String> (permission names) for performance
            fetchGranularPermissions: async () => {
                try {
                    const response = await apiClient.get('/v1/tenant-admin/permissions');
                    // Backend returns List<String> directly, no need to map
                    return Array.isArray(response) ? response : [];
                } catch (error) {
                    console.error('Failed to fetch granular permissions:', error);
                    // Fallback: Return empty array (don't break the app)
                    return [];
                }
            },

            // Fetch current user from backend (/api/v1/auth/me)
            // CRITICAL: This method reads user info from backend without accessing HttpOnly cookies
            // Used on app initialization and when user context needs to be refreshed
            // CRITICAL: Race Condition Prevention - Uses Promise.all to fetch MODULE and ACTION permissions in parallel
            fetchCurrentUser: async () => {
                set({ loading: true, error: null });
                try {
                    // CRITICAL: Race Condition Önleme - Promise.all ile paralel çek
                    // Bu iki çağrı aynı anda başlar ve ikisi de bitene kadar bekler
                    // Sistemin mantığı: P_toplam = P_jwt_modül ∪ P_api_aksiyon
                    // Kullanıcı arayüzü ancak bu birleşim tamamlandığında render edilmelidir
                    const [userResponse, granularPermissions] = await Promise.all([
                        apiClient.get('/v1/auth/me'), // JWT'den MODULE yetkileri
                        get().fetchGranularPermissions() // Backend'den ACTION yetkileri
                    ]);
                    
                    // KRİTİK: Tenant ID senkronizasyonu
                    // Response'daki tenantId ile localStorage'daki tenantId'yi eşitle
                    if (userResponse.tenantId) {
                        const currentTenantId = localStorage.getItem('tenantId');
                        const newTenantId = userResponse.tenantId.toString();
                        if (currentTenantId !== newTenantId) {
                            localStorage.setItem('tenantId', newTenantId);
                            if (import.meta.env.DEV) {
                                console.debug('✅ Tenant ID synchronized:', newTenantId);
                            }
                        }
                    }
                    
                    // MODULE yetkileri (JWT'den) + ACTION yetkileri (backend'den) birleştir
                    const allPermissions = [
                        ...(userResponse.permissions || []), // MODULE_* yetkileri
                        ...granularPermissions // ACTION yetkileri (List<String>)
                    ];
                    
                    // Update auth store with user data (combined permissions)
                    set({
                        user: { ...userResponse, permissions: allPermissions },
                        isAuthenticated: true,
                        loading: false,
                        error: null
                    });
                    
                    return { ...userResponse, permissions: allPermissions };
                } catch (error) {
                    // If 401, user is not authenticated - clear state gracefully
                    if (error.status === 401 || error.status === 403) {
                        set({
                            user: null,
                            isAuthenticated: false,
                            loading: false,
                            error: null
                        });
                        localStorage.removeItem('tenantId');
                        // Don't redirect here - let App.jsx handle it to prevent flicker
                    } else {
                        set({ error, loading: false });
                    }
                    throw error;
                }
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
