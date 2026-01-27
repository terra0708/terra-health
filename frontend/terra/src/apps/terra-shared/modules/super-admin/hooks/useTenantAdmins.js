import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@core/api';

/**
 * Hook for fetching tenant admins
 */
export const useTenantAdmins = (tenantId) => {
    return useQuery({
        queryKey: ['super-admin', 'tenants', tenantId, 'admins'],
        queryFn: async () => {
            const response = await apiClient.get(`/v1/super-admin/tenants/${tenantId}/admins`);
            return response;
        },
        enabled: !!tenantId,
    });
};

/**
 * Hook for adding an existing user as admin
 */
export const useAddTenantAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, userId }) => {
            const response = await apiClient.post(`/v1/super-admin/tenants/${tenantId}/admins/${userId}`);
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['super-admin', 'tenants', variables.tenantId, 'admins']);
        },
    });
};

/**
 * Hook for removing admin role from a user
 */
export const useRemoveTenantAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, userId }) => {
            const response = await apiClient.delete(`/v1/super-admin/tenants/${tenantId}/admins/${userId}`);
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['super-admin', 'tenants', variables.tenantId, 'admins']);
        },
    });
};

/**
 * Hook for creating a new admin user
 */
export const useCreateTenantAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, firstName, lastName, email, password }) => {
            const response = await apiClient.post(`/v1/super-admin/tenants/${tenantId}/admins`, {
                firstName,
                lastName,
                email,
                password,
            });
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['super-admin', 'tenants', variables.tenantId, 'admins']);
        },
    });
};

/**
 * Hook for updating tenant admin details
 */
export const useUpdateTenantAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, userId, firstName, lastName, email, enabled }) => {
            const response = await apiClient.put(`/v1/super-admin/tenants/${tenantId}/admins/${userId}`, {
                firstName,
                lastName,
                email,
                enabled,
            });
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['super-admin', 'tenants', variables.tenantId, 'admins']);
        },
    });
};

/**
 * Hook for resetting admin password
 */
export const useResetTenantAdminPassword = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, userId, newPassword }) => {
            const response = await apiClient.post(`/v1/super-admin/tenants/${tenantId}/admins/${userId}/reset-password`, {
                newPassword,
            });
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['super-admin', 'tenants', variables.tenantId, 'admins']);
        },
    });
};
