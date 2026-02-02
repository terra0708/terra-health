import { create } from 'zustand';
import apiClient from '../../../core/api';

/**
 * User Store - Backend API Integration
 * 
 * CRITICAL: All data is fetched from backend, no mock data.
 * Tenant-isolated user management.
 */
export const useUserStore = create((set, get) => ({
    // State
    users: [], // List<UserDto> from backend
    loading: false,
    error: null,
    /**
     * Last generated password information for create/reset operations.
     * UI can use this to show the password once in a dialog.
     */
    passwordInfo: null,

    // Actions

    /**
     * Fetch all users for current tenant.
     * Returns List<UserDto> from backend.
     */
    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/v1/tenant-admin/users');
            // Backend returns ApiResponse<List<UserDto>>
            const users = Array.isArray(response) ? response : (response?.data || []);
            set({ users, loading: false });
            return users;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            set({ error: error.message || 'Failed to fetch users', loading: false });
            throw error;
        }
    },

    /**
     * Fetch user details by ID.
     * Returns UserDto with permissions.
     */
    fetchUserDetails: async (userId) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get(`/v1/tenant-admin/users/${userId}`);
            // Backend returns ApiResponse<UserDto>
            const user = response?.data || response;
            set({ loading: false });
            return user;
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            set({ error: error.message || 'Failed to fetch user details', loading: false });
            throw error;
        }
    },

    /**
     * Add a new user for current tenant.
     * Uses backend endpoint: POST /v1/tenant-admin/users
     * Body: { firstName, lastName, email, bundleId? }
     * Response: TenantUserCreateResponse with generatedPassword.
     */
    addUser: async (userData) => {
        set({ loading: true, error: null });
        try {
            const profile = userData.profile || {};
            const auth = userData.auth || userData;

            const payload = {
                firstName: auth.firstName || userData.firstName || 'User',
                lastName: auth.lastName || userData.lastName || ' ',
                email: auth.email || auth.corporate_email || userData.email,
                bundleId: auth.bundleId || userData.bundleId || null,
                // Profile fields from nested profile object or flat direct props
                tcNo: profile.tcNo || userData.tcNo || null,
                birthDate: profile.birthDate || userData.birthDate || null,
                address: profile.address || userData.address || null,
                emergencyPerson: profile.emergencyPerson || userData.emergencyPerson || null,
                emergencyPhone: profile.emergencyPhone || userData.emergencyPhone || null,
                phoneNumber: profile.phoneNumber || userData.phoneNumber || null,
                personalEmail: profile.personalEmail || userData.personalEmail || null,
            };

            const response = await apiClient.post('/v1/tenant-admin/users', payload);
            // Response is TenantUserCreateResponse (unwrapped by apiClient)
            const createdUser = response;

            // Refresh user list from backend to keep store in sync
            await get().fetchUsers();

            set({
                loading: false,
                passwordInfo: {
                    type: 'create',
                    userId: createdUser.id,
                    email: createdUser.email,
                    password: createdUser.generatedPassword,
                },
            });

            return createdUser;
        } catch (error) {
            console.error('Failed to add user:', error);
            set({ error: error.message || 'Failed to add user', loading: false });
            throw error;
        }
    },

    /**
     * Update user (placeholder - backend endpoint may need to be created).
     */
    updateUser: async (userId, userData) => {
        set({ loading: true, error: null });
        try {
            // TODO: Backend endpoint needed: PUT /v1/tenant-admin/users/{userId}
            // For now, just refresh the list
            await get().fetchUsers();
            set({ loading: false });
        } catch (error) {
            console.error('Failed to update user:', error);
            set({ error: error.message || 'Failed to update user', loading: false });
            throw error;
        }
    },

    /**
     * Delete user (placeholder - backend endpoint may need to be created).
     */
    deleteUser: async (userId) => {
        set({ loading: true, error: null });
        try {
            // TODO: Backend endpoint needed: DELETE /v1/tenant-admin/users/{userId}
            // For now, just refresh the list
            await get().fetchUsers();
            set({ loading: false });
        } catch (error) {
            console.error('Failed to delete user:', error);
            set({ error: error.message || 'Failed to delete user', loading: false });
            throw error;
        }
    },

    /**
     * Reset a user's password.
     * Uses backend endpoint: POST /v1/tenant-admin/users/{userId}/reset-password
     * Response: PasswordResetResponse with generatedPassword.
     */
    resetPassword: async (userId) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post(`/v1/tenant-admin/users/${userId}/reset-password`);
            const resetInfo = response; // PasswordResetResponse

            set({
                loading: false,
                passwordInfo: {
                    type: 'reset',
                    userId: resetInfo.userId,
                    password: resetInfo.generatedPassword,
                },
            });

            return resetInfo;
        } catch (error) {
            console.error('Failed to reset user password:', error);
            set({ error: error.message || 'Failed to reset user password', loading: false });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Clear last password info (after UI dialog is closed)
    clearPasswordInfo: () => set({ passwordInfo: null }),
}));
