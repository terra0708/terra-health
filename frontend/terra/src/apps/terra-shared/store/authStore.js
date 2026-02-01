import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import apiClient from '@shared/core/api';
import { setTokens, getToken, getRefreshToken, clearTokens } from '@shared/core/tokenStorage';

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
                        { headers: { 'X-Tenant-ID': tenantId || finalTenantId } }
                    );

                    // Stateless API: store tokens in sessionStorage (not persisted to localStorage)
                    setTokens(response.token, response.refreshToken);
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
                const refreshToken = getRefreshToken();
                clearTokens();
                try {
                    if (refreshToken) {
                        await apiClient.post('/v1/auth/logout', { refreshToken });
                    }
                } catch (error) {
                    console.error('Logout request failed, but continuing with local cleanup:', error);
                } finally {
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
            // Backend returns List<PermissionResponseDTO> with id, name, parentId
            // Extract permission names for hasPermission checks
            fetchGranularPermissions: async () => {
                try {
                    const response = await apiClient.get('/v1/tenant-admin/permissions');
                    // Backend returns ApiResponse<List<PermissionResponseDTO>>
                    const permissions = Array.isArray(response) ? response : (response?.data || []);
                    // Extract permission names for hasPermission checks
                    const permissionNames = permissions.map(p => typeof p === 'string' ? p : p.name).filter(Boolean);
                    return permissionNames;
                } catch (error) {
                    console.error('Failed to fetch granular permissions:', error);
                    // Fallback: Return empty array (don't break the app)
                    return [];
                }
            },

            // Silent refresh: get new access token from refresh token (no user fetch).
            // Used on app start when we have refreshToken but no/missing access token (e.g. F5 after token deleted).
            trySilentRefresh: async () => {
                const refreshToken = getRefreshToken();
                if (!refreshToken) return false;
                try {
                    const baseURL = import.meta.env.VITE_API_URL || '/api';
                    const res = await axios.post(
                        `${baseURL}/v1/auth/refresh`,
                        { refreshToken },
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                    const payload = res.data?.data;
                    if (payload?.accessToken) {
                        setTokens(payload.accessToken, payload.refreshToken ?? refreshToken);
                        return true;
                    }
                    return false;
                } catch {
                    return false;
                }
            },

            // Fetch current user from backend (/api/v1/auth/me)
            // Used on app initialization and when user context needs to be refreshed
            fetchCurrentUser: async () => {
                set({ loading: true, error: null });
                try {
                    // If we have refresh token but no access token (e.g. F5 after token deleted), refresh first
                    if (!getToken() && getRefreshToken()) {
                        const refreshed = await get().trySilentRefresh();
                        if (!refreshed) {
                            clearTokens();
                            set({ user: null, isAuthenticated: false, loading: false, error: null });
                            localStorage.removeItem('tenantId');
                            throw new Error('Session expired');
                        }
                    }
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
                    if (error.status === 401 || error.status === 403) {
                        clearTokens();
                        set({
                            user: null,
                            isAuthenticated: false,
                            loading: false,
                            error: null
                        });
                        localStorage.removeItem('tenantId');
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
