import { useQuery } from '@tanstack/react-query';
import apiClient from '@core/api';

/**
 * Hook for fetching Schema Pool statistics.
 * Automatically refetches every 30 seconds to keep data fresh.
 * 
 * @returns {Object} TanStack Query result with schema pool stats
 */
export const useSchemaPoolStats = () => {
    return useQuery({
        queryKey: ['schema-pool', 'stats'],
        queryFn: async () => {
            const response = await apiClient.get('/v1/super-admin/schema-pool/stats');
            return response;
        },
        refetchInterval: 30000, // 30 seconds
        staleTime: 10000, // 10 seconds
        enabled: true,
        retry: 1,
        retryOnMount: true,
    });
};

/**
 * Future: Mutation hook for manual schema provisioning.
 * Currently not used, but prepared for future implementation.
 * 
 * @returns {Object} TanStack Query mutation for provisioning schema
 */
export const useProvisionSchema = () => {
    // This will be implemented when backend endpoint is ready
    // For now, this is a placeholder
    return null;
};
