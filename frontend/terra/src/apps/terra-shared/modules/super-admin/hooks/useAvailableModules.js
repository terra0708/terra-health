import { useQuery } from '@tanstack/react-query';
import apiClient from '@core/api';

/**
 * Hook for fetching all available modules from the backend.
 * This returns the complete list of MODULE-level permissions that can be assigned to tenants.
 */
export const useAvailableModules = () => {
    return useQuery({
        queryKey: ['super-admin', 'available-modules'],
        queryFn: async () => {
            const response = await apiClient.get('/v1/super-admin/modules/available');
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
