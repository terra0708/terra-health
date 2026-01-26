import { useState } from 'react';
import apiClient from '@shared/core/api';

/**
 * Hook for tenant discovery by email.
 * Used to find which tenant(s) a user belongs to before login.
 */
export const useAuthDiscovery = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Discover tenants associated with an email address.
     * 
     * @param {string} email - Email address to discover
     * @returns {Promise<{tenants: Array, isSingleTenant: boolean, singleTenant: Object|null}>}
     */
    const discoverTenants = async (email) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiClient.post('/v1/auth/discover', { email });
            
            // Response structure: { tenants: [...], isSingleTenant: boolean, singleTenant: {...} }
            const tenants = response.tenants || [];
            const isSingleTenant = tenants.length === 1;
            const singleTenant = isSingleTenant ? tenants[0] : null;

            return {
                tenants,
                isSingleTenant,
                singleTenant
            };
        } catch (err) {
            // Normalize error
            const errorMessage = err.message || 'Failed to discover tenants';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        discoverTenants,
        loading,
        error,
        clearError: () => setError(null)
    };
};
