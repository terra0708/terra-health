import { useQuery } from '@tanstack/react-query';
import apiClient from '@core/api';

/**
 * Hook for fetching audit logs with filters.
 */
export const useAuditLogs = (filters = {}) => {
    const { tenantId, action, fromDate, toDate, page = 0, size = 20 } = filters;
    
    return useQuery({
        queryKey: ['super-admin', 'audit-logs', tenantId, action, fromDate, toDate, page, size],
        queryFn: async () => {
            const params = {
                page,
                size,
            };
            
            if (tenantId) params.tenantId = tenantId;
            if (action) params.action = action;
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            
            const response = await apiClient.get('/v1/super-admin/audit-logs', { params });
            return response;
        },
        retry: 1,
    });
};
