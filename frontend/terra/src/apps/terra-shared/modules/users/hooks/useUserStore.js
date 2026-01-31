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
     * Add a new user (placeholder - backend endpoint may need to be created).
     * For now, this is a placeholder that will need backend implementation.
     */
    addUser: async (userData) => {
        set({ loading: true, error: null });
        try {
            // TODO: Backend endpoint needed: POST /v1/tenant-admin/users
            // For now, just refresh the list
            await get().fetchUsers();
            set({ loading: false });
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

    // Clear error
    clearError: () => set({ error: null }),
}));
