import { useQuery } from '@tanstack/react-query';
import apiClient from '@core/api';

/**
 * Hook for fetching Super Admin dashboard statistics.
 */
export const useSuperAdminStats = () => {
    return useQuery({
        queryKey: ['super-admin', 'stats'],
        queryFn: async () => {
            const response = await apiClient.get('/v1/super-admin/dashboard/stats');
            return response;
        },
        refetchInterval: 60000, // 1 minute
        staleTime: 30000, // 30 seconds
        retry: 1,
    });
};
