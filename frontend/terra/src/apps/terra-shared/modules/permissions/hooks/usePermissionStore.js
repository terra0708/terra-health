import { create } from 'zustand';
import apiClient from '../../../core/api';

/**
 * Permission Store - Backend API Integration
 * 
 * CRITICAL: All data is fetched from backend, no mock data.
 * UUID-based permission IDs for bundle creation/updates.
 * 
 * Zustand Sync: Bundle CRUD operations trigger authStore permission refresh
 * if current user's permissions are affected.
 */
export const usePermissionStore = create((set, get) => ({
    // State
    permissions: [], // List<PermissionResponseDTO> - {id, name, description, type, parentPermissionId, parentPermissionName}
    bundles: [], // List<BundleDto> - {id, name, description, tenantId, permissions: List<PermissionResponseDTO>, createdAt, updatedAt}
    modules: [], // List<ModuleDTO> - MODULE level permissions with childPermissions
    loading: false,
    error: null,

    // Actions

    /**
     * Fetch all available ACTION-level permissions for current tenant.
     * Returns List<PermissionResponseDTO> with UUID, name, parentId.
     */
    fetchPermissions: async () => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/v1/tenant-admin/permissions');
            // Backend returns ApiResponse<List<PermissionResponseDTO>>
            const permissions = Array.isArray(response) ? response : (response?.data || []);
            set({ permissions, loading: false });
            return permissions;
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
            set({ error: error.message || 'Failed to fetch permissions', loading: false });
            throw error;
        }
    },

    /**
     * Fetch all bundles for current tenant.
     * Returns List<BundleDto> with eagerly-loaded permissions.
     */
    fetchBundles: async () => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/v1/tenant-admin/bundles');
            // Backend returns ApiResponse<List<BundleDto>>
            const bundles = Array.isArray(response) ? response : (response?.data || []);
            set({ bundles, loading: false });
            return bundles;
        } catch (error) {
            console.error('Failed to fetch bundles:', error);
            set({ error: error.message || 'Failed to fetch bundles', loading: false });
            throw error;
        }
    },

    /**
     * Fetch MODULE-level permissions for current tenant.
     * Returns List<ModuleDTO> with childPermissions to avoid circular references.
     */
    fetchModules: async () => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/v1/tenant-admin/modules');
            // Backend returns ApiResponse<List<ModuleDTO>>
            const modules = Array.isArray(response) ? response : (response?.data || []);
            set({ modules, loading: false });
            return modules;
        } catch (error) {
            console.error('Failed to fetch modules:', error);
            set({ error: error.message || 'Failed to fetch modules', loading: false });
            throw error;
        }
    },

    /**
     * Fetch bundles assigned to a specific user.
     * Returns List<BundleDto> with eagerly-loaded permissions.
     */
    fetchUserBundles: async (userId) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get(`/v1/tenant-admin/users/${userId}/bundles`);
            // Backend returns ApiResponse<List<BundleDto>>
            const bundles = Array.isArray(response) ? response : (response?.data || []);
            set({ loading: false });
            return bundles;
        } catch (error) {
            console.error('Failed to fetch user bundles:', error);
            set({ error: error.message || 'Failed to fetch user bundles', loading: false });
            throw error;
        }
    },

    /**
     * Create a new permission bundle.
     * CRITICAL: Triggers Zustand sync if current user is affected.
     */
    createBundle: async (name, description, permissionIds) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post('/v1/tenant-admin/bundles', {
                name,
                description,
                permissionIds // UUID[]
            });
            
            // Backend returns ApiResponse<PermissionBundle>
            const bundle = response?.data || response;
            
            // Refresh bundle list
            await get().fetchBundles();
            
            // CRITICAL: Zustand Sync - Update current user's permissions if needed
            // (New bundle doesn't affect current user yet, but refresh for safety)
            try {
                const authStoreModule = await import('@shared/store/authStore');
                const useAuthStore = authStoreModule.default || authStoreModule.useAuthStore;
                if (useAuthStore) {
                    const authStore = useAuthStore.getState();
                    const currentUser = authStore.user;
                    if (currentUser) {
                        // Refresh granular permissions (safely in background)
                        await authStore.fetchGranularPermissions();
                    }
                }
            } catch (syncError) {
                // Silent fail - don't break bundle creation
                if (import.meta.env.DEV) {
                    console.debug('Failed to sync authStore after bundle creation:', syncError);
                }
            }
            
            set({ loading: false });
            return bundle;
        } catch (error) {
            console.error('Failed to create bundle:', error);
            set({ error: error.message || 'Failed to create bundle', loading: false });
            throw error;
        }
    },

    /**
     * Update a permission bundle.
     * CRITICAL: Triggers Zustand sync if current user is affected.
     */
    updateBundle: async (bundleId, permissionIds) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.put(`/v1/tenant-admin/bundles/${bundleId}`, {
                permissionIds // UUID[]
            });
            
            // Backend returns ApiResponse<PermissionBundle>
            const bundle = response?.data || response;
            
            // Refresh bundle list
            await get().fetchBundles();
            
            // CRITICAL: Zustand Sync - Check if current user has this bundle
            try {
                const authStoreModule = await import('@shared/store/authStore');
                const useAuthStore = authStoreModule.default || authStoreModule.useAuthStore;
                if (useAuthStore) {
                    const authStore = useAuthStore.getState();
                    const currentUser = authStore.user;
                    if (currentUser) {
                        // Check if current user has this bundle
                        const userBundles = await get().fetchUserBundles(currentUser.id);
                        const hasBundle = userBundles.some(b => b.id === bundleId);
                        
                        if (hasBundle) {
                            // Current user has this bundle - refresh permissions
                            await authStore.fetchGranularPermissions();
                        }
                    }
                }
            } catch (syncError) {
                // Silent fail - don't break bundle update
                if (import.meta.env.DEV) {
                    console.debug('Failed to sync authStore after bundle update:', syncError);
                }
            }
            
            set({ loading: false });
            return bundle;
        } catch (error) {
            console.error('Failed to update bundle:', error);
            set({ error: error.message || 'Failed to update bundle', loading: false });
            throw error;
        }
    },

    /**
     * Delete a permission bundle.
     * CRITICAL: Triggers Zustand sync if current user is affected.
     */
    deleteBundle: async (bundleId) => {
        set({ loading: true, error: null });
        try {
            await apiClient.delete(`/v1/tenant-admin/bundles/${bundleId}`);
            
            // Refresh bundle list
            await get().fetchBundles();
            
            // CRITICAL: Zustand Sync - Check if current user had this bundle
            try {
                const authStoreModule = await import('@shared/store/authStore');
                const useAuthStore = authStoreModule.default || authStoreModule.useAuthStore;
                if (useAuthStore) {
                    const authStore = useAuthStore.getState();
                    const currentUser = authStore.user;
                    if (currentUser) {
                        // Refresh permissions (bundle deletion removes permissions from user)
                        await authStore.fetchGranularPermissions();
                    }
                }
            } catch (syncError) {
                // Silent fail - don't break bundle deletion
                if (import.meta.env.DEV) {
                    console.debug('Failed to sync authStore after bundle deletion:', syncError);
                }
            }
            
            set({ loading: false });
        } catch (error) {
            console.error('Failed to delete bundle:', error);
            set({ error: error.message || 'Failed to delete bundle', loading: false });
            throw error;
        }
    },

    /**
     * Assign a bundle to a user.
     * CRITICAL: Triggers Zustand sync if current user is affected.
     */
    assignBundleToUser: async (bundleId, userId) => {
        set({ loading: true, error: null });
        try {
            await apiClient.post(`/v1/tenant-admin/bundles/${bundleId}/assign/${userId}`);
            
            // CRITICAL: Zustand Sync - If current user, refresh permissions immediately
            try {
                const authStoreModule = await import('@shared/store/authStore');
                const useAuthStore = authStoreModule.default || authStoreModule.useAuthStore;
                if (useAuthStore) {
                    const authStore = useAuthStore.getState();
                    const currentUser = authStore.user;
                    if (currentUser && currentUser.id === userId) {
                        // Current user received bundle - refresh permissions immediately
                        await authStore.fetchGranularPermissions();
                    }
                }
            } catch (syncError) {
                // Silent fail - don't break bundle assignment
                if (import.meta.env.DEV) {
                    console.debug('Failed to sync authStore after bundle assignment:', syncError);
                }
            }
            
            set({ loading: false });
        } catch (error) {
            console.error('Failed to assign bundle to user:', error);
            set({ error: error.message || 'Failed to assign bundle', loading: false });
            throw error;
        }
    },

    /**
     * Remove a bundle from a user.
     * CRITICAL: Triggers Zustand sync if current user is affected.
     */
    removeBundleFromUser: async (bundleId, userId) => {
        set({ loading: true, error: null });
        try {
            await apiClient.delete(`/v1/tenant-admin/bundles/${bundleId}/users/${userId}`);
            
            // CRITICAL: Zustand Sync - If current user, refresh permissions immediately
            try {
                const authStoreModule = await import('@shared/store/authStore');
                const useAuthStore = authStoreModule.default || authStoreModule.useAuthStore;
                if (useAuthStore) {
                    const authStore = useAuthStore.getState();
                    const currentUser = authStore.user;
                    if (currentUser && currentUser.id === userId) {
                        // Current user lost bundle - refresh permissions immediately
                        await authStore.fetchGranularPermissions();
                    }
                }
            } catch (syncError) {
                // Silent fail - don't break bundle removal
                if (import.meta.env.DEV) {
                    console.debug('Failed to sync authStore after bundle removal:', syncError);
                }
            }
            
            set({ loading: false });
        } catch (error) {
            console.error('Failed to remove bundle from user:', error);
            set({ error: error.message || 'Failed to remove bundle', loading: false });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));
