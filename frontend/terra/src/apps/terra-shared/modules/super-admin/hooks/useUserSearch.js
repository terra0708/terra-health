import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@core/api';
import useAuthStore from '@shared/store/authStore';

/**
 * Hook for searching users globally by email.
 */
export const useUserSearch = (email) => {
    return useQuery({
        queryKey: ['super-admin', 'users', 'search', email],
        queryFn: async () => {
            const response = await apiClient.get('/v1/super-admin/users/search', {
                params: { email },
            });
            return response;
        },
        enabled: !!email && email.length >= 3, // Only search if email has at least 3 characters
        retry: 1,
    });
};

/**
 * Hook for resetting a user's password.
 */
export const useResetPassword = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ userId, newPassword }) => {
            const response = await apiClient.put(`/v1/super-admin/users/${userId}/password/reset`, {
                newPassword,
            });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
        },
    });
};

/**
 * Hook for enabling/disabling a user.
 */
export const useSetUserEnabled = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ userId, enabled }) => {
            const response = await apiClient.put(`/v1/super-admin/users/${userId}/enable`, { enabled });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
        },
    });
};

/**
 * Hook for impersonating a user.
 */
export const useImpersonateUser = () => {
    const { setToken, setUser } = useAuthStore();
    
    return useMutation({
        mutationFn: async (userId) => {
            const response = await apiClient.post(`/v1/super-admin/users/${userId}/impersonate`);
            return response;
        },
        onSuccess: (data) => {
            // Set impersonation token
            if (data.impersonationToken) {
                setToken(data.impersonationToken);
                // Update user info if available
                if (data.impersonatedUserEmail) {
                    // Note: You may need to decode JWT to get full user info
                    // For now, just set the token and let the app refresh
                    window.location.reload();
                }
            }
        },
    });
};
