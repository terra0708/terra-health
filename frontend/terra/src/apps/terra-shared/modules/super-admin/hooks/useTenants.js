import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@core/api';

/**
 * Hook for fetching all tenants.
 */
export const useTenants = () => {
    return useQuery({
        queryKey: ['super-admin', 'tenants'],
        queryFn: async () => {
            const response = await apiClient.get('/v1/super-admin/tenants');
            return response;
        },
        retry: 1,
    });
};

/**
 * Hook for fetching a single tenant by ID.
 */
export const useTenant = (tenantId) => {
    return useQuery({
        queryKey: ['super-admin', 'tenants', tenantId],
        queryFn: async () => {
            const response = await apiClient.get(`/v1/super-admin/tenants/${tenantId}`);
            return response;
        },
        enabled: !!tenantId,
        retry: 1,
    });
};

/**
 * Hook for suspending a tenant.
 */
export const useSuspendTenant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tenantId, reason }) => {
            const response = await apiClient.put(`/v1/super-admin/tenants/${tenantId}/suspend`, { reason });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'stats'] });
        },
    });
};

/**
 * Hook for activating a tenant.
 */
export const useActivateTenant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tenantId) => {
            const response = await apiClient.put(`/v1/super-admin/tenants/${tenantId}/activate`);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'stats'] });
        },
    });
};

/**
 * Hook for deleting a tenant.
 */
export const useDeleteTenant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tenantId) => {
            const response = await apiClient.delete(`/v1/super-admin/tenants/${tenantId}`);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'stats'] });
        },
    });
};

/**
 * Hook for toggling a module for a tenant.
 */
export const useToggleModule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tenantId, moduleName, enabled }) => {
            const response = await apiClient.put(`/v1/super-admin/tenants/${tenantId}/modules`, {
                moduleName,
                enabled,
            });
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants', variables.tenantId] });
        },
    });
};

/**
 * Hook for setting quota limits for a tenant.
 */
export const useSetQuotas = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tenantId, quotas }) => {
            const response = await apiClient.put(`/v1/super-admin/tenants/${tenantId}/quotas`, { quotas });
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants', variables.tenantId] });
        },
    });
};

/**
 * Hook for getting tenant modules.
 */
export const useTenantModules = (tenantId) => {
    return useQuery({
        queryKey: ['super-admin', 'tenants', tenantId, 'modules'],
        queryFn: async () => {
            const response = await apiClient.get(`/v1/super-admin/tenants/${tenantId}/modules`);
            return response;
        },
        enabled: !!tenantId,
        retry: 1,
    });
};

/**
 * Hook for updating tenant details (name, domain, maxUsers).
 */
export const useUpdateTenant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tenantId, ...data }) => {
            const response = await apiClient.put(`/v1/super-admin/tenants/${tenantId}`, data);
            return response;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants', variables.tenantId] });
        },
    });
};
