/**
 * React Query Helpers
 * 
 * React Query ile loading ve error state'lerini yönetmek için helper'lar
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner, LoadingSkeleton, ErrorBoundary } from '@common/ui';

/**
 * useQueryWithLoading - Loading state ile query hook
 */
export const useQueryWithLoading = (queryKey, queryFn, options = {}) => {
    const {
        showLoading = true,
        loadingComponent,
        skeletonComponent,
        ...queryOptions
    } = options;

    const query = useQuery({
        queryKey,
        queryFn,
        ...queryOptions
    });

    if (query.isLoading && showLoading) {
        if (skeletonComponent) {
            return { ...query, loadingComponent: skeletonComponent };
        }
        return { ...query, loadingComponent: loadingComponent || <LoadingSpinner /> };
    }

    return query;
};

/**
 * useMutationWithLoading - Loading state ile mutation hook
 */
export const useMutationWithLoading = (mutationFn, options = {}) => {
    const {
        showLoading = false,
        loadingComponent,
        ...mutationOptions
    } = options;

    const mutation = useMutation({
        mutationFn,
        ...mutationOptions
    });

    if (mutation.isPending && showLoading) {
        return { 
            ...mutation, 
            loadingComponent: loadingComponent || <LoadingSpinner size={24} /> 
        };
    }

    return mutation;
};

/**
 * QueryErrorBoundary - React Query errors için error boundary wrapper
 */
export const withQueryErrorBoundary = (Component, errorBoundaryProps = {}) => {
    return (props) => {
        const queryClient = useQueryClient();
        
        // Reset queries on error
        const handleReset = () => {
            queryClient.resetQueries();
        };

        return (
            <ErrorBoundary 
                {...errorBoundaryProps}
                onReset={handleReset}
            >
                <Component {...props} />
            </ErrorBoundary>
        );
    };
};

export default {
    useQueryWithLoading,
    useMutationWithLoading,
    withQueryErrorBoundary
};
