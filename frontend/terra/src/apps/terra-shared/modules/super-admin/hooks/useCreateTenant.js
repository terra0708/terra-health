import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@core/api';

/**
 * Hook for creating a new tenant with admin user and modules.
 */
export const useCreateTenant = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (tenantData) => {
            const response = await apiClient.post('/v1/super-admin/tenants', tenantData);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'stats'] });
        },
    });
};
